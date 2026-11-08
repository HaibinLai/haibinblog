import http from 'node:http';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const imageRepo = path.resolve(root, '../image-backend');
const publicDir = path.join(root, 'tools/blog-publisher/public');
const port = Number(process.env.PUBLISHER_PORT || 4322);
const imageBase = 'https://raw.githubusercontent.com/HaibinLai/image-backend/main';

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
};

const safeSlug = (value) => {
  const slug = String(value || '').trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || `post-${Date.now()}`;
};

const yamlQuote = (value) => {
  const text = String(value ?? '');
  return /[:\[\]{}#,!?&*|>'"%@`\n]/.test(text) ? JSON.stringify(text) : text;
};

const yamlList = (value) => {
  const items = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  return `[${items.map(yamlQuote).join(', ')}]`;
};

const remoteImageUrl = (value, name) => {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.href;
  } catch { throw new Error(`${name} 必须是 HTTPS 或 HTTP 图片地址`); }
};

const frontmatter = (data) => {
  const lines = [
    '---',
    `title: ${yamlQuote(data.title)}`,
    `description: ${yamlQuote(data.description || data.title)}`,
    `publishedAt: ${data.publishedAt}`,
    ...(data.updatedAt ? [`updatedAt: ${data.updatedAt}`] : []),
    `category: ${yamlQuote(data.category || 'Research')}`,
    `categories: ${yamlList(data.categories)}`,
    `tags: ${yamlList(data.tags)}`,
    ...(data.language ? [`language: ${data.language}`] : []),
    ...(data.translationKey ? [`translationKey: ${yamlQuote(data.translationKey)}`] : []),
    `draft: ${data.draft ? 'true' : 'false'}`,
    ...(data.cardImage ? [`cardImage: ${yamlQuote(data.cardImage)}`] : []),
    ...(data.featuredImage ? [`featuredImage: ${yamlQuote(data.featuredImage)}`] : []),
    ...(data.featuredRank ? [`featuredRank: ${Number(data.featuredRank)}`] : []),
    ...(data.featuredTitle ? [`featuredTitle: ${yamlQuote(data.featuredTitle)}`] : []),
    ...(data.featuredLabel ? [`featuredLabel: ${yamlQuote(data.featuredLabel)}`] : []),
    `showCitation: ${data.showCitation ? 'true' : 'false'}`,
    '---',
    '',
  ];
  return `${lines.join('\n')}${data.body.trim()}\n`;
};

const readJson = async (req) => {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 2_000_000) throw new Error('Request is too large');
  }
  return JSON.parse(raw || '{}');
};

const run = (cwd, args) => new Promise((resolve, reject) => {
  const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = ''; let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', reject);
  child.on('close', (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim() || `git exited with ${code}`)));
});

async function commitAndPush(cwd, paths, message) {
  await run(cwd, ['add', '--', ...paths]);
  const staged = await run(cwd, ['diff', '--cached', '--name-only', '--', ...paths]);
  if (staged) await run(cwd, ['commit', '-m', message, '--', ...paths]);
  // A previous attempt may have committed successfully but failed to push.
  await run(cwd, ['push', 'origin', 'main']);
  return true;
}

async function gitFileStatus(cwd, relative) {
  const changes = await run(cwd, ['status', '--porcelain', '--', relative]);
  if (changes) return { state: 'local', message: '本地文件有未提交的改动' };
  const tracked = await run(cwd, ['ls-files', '--error-unmatch', '--', relative]).then(() => true, () => false);
  if (!tracked) return { state: 'local', message: '仅保存在本地，尚未提交' };
  const [localHead, remoteRef] = await Promise.all([
    run(cwd, ['rev-parse', 'HEAD']),
    run(cwd, ['ls-remote', 'origin', 'refs/heads/main']),
  ]);
  const remoteHead = remoteRef.split(/\s+/)[0];
  if (!remoteHead) return { state: 'unknown', message: '无法读取 GitHub 主分支' };
  if (localHead !== remoteHead) return { state: 'pending', message: '本地与 GitHub 提交不同，尚不能确认' };
  return { state: 'pushed', message: '已推送到 GitHub', commit: localHead.slice(0, 7) };
}

function managedImagePath(imageUrl) {
  if (!imageUrl) return null;
  let url;
  try { url = new URL(imageUrl); }
  catch { return null; }
  const base = new URL(imageBase);
  if (url.origin !== base.origin || !url.pathname.startsWith(`${base.pathname}/`)) return null;
  const parts = url.pathname.slice(base.pathname.length + 1).split('/').map(decodeURIComponent);
  if (parts.some((part) => !part || part === '.' || part === '..' || /[/\\]/.test(part))) return null;
  return path.join(...parts);
}

function parsePostSource(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!block) throw new Error('文章缺少有效的 frontmatter');
  return { metadata: yaml.load(block[1], { schema: yaml.JSON_SCHEMA }) || {}, body: source.slice(block[0].length) };
}

async function handleDraft(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const requestedSlug = url.searchParams.get('slug')?.trim();
  if (!requestedSlug) throw new Error('请先填写文件名');
  const relative = path.join('src/content/posts', `${safeSlug(requestedSlug)}.md`);
  let source;
  try {
    source = await readFile(path.join(root, relative), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return send(res, 404, { error: '文章尚未保存' }, { 'Cache-Control': 'no-store' });
    throw error;
  }
  send(res, 200, parsePostSource(source), { 'Cache-Control': 'no-store' });
}

async function handlePushStatus(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const requestedSlug = url.searchParams.get('slug')?.trim();
  if (!requestedSlug) throw new Error('请先填写标题或文件名');
  const slug = safeSlug(requestedSlug);
  const relative = path.join('src/content/posts', `${slug}.md`);
  let source;
  try {
    source = await readFile(path.join(root, relative), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return send(res, 200, { article: { state: 'missing', message: '尚未保存到本地' }, image: { state: 'none', message: '保存文章后再检测图片' } }, { 'Cache-Control': 'no-store' });
    throw error;
  }
  const { metadata } = parsePostSource(source);
  const imageUrl = url.searchParams.get('imageUrl') || metadata.cardImage || '';
  const imagePath = managedImagePath(imageUrl);
  const [article, image] = await Promise.all([
    gitFileStatus(root, relative).catch((error) => ({ state: 'unknown', message: `检测失败：${error.message}` })),
    imagePath
      ? gitFileStatus(imageRepo, imagePath).catch((error) => ({ state: 'unknown', message: `检测失败：${error.message}` }))
      : Promise.resolve({ state: 'none', message: imageUrl ? '外部图片，不由图片仓库推送' : '这篇文章没有封面图片' }),
  ]);
  send(res, 200, { article, image, draft: metadata.draft === true, file: relative, imageUrl }, { 'Cache-Control': 'no-store' });
}

async function requireGitRepository(cwd, name) {
  try {
    const actualRoot = await run(cwd, ['rev-parse', '--show-toplevel']);
    if (actualRoot !== cwd) throw new Error('Unexpected repository root');
  } catch {
    throw new Error(`${name} 不是 Git 仓库；文章和图片均未保存。请先克隆对应仓库，或取消“保存后提交并推送到 GitHub”。`);
  }
}

async function saveImage(image) {
  if (!image?.name || !image.data) return null;
  const extension = path.extname(image.name).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(extension)) throw new Error('图片格式只支持 PNG、JPG、WebP、GIF 或 SVG');
  const month = String(image.month || '').match(/^\d{4}-\d{2}$/)?.[0];
  if (!month) throw new Error('图片月份格式应为 YYYY-MM');
  const slug = safeSlug(image.slug);
  const bytes = Buffer.from(image.data, 'base64');
  if (!bytes.length) throw new Error('图片内容为空');
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const filename = `${safeSlug(path.basename(image.name, extension)) || 'image'}-${digest}${extension}`;
  const relative = path.join(month, slug, filename);
  const target = path.join(imageRepo, relative);
  if (!target.startsWith(`${imageRepo}${path.sep}`)) throw new Error('图片路径无效');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(image.data, 'base64'));
  return `${imageBase}/${relative.split(path.sep).map(encodeURIComponent).join('/')}`;
}

async function handleSave(req, res) {
  const data = await readJson(req);
  if (!data.title?.trim() || !data.body?.trim()) throw new Error('标题和正文不能为空');
  data.cardImage = remoteImageUrl(data.cardImage, '封面图片 URL');
  data.featuredImage = remoteImageUrl(data.featuredImage, '精选横幅 URL');
  if (data.push) {
    await requireGitRepository(root, '博客目录');
    if (data.image) await requireGitRepository(imageRepo, '图片目录');
  }
  const slug = safeSlug(data.slug || data.title);
  const imageUrl = await saveImage(data.image);
  if (imageUrl && !data.cardImage) data.cardImage = imageUrl;
  const body = imageUrl
    ? String(data.body).replaceAll('{{UPLOADED_IMAGE}}', `![${data.image.name}](${imageUrl})`)
    : String(data.body).replaceAll('{{UPLOADED_IMAGE}}', '');
  const relative = path.join('src/content/posts', `${slug}.md`);
  const filename = path.join(root, relative);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, frontmatter({ ...data, body, slug }), 'utf8');
  const result = { file: relative, slug, imageUrl, url: `https://haibinlai.github.io/haibinblog/posts/${encodeURIComponent(slug)}/` };
  if (data.push) {
    try {
      if (imageUrl) {
        const imagePath = path.join(data.image.month, safeSlug(data.image.slug), path.basename(new URL(imageUrl).pathname));
        result.imagesPushed = await commitAndPush(imageRepo, [imagePath], `Add images for ${slug}`);
      }
      result.pushed = await commitAndPush(root, [relative], `Add post: ${data.title.trim()}`);
    } catch (error) {
      result.pushError = error.message;
    }
  }
  send(res, 200, result);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/save') return await handleSave(req, res);
    if (req.method === 'GET' && req.url === '/api/config') return send(res, 200, { root, imageRepo, port });
    if (req.method === 'GET' && req.url.startsWith('/api/draft?')) return await handleDraft(req, res);
    if (req.method === 'GET' && req.url.startsWith('/api/push-status?')) return await handlePushStatus(req, res);
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
    const requested = req.url === '/' ? 'index.html' : req.url.replace(/^\//, '');
    const file = path.resolve(publicDir, requested);
    if (!file.startsWith(`${publicDir}${path.sep}`)) return send(res, 403, { error: 'Forbidden' });
    const content = await readFile(file);
    const type = file.endsWith('.css') ? 'text/css; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(content);
  } catch (error) {
    send(res, 400, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Blog publisher: http://127.0.0.1:${port}`));

import http from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
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
const siteBase = process.env.PUBLISHER_SITE_URL || 'https://www.haibinlaiblog.top/';
const postUrl = (slug) => new URL(`posts/${encodeURIComponent(slug)}/`, siteBase.endsWith('/') ? siteBase : `${siteBase}/`).href;

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
    `publisherRevision: ${randomUUID()}`,
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
  if (changes) return { state: 'local', committed: false, message: '本地文件有未提交的改动' };
  const tracked = await run(cwd, ['ls-files', '--error-unmatch', '--', relative]).then(() => true, () => false);
  if (!tracked) return { state: 'local', committed: false, message: '仅保存在本地，尚未提交' };
  const localBlob = await run(cwd, ['rev-parse', `HEAD:${relative.split(path.sep).join('/')}`]).catch(() => null);
  if (!localBlob) return { state: 'local', committed: false, message: '文件尚未提交' };
  const [localHead, remoteRef] = await Promise.all([
    run(cwd, ['rev-parse', 'HEAD']),
    run(cwd, ['ls-remote', 'origin', 'refs/heads/main']),
  ]);
  const remoteHead = remoteRef.split(/\s+/)[0];
  if (!remoteHead) return { state: 'unknown', committed: true, localCommit: localHead.slice(0, 7), message: '无法读取 GitHub 主分支' };
  if (localHead !== remoteHead) {
    await run(cwd, ['fetch', '--no-tags', 'origin', 'main']);
    const remoteBlob = await run(cwd, ['rev-parse', `FETCH_HEAD:${relative.split(path.sep).join('/')}`]).catch(() => null);
    if (localBlob !== remoteBlob) return { state: 'pending', committed: true, localCommit: localHead.slice(0, 7), message: '已提交，但当前文件尚未推送' };
  }
  return { state: 'pushed', committed: true, localCommit: localHead.slice(0, 7), message: '已推送到 GitHub', commit: remoteHead.slice(0, 7) };
}

async function siteStatus(url, revision) {
  const checkUrl = new URL(url);
  checkUrl.searchParams.set('publisher_check', revision || String(Date.now()));
  try {
    const response = await fetch(checkUrl, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (response.status === 404) return { state: 'waiting', message: '网站尚未生成这篇文章' };
    if (!response.ok) return { state: 'unknown', message: `网站返回 HTTP ${response.status}` };
    if (!revision) return { state: 'unverified', message: '页面可访问；旧文章没有版本标记' };
    const html = await response.text();
    return html.includes(`data-publisher-revision="${revision}"`)
      ? { state: 'complete', message: '当前版本已在网站显示' }
      : { state: 'waiting', message: '网站仍是旧版本，等待部署' };
  } catch {
    return { state: 'unknown', message: '暂时无法访问网站，请稍后重试' };
  }
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
    if (error.code === 'ENOENT') return send(res, 200, {
      article: { state: 'missing', message: '尚未保存到本地' },
      image: { state: 'none', message: '保存文章后再检测图片' },
      pipeline: {
        local: { state: 'waiting', message: '尚未保存' }, commit: { state: 'waiting', message: '等待保存' },
        remote: { state: 'waiting', message: '等待提交' }, site: { state: 'waiting', message: '等待发布' },
      },
      url: postUrl(slug), draft: false,
    }, { 'Cache-Control': 'no-store' });
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
  const draft = metadata.draft === true;
  const publicUrl = postUrl(slug);
  const pipeline = {
    local: { state: 'complete', message: '文章已保存在本地' },
    commit: article.committed ? { state: 'complete', message: `本地提交 ${article.localCommit}` } : { state: 'waiting', message: '当前版本尚未提交' },
    remote: article.state === 'pushed' ? { state: 'complete', message: `GitHub main@${article.commit}` } : { state: article.state === 'unknown' ? 'unknown' : 'waiting', message: article.message },
    site: draft
      ? { state: 'blocked', message: '草稿不会生成公开页面' }
      : article.state === 'pushed'
        ? await siteStatus(publicUrl, metadata.publisherRevision)
        : { state: 'waiting', message: '等待当前版本推送' },
  };
  send(res, 200, { article, image, pipeline, draft, file: relative, imageUrl, url: publicUrl,
    sourceHash: createHash('sha256').update(source).digest('hex'),
    publishedAt: metadata.publishedAt }, { 'Cache-Control': 'no-store' });
}

async function handlePublish(req, res) {
  const data = await readJson(req);
  if (!data.slug || !data.sourceHash) throw new Error('请先重新检测草稿状态');
  const slug = safeSlug(data.slug);
  const relative = path.join('src/content/posts', `${slug}.md`);
  const filename = path.join(root, relative);
  const source = await readFile(filename, 'utf8');
  if (createHash('sha256').update(source).digest('hex') !== data.sourceHash) throw new Error('草稿已改变，请重新检测后再发布');
  const { metadata, body } = parsePostSource(source);
  if (metadata.draft !== true) throw new Error('这篇文章已经不是草稿');
  await requireGitRepository(root, '博客目录');
  const imagePath = managedImagePath(metadata.cardImage);
  if (imagePath) {
    await requireGitRepository(imageRepo, '图片目录');
    await readFile(path.join(imageRepo, imagePath));
  }
  metadata.draft = false;
  metadata.publisherRevision = randomUUID();
  await writeFile(filename, `---\n${yaml.dump(metadata, { schema: yaml.JSON_SCHEMA, lineWidth: -1, noRefs: true })}---\n${body}`, 'utf8');
  const result = { file: relative, slug, url: postUrl(slug) };
  try {
    if (imagePath) await commitAndPush(imageRepo, [imagePath], `Publish cover for ${slug}`);
    await commitAndPush(root, [relative], `Publish post: ${metadata.title}`);
  } catch (error) { result.pushError = error.message; }
  send(res, 200, result, { 'Cache-Control': 'no-store' });
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
  const result = { file: relative, slug, imageUrl, url: postUrl(slug) };
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
    if (req.method === 'POST' && req.url === '/api/publish') return await handlePublish(req, res);
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

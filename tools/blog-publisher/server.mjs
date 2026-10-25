import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function saveImage(image) {
  if (!image?.name || !image.data) return null;
  const extension = path.extname(image.name).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(extension)) throw new Error('图片格式只支持 PNG、JPG、WebP、GIF 或 SVG');
  const month = String(image.month || '').match(/^\d{4}-\d{2}$/)?.[0];
  if (!month) throw new Error('图片月份格式应为 YYYY-MM');
  const slug = safeSlug(image.slug);
  const filename = `${safeSlug(path.basename(image.name, extension)) || 'image'}${extension}`;
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
  const slug = safeSlug(data.slug || data.title);
  const imageUrl = await saveImage(data.image);
  if (imageUrl && !data.cardImage) data.cardImage = imageUrl;
  const relative = path.join('src/content/posts', `${slug}.md`);
  const filename = path.join(root, relative);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, frontmatter({ ...data, slug }), 'utf8');
  const result = { file: relative, slug, imageUrl, url: `/haibinblog/posts/${encodeURIComponent(slug)}/` };
  if (data.push) {
    await run(root, ['add', relative]);
    await run(root, ['commit', '-m', `Add post: ${data.title.trim()}`]);
    await run(root, ['push', 'origin', 'main']);
    result.pushed = true;
    if (imageUrl) {
      await run(imageRepo, ['add', '.']);
      await run(imageRepo, ['commit', '-m', `Add images for ${slug}`]);
      await run(imageRepo, ['push', 'origin', 'main']);
      result.imagesPushed = true;
    }
  }
  send(res, 200, result);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/save') return await handleSave(req, res);
    if (req.method === 'GET' && req.url === '/api/config') return send(res, 200, { root, imageRepo, port });
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
    const requested = req.url === '/' ? 'index.html' : req.url.replace(/^\//, '');
    const file = path.resolve(publicDir, requested);
    if (!file.startsWith(`${publicDir}${path.sep}`)) return send(res, 403, { error: 'Forbidden' });
    const content = await readFile(file);
    const type = file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(content);
  } catch (error) {
    send(res, 400, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Blog publisher: http://127.0.0.1:${port}`));

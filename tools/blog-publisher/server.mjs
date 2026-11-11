import http from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { lstat, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { commitAndPush } from './publish-git.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const imageRepo = path.resolve(root, '../image-backend');
const postsDir = path.join(root, 'src/content/posts');
const trashDir = path.join(root, 'blog-publisher-trash/posts');
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

const sourceHash = (source) => createHash('sha256').update(source).digest('hex');
const postId = (value) => {
  const id = String(value || '');
  if (!/\.mdx?$/.test(id) || path.isAbsolute(id) || id.includes('\\') || id.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error('文章路径无效');
  }
  return id;
};
const postFile = (id, directory = postsDir) => {
  const filename = path.resolve(directory, postId(id));
  if (!filename.startsWith(`${directory}${path.sep}`)) throw new Error('文章路径无效');
  return filename;
};
const postLink = (id, metadata) => postUrl(metadata.slug || id.replace(/^wordpress\//, '').replace(/\.mdx?$/, ''));
const serializedPost = (metadata, body) => `---\n${yaml.dump(metadata, { schema: yaml.JSON_SCHEMA, lineWidth: -1, noRefs: true })}---\n${body.startsWith('\n') ? body : `\n${body}`}`;

async function listFiles(directory, prefix = '') {
  const files = [];
  let entries;
  try { entries = await readdir(path.join(directory, prefix), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return files; throw error; }
  for (const entry of entries) {
    const id = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(directory, id));
    else if (entry.isFile() && /\.mdx?$/.test(entry.name)) files.push(id);
  }
  return files;
}

async function listPosts(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const filter = url.searchParams.get('filter') || 'all';
  if (!['all', 'published', 'draft', 'trash'].includes(filter)) throw new Error('筛选条件无效');
  const query = (url.searchParams.get('q') || '').trim().toLocaleLowerCase();
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const directories = filter === 'trash' ? [[trashDir, true]] : [[postsDir, false]];
  const items = [];
  for (const [directory, trashed] of directories) {
    for (const id of await listFiles(directory)) {
      const source = await readFile(postFile(id, directory), 'utf8');
      let metadata;
      try { metadata = parsePostSource(source).metadata; }
      catch { metadata = {}; }
      const item = {
        id, title: metadata.title || path.basename(id), category: metadata.category || '',
        publishedAt: String(metadata.publishedAt || ''), draft: metadata.draft === true,
        tags: Array.isArray(metadata.tags) ? metadata.tags : [], trashed,
        url: trashed || metadata.draft === true ? null : postLink(id, metadata),
        sourceHash: sourceHash(source),
      };
      if (filter === 'draft' && !item.draft || filter === 'published' && item.draft) continue;
      if (query && ![item.title, item.id, item.category, ...item.tags].join(' ').toLocaleLowerCase().includes(query)) continue;
      items.push(item);
    }
  }
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));
  const pageSize = 30;
  send(res, 200, { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pages: Math.max(1, Math.ceil(items.length / pageSize)) }, { 'Cache-Control': 'no-store' });
}

async function listCategories(req, res) {
  const counts = new Map([['Research', 0]]);
  for (const id of await listFiles(postsDir)) {
    try {
      const { metadata } = parsePostSource(await readFile(postFile(id), 'utf8'));
      const values = [metadata.category, ...(Array.isArray(metadata.categories) ? metadata.categories : [])];
      for (const value of values) {
        if (typeof value !== 'string' || !value.trim()) continue;
        const category = value.trim();
        counts.set(category, (counts.get(category) || 0) + 1);
      }
    } catch { /* Ignore articles without valid frontmatter. */ }
  }
  const categories = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
  send(res, 200, { categories }, { 'Cache-Control': 'no-store' });
}

async function readPost(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const id = postId(url.searchParams.get('id'));
  const source = await readFile(postFile(id), 'utf8');
  const { metadata, body } = parsePostSource(source);
  send(res, 200, { id, metadata, body, sourceHash: sourceHash(source), url: postLink(id, metadata) }, { 'Cache-Control': 'no-store' });
}

async function movePost(req, res, restore) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
    return send(res, 403, { error: '只允许从本地文章管理器执行此操作' });
  }
  const data = await readJson(req);
  const id = postId(data.id);
  const from = postFile(id, restore ? trashDir : postsDir);
  const to = postFile(id, restore ? postsDir : trashDir);
  const source = await readFile(from, 'utf8');
  if (sourceHash(source) !== data.sourceHash) throw new Error('文章已改变，请刷新列表后再试');
  try { await lstat(to); throw new Error('目标位置已有同名文章，请先处理冲突'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (data.push) await requireGitRepository(root, '博客目录');
  await mkdir(path.dirname(to), { recursive: true });
  await rename(from, to);
  const result = { id, restored: restore };
  if (data.push) {
    try {
      const paths = [path.relative(root, from), path.relative(root, to)];
      await commitAndPush(root, paths, `${restore ? 'Restore' : 'Trash'} post: ${id}`);
      result.pushed = true;
    } catch (error) { result.pushError = error.message; }
  }
  send(res, 200, result, { 'Cache-Control': 'no-store' });
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
  send(res, 200, { ...parsePostSource(source), id: `${safeSlug(requestedSlug)}.md`, sourceHash: sourceHash(source) }, { 'Cache-Control': 'no-store' });
}

async function handlePushStatus(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const requestedSlug = url.searchParams.get('slug')?.trim();
  const id = url.searchParams.has('id') ? postId(url.searchParams.get('id')) : `${safeSlug(requestedSlug)}.md`;
  if (!requestedSlug && !url.searchParams.has('id')) throw new Error('请先填写标题或文件名');
  const slug = id.replace(/^wordpress\//, '').replace(/\.mdx?$/, '');
  const relative = path.join('src/content/posts', id);
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
  const publicUrl = postLink(id, metadata);
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
  if ((!data.slug && !data.id) || !data.sourceHash) throw new Error('请先重新检测草稿状态');
  const id = data.id ? postId(data.id) : `${safeSlug(data.slug)}.md`;
  const slug = id.replace(/^wordpress\//, '').replace(/\.mdx?$/, '');
  const relative = path.join('src/content/posts', id);
  const filename = path.join(root, relative);
  const source = await readFile(filename, 'utf8');
  if (sourceHash(source) !== data.sourceHash) throw new Error('草稿已改变，请重新检测后再发布');
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
  const updatedSource = serializedPost(metadata, body);
  await writeFile(filename, updatedSource, 'utf8');
  const result = { file: relative, slug, sourceHash: sourceHash(updatedSource), url: postLink(id, metadata) };
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.publishedAt)) throw new Error('请选择有效的发布日期');
  if (data.updatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt)) throw new Error('更新日期格式无效');
  if (data.translationKey && !data.language) throw new Error('双语关联 ID 需要指定语言');
  data.cardImage = remoteImageUrl(data.cardImage, '封面图片 URL');
  data.featuredImage = remoteImageUrl(data.featuredImage, '精选横幅 URL');
  const editId = data.sourceId ? postId(data.sourceId) : null;
  const slug = editId ? editId.replace(/^wordpress\//, '').replace(/\.mdx?$/, '') : safeSlug(data.slug || data.title);
  const relative = path.join('src/content/posts', editId || `${slug}.md`);
  const filename = editId ? postFile(editId) : path.join(root, relative);
  let original = null;
  if (editId) {
    const source = await readFile(filename, 'utf8');
    if (!data.sourceHash || sourceHash(source) !== data.sourceHash) throw new Error('文章已被其他操作修改，请重新打开后再编辑');
    original = parsePostSource(source);
  } else {
    try { await lstat(filename); throw new Error('同名文章已存在，请在文章管理器中打开编辑'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (data.push) {
    await requireGitRepository(root, '博客目录');
    if (data.image) await requireGitRepository(imageRepo, '图片目录');
  }
  const imageUrl = await saveImage(data.image);
  if (imageUrl && !data.cardImage) data.cardImage = imageUrl;
  const body = imageUrl
    ? String(data.body).replaceAll('{{UPLOADED_IMAGE}}', `![${data.image.name}](${imageUrl})`)
    : String(data.body).replaceAll('{{UPLOADED_IMAGE}}', '');
  await mkdir(path.dirname(filename), { recursive: true });
  let source;
  let metadata;
  if (original) {
    metadata = { ...original.metadata };
    metadata.title = data.title.trim();
    metadata.description = data.description?.trim() || metadata.title;
    if (String(metadata.publishedAt).slice(0, 10) !== data.publishedAt) metadata.publishedAt = data.publishedAt;
    if (data.updatedAt) {
      if (String(metadata.updatedAt || '').slice(0, 10) !== data.updatedAt) metadata.updatedAt = data.updatedAt;
    } else delete metadata.updatedAt;
    metadata.category = data.category?.trim() || 'Research';
    metadata.categories = String(data.categories || '').split(',').map((item) => item.trim()).filter(Boolean);
    metadata.tags = String(data.tags || '').split(',').map((item) => item.trim()).filter(Boolean);
    for (const key of ['language', 'translationKey', 'featuredTitle', 'featuredLabel']) {
      if (data[key]?.trim()) metadata[key] = data[key].trim();
      else delete metadata[key];
    }
    for (const key of ['cardImage', 'featuredImage']) {
      if (data[key] || key === 'cardImage' && imageUrl) metadata[key] = data[key] || imageUrl;
      else delete metadata[key];
    }
    if (data.featuredRank) metadata.featuredRank = Number(data.featuredRank);
    else delete metadata.featuredRank;
    metadata.draft = data.draft === true;
    metadata.showCitation = data.showCitation === true;
    metadata.publisherRevision = randomUUID();
    source = serializedPost(metadata, `\n${body.trimEnd()}\n`);
  } else {
    source = frontmatter({ ...data, body, slug });
  }
  await writeFile(filename, source, 'utf8');
  const result = { file: relative, id: editId || `${slug}.md`, sourceHash: sourceHash(source), slug, imageUrl, url: editId ? postLink(editId, metadata) : postUrl(slug) };
  if (data.push) {
    try {
      if (imageUrl) {
        const imagePath = path.join(data.image.month, safeSlug(data.image.slug), path.basename(new URL(imageUrl).pathname));
        result.imagesPushed = await commitAndPush(imageRepo, [imagePath], `Add images for ${slug}`);
      }
      result.pushed = await commitAndPush(root, [relative], `${editId ? 'Update' : 'Add'} post: ${data.title.trim()}`);
    } catch (error) {
      result.pushError = error.message;
    }
  }
  send(res, 200, result);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.headers.host !== `127.0.0.1:${port}`) return send(res, 403, { error: 'This writer is only available on localhost' });
    if (req.method === 'POST' && req.headers.origin !== `http://127.0.0.1:${port}`) return send(res, 403, { error: '只允许从本地写作器提交修改' });
    if (req.method === 'POST' && req.url === '/api/save') return await handleSave(req, res);
    if (req.method === 'POST' && req.url === '/api/publish') return await handlePublish(req, res);
    if (req.method === 'POST' && req.url === '/api/post/trash') return await movePost(req, res, false);
    if (req.method === 'POST' && req.url === '/api/post/restore') return await movePost(req, res, true);
    if (req.method === 'GET' && req.url === '/api/config') return send(res, 200, { root, imageRepo, port });
    if (req.method === 'GET' && req.url.startsWith('/api/draft?')) return await handleDraft(req, res);
    if (req.method === 'GET' && req.url.startsWith('/api/posts')) return await listPosts(req, res);
    if (req.method === 'GET' && req.url === '/api/categories') return await listCategories(req, res);
    if (req.method === 'GET' && req.url.startsWith('/api/post?')) return await readPost(req, res);
    if (req.method === 'GET' && req.url.startsWith('/api/push-status?')) return await handlePushStatus(req, res);
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const requested = pathname === '/' ? 'index.html' : ['/manager', '/manager/'].includes(pathname) ? 'manager.html' : pathname.replace(/^\//, '');
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

#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const [xmlArgument, outputArgument = '.private-import'] = process.argv.slice(2);
if (!xmlArgument) {
  console.error('Usage: node scripts/import-wordpress-private.mjs /path/to/export.xml [output-directory]');
  process.exit(2);
}

const xmlPath = path.resolve(xmlArgument);
const outputDirectory = path.resolve(outputArgument);
const envPath = path.resolve('.dev.vars');

function asArray(value) {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function readEnvValue(source, key) {
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (match?.[1] === key) return match[2].replace(/^(['"])(.*)\1$/, '$2').trim();
  }
  return '';
}

function cleanXml(source) {
  return source.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
}

function sql(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}

function unixTimestamp(value, fallback = 0) {
  if (!value || value.startsWith('0000-00-00')) return fallback;
  const parsed = Date.parse(`${value.replace(' ', 'T')}Z`);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : fallback;
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});
turndown.use(gfm);
turndown.remove(['script', 'style', 'noscript']);
turndown.addRule('lazyImageSource', {
  filter: 'img',
  replacement(_content, node) {
    const source = node.getAttribute('data-src') || node.getAttribute('data-lazy-src') || node.getAttribute('src') || '';
    const alt = (node.getAttribute('alt') || '').replaceAll('[', '\\[').replaceAll(']', '\\]');
    const title = node.getAttribute('title');
    return source ? `![${alt}](${source}${title ? ` "${title.replaceAll('"', '\\"')}"` : ''})` : '';
  },
});

function markdown(value) {
  return turndown.turndown(String(value || '').trim()).replace(/\n{3,}/g, '\n\n').trim();
}

function summary(excerpt, content) {
  const source = markdown(excerpt || content)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_`#>|~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return source.length <= 220 ? source : `${source.slice(0, 219).trimEnd()}…`;
}

function categoryValue(category) {
  return typeof category === 'string' ? category : String(category?.['#text'] || '');
}

function categoryDomain(category) {
  return typeof category === 'object' ? String(category?.['@_domain'] || '') : '';
}

const [xmlSource, envSource] = await Promise.all([
  fs.readFile(xmlPath, 'utf8'),
  fs.readFile(envPath, 'utf8'),
]);
const ownerEmail = readEnvValue(envSource, 'ALLOWED_EMAIL').toLowerCase();
if (!ownerEmail || !ownerEmail.includes('@')) throw new Error('ALLOWED_EMAIL is missing from .dev.vars');

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  processEntities: true,
});
const document = parser.parse(cleanXml(xmlSource));
const items = asArray(document?.rss?.channel?.item);
const records = [];

for (const item of items) {
  if (String(item['wp:post_type'] || '').trim() !== 'post') continue;
  const sourceStatus = String(item['wp:status'] || '').trim();
  const passwordProtected = Boolean(String(item['wp:post_password'] || '').trim());
  if (sourceStatus !== 'private' && !passwordProtected) continue;

  const wordpressId = String(item['wp:post_id'] || '').trim();
  const rawContent = String(item['content:encoded'] || '');
  const rawExcerpt = String(item['excerpt:encoded'] || '');
  const createdAt = unixTimestamp(item['wp:post_date_gmt'], unixTimestamp(item['wp:post_date']));
  const updatedAt = unixTimestamp(item['wp:post_modified_gmt'], unixTimestamp(item['wp:post_modified'], createdAt));
  const categories = asArray(item.category);
  const tags = [...new Set([
    'wordpress-private',
    ...categories
      .filter((category) => ['category', 'post_tag'].includes(categoryDomain(category)))
      .map(categoryValue)
      .map((value) => value.trim())
      .filter(Boolean),
    ...(passwordProtected ? ['password-protected'] : []),
  ])].slice(0, 20);

  records.push({
    id: `wp-${wordpressId}`,
    wordpressId,
    ownerEmail,
    title: String(item.title || 'Untitled').trim() || 'Untitled',
    excerpt: summary(rawExcerpt, rawContent),
    content: markdown(rawContent),
    tags,
    status: ['pending', 'draft'].includes(sourceStatus) ? 'draft' : 'published',
    pinned: false,
    createdAt,
    updatedAt,
    sourceStatus,
    passwordProtected,
  });
}

await fs.mkdir(outputDirectory, { recursive: true });
const statements = [];
for (const post of records) {
  statements.push(
    `INSERT OR IGNORE INTO private_posts (id,owner_email,title,excerpt,content,tags,status,pinned,created_at,updated_at) VALUES (` +
    [
      sql(post.id), sql(post.ownerEmail), sql(post.title), sql(post.excerpt), sql(post.content),
      sql(JSON.stringify(post.tags)), sql(post.status), Number(post.pinned), post.createdAt, post.updatedAt,
    ].join(',') + ');',
  );
}
const sqlPath = path.join(outputDirectory, 'private-posts.sql');
const manifestPath = path.join(outputDirectory, 'manifest.json');
await Promise.all([
  fs.writeFile(sqlPath, `${statements.join('\n')}\n`),
  fs.writeFile(manifestPath, `${JSON.stringify(records.map(({ ownerEmail: _, content, ...post }) => ({ ...post, contentLength: content.length })), null, 2)}\n`),
]);

console.log(JSON.stringify({ posts: records.length, sqlPath, manifestPath }));

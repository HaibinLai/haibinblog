import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { commitAndPush } from './publish-git.mjs';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const put = async (cwd, filename, content) => {
  await mkdir(path.dirname(path.join(cwd, filename)), { recursive: true });
  await writeFile(path.join(cwd, filename), content);
};
const commit = (cwd, message) => { git(cwd, 'add', '-A'); git(cwd, 'commit', '-m', message); };
async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'publisher-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const remote = path.join(directory, 'remote.git');
  const local = path.join(directory, 'local');
  const other = path.join(directory, 'other');
  git(directory, 'init', '--bare', '--initial-branch=main', remote);
  git(directory, 'clone', remote, local);
  git(local, 'config', 'user.name', 'Publisher Test');
  git(local, 'config', 'user.email', 'publisher@example.invalid');
  await put(local, 'post.md', 'original post\n');
  await put(local, 'unrelated.txt', 'original unrelated\n');
  commit(local, 'Initial content');
  git(local, 'push', 'origin', 'main');
  git(directory, 'clone', remote, other);
  git(other, 'config', 'user.name', 'Remote Writer');
  git(other, 'config', 'user.email', 'writer@example.invalid');
  return { directory, remote, local, other };
}
const shellQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
async function raceHook(f, filename, content) {
  await put(f.other, filename, content);
  commit(f.other, 'Concurrent remote update');
  const marker = path.join(f.directory, 'hook-ran');
  const hook = path.join(f.local, '.git/hooks/pre-push');
  await writeFile(hook, `#!/bin/sh\nif [ ! -f ${shellQuote(marker)} ]; then\n  touch ${shellQuote(marker)}\n  git -C ${shellQuote(f.other)} push origin main || exit 1\nfi\n`);
  await chmod(hook, 0o755);
}

test('publishes only selected files from a feature branch onto updated main', async (t) => {
  const f = await fixture(t);
  git(f.local, 'switch', '-c', 'feature');
  await put(f.local, 'feature-only.txt', 'unfinished feature\n');
  commit(f.local, 'Unpublished feature');
  await put(f.local, 'unrelated.txt', 'staged local edit\n');
  git(f.local, 'add', 'unrelated.txt');
  await put(f.local, 'untracked.txt', 'local only\n');
  await put(f.other, 'remote-only.txt', 'keep remote update\n');
  commit(f.other, 'Remote update');
  git(f.other, 'push', 'origin', 'main');
  const mainBefore = git(f.local, 'rev-parse', 'main');
  await put(f.local, 'post.md', 'updated post\n');
  await commitAndPush(f.local, ['post.md'], 'Publish post');
  assert.equal(git(f.remote, 'show', 'main:post.md'), 'updated post');
  assert.equal(git(f.remote, 'show', 'main:remote-only.txt'), 'keep remote update');
  assert.equal(git(f.remote, 'show', 'main:unrelated.txt'), 'original unrelated');
  assert.equal(git(f.remote, 'ls-tree', 'main', '--', 'feature-only.txt'), '');
  assert.equal(git(f.local, 'branch', '--show-current'), 'feature');
  assert.equal(git(f.local, 'rev-parse', 'main'), mainBefore);
  assert.equal(git(f.local, 'diff', '--cached', '--name-only'), 'unrelated.txt');
  assert.equal(await readFile(path.join(f.local, 'untracked.txt'), 'utf8'), 'local only\n');
  const published = git(f.remote, 'rev-parse', 'main');
  await commitAndPush(f.local, ['post.md'], 'Retry publication');
  assert.equal(git(f.remote, 'rev-parse', 'main'), published);
});

test('publishes from a main checkout behind remote without changing unrelated files', async (t) => {
  const f = await fixture(t);
  await put(f.other, 'remote-only.txt', 'upstream\n');
  commit(f.other, 'Remote advance');
  git(f.other, 'push', 'origin', 'main');
  await put(f.local, 'unrelated.txt', 'unstaged work\n');
  await put(f.local, 'post.md', 'published from old main\n');
  await commitAndPush(f.local, ['post.md'], 'Publish on main');
  assert.equal(git(f.remote, 'show', 'main:post.md'), 'published from old main');
  assert.equal(git(f.remote, 'show', 'main:remote-only.txt'), 'upstream');
  assert.equal(await readFile(path.join(f.local, 'unrelated.txt'), 'utf8'), 'unstaged work\n');
});

test('publishes trash moves and supports retries after the original path disappeared', async (t) => {
  const f = await fixture(t);
  await rm(path.join(f.local, 'post.md'));
  await put(f.local, 'trash/post.md', 'original post\n');
  await commitAndPush(f.local, ['post.md', 'trash/post.md'], 'Trash post');
  assert.equal(git(f.remote, 'ls-tree', 'main', '--', 'post.md'), '');
  assert.equal(git(f.remote, 'show', 'main:trash/post.md'), 'original post');
  await commitAndPush(f.local, ['post.md', 'trash/post.md'], 'Retry trash');
});

test('retries a saved local commit after a rejected push', async (t) => {
  const f = await fixture(t);
  const hook = path.join(f.local, '.git/hooks/pre-push');
  await writeFile(hook, '#!/bin/sh\nexit 1\n');
  await chmod(hook, 0o755);
  await put(f.local, 'post.md', 'saved despite failure\n');
  await assert.rejects(commitAndPush(f.local, ['post.md'], 'Save post'));
  const saved = git(f.local, 'rev-parse', 'HEAD');
  await rm(hook);
  await commitAndPush(f.local, ['post.md'], 'Retry post');
  assert.equal(git(f.local, 'rev-parse', 'HEAD'), saved);
  assert.equal(git(f.remote, 'show', 'main:post.md'), 'saved despite failure');
});

test('merges remote changes arriving during the push without force pushing', async (t) => {
  const f = await fixture(t);
  await raceHook(f, 'unrelated.txt', 'concurrent remote change\n');
  await put(f.local, 'post.md', 'local article change\n');
  await commitAndPush(f.local, ['post.md'], 'Publish during race');
  assert.equal(git(f.remote, 'show', 'main:post.md'), 'local article change');
  assert.equal(git(f.remote, 'show', 'main:unrelated.txt'), 'concurrent remote change');
});

test('preserves local content and remote content when concurrent edits conflict', async (t) => {
  const f = await fixture(t);
  await raceHook(f, 'post.md', 'conflicting remote article\n');
  await put(f.local, 'post.md', 'conflicting local article\n');
  await assert.rejects(commitAndPush(f.local, ['post.md'], 'Conflicting publication'), /无法自动合并/);
  assert.equal(git(f.remote, 'show', 'main:post.md'), 'conflicting remote article');
  assert.equal(git(f.local, 'show', 'HEAD:post.md'), 'conflicting local article');
  assert.equal(await readFile(path.join(f.local, 'post.md'), 'utf8'), 'conflicting local article\n');
});

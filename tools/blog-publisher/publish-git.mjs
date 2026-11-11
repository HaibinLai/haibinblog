import { execFile } from 'node:child_process';
import { lstat, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const queues = new Map();
const git = async (cwd, args, env = {}) => {
  const { stdout } = await exec('git', ['--literal-pathspecs', ...args], {
    cwd, env: { ...process.env, ...env }, maxBuffer: 4 * 1024 * 1024,
  });
  return stdout.trim();
};

// Serialize publication within each repository so concurrent saves do not share an index.
export function commitAndPush(cwd, paths, message) {
  const previous = queues.get(cwd) || Promise.resolve();
  const task = previous.catch(() => {}).then(() => publish(cwd, paths, message));
  queues.set(cwd, task);
  return task.finally(() => { if (queues.get(cwd) === task) queues.delete(cwd); });
}

async function fetchMain(cwd) {
  await git(cwd, ['fetch', '--no-tags', 'origin', 'main']);
  return git(cwd, ['rev-parse', 'FETCH_HEAD']);
}

async function publish(cwd, paths, message) {
  // Keep the local save committed, including when an earlier network attempt failed.
  const stageable = [];
  for (const relative of paths) {
    const exists = await lstat(path.join(cwd, relative)).then(() => true, (error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
    const tracked = await git(cwd, ['ls-files', '--error-unmatch', '--', relative]).then(() => true, () => false);
    if (exists || tracked) stageable.push(relative);
  }
  if (stageable.length) await git(cwd, ['add', '-A', '--', ...stageable]);
  const staged = await git(cwd, ['diff', '--cached', '--name-only', '--', ...paths]);
  if (staged) await git(cwd, ['commit', '--only', '-m', message, '--', ...stageable]);
  const source = await git(cwd, ['rev-parse', 'HEAD']);
  let remote = await fetchMain(cwd);
  const temporary = await mkdtemp(path.join(tmpdir(), 'blog-publisher-'));
  const indexEnv = { GIT_INDEX_FILE: path.join(temporary, 'index') };
  try {
    // A separate index copies only selected paths onto main, leaving the working
    // branch, unrelated local commits, and staged edits in place.
    await git(cwd, ['read-tree', remote], indexEnv);
    for (const relative of paths) {
      const entry = await git(cwd, ['ls-tree', '-z', source, '--', relative]);
      if (entry) {
        const match = entry.match(/^(\d+) blob ([a-f0-9]+)\t/);
        if (!match) throw new Error(`只能发布文件：${relative}`);
        await git(cwd, ['update-index', '--add', '--cacheinfo', match[1], match[2], relative], indexEnv);
      } else {
        await git(cwd, ['update-index', '--force-remove', '--', relative], indexEnv);
      }
    }
    let tree = await git(cwd, ['write-tree'], indexEnv);
    if (tree === await git(cwd, ['rev-parse', `${remote}^{tree}`])) return true;
    let commit = await git(cwd, ['commit-tree', tree, '-p', remote, '-m', message]);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await git(cwd, ['push', 'origin', `${commit}:refs/heads/main`]);
        return true;
      } catch (error) {
        const latest = await fetchMain(cwd);
        if (latest === remote || attempt === 2) throw error;
        try {
          tree = (await git(cwd, ['merge-tree', '--write-tree', latest, commit])).split('\n')[0];
        } catch {
          throw new Error('远端同时修改了相同内容，无法自动合并；本地文件和提交已保留，请先处理冲突后再发布。');
        }
        remote = latest;
        commit = await git(cwd, ['commit-tree', tree, '-p', remote, '-m', message]);
      }
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

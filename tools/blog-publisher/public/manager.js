const search = document.querySelector('#post-search');
const list = document.querySelector('#post-list');
const message = document.querySelector('#manager-message');
const dialog = document.querySelector('#action-dialog');
const dialogTitle = document.querySelector('#action-title');
const dialogDescription = document.querySelector('#action-description');
const dialogError = document.querySelector('#action-error');
const confirmButton = document.querySelector('#confirm-action');
const pushAction = document.querySelector('#push-action');
const params = new URLSearchParams(location.search);
let filter = ['all', 'published', 'draft', 'trash'].includes(params.get('filter')) ? params.get('filter') : 'all';
let page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
let pages = 1;
let requestId = 0;
let pending = null;
let searchTimer;

search.value = params.get('q') || '';

function showMessage(text, error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
  message.hidden = !text;
}

function node(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content != null) element.textContent = content;
  return element;
}

function actionButton(label, className, onClick) {
  const button = node('button', className, label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

function row(item) {
  const article = node('article', 'post-row');
  const main = node('div', 'post-main');
  const title = node(item.trashed ? 'span' : 'a', 'post-title', item.title);
  if (!item.trashed) title.href = `/?edit=${encodeURIComponent(item.id)}`;
  main.append(title);
  const meta = node('div', 'post-meta');
  const state = node('span', `post-state ${item.trashed ? 'trash' : item.draft ? 'draft' : ''}`, item.trashed ? '回收站' : item.draft ? '草稿' : '已发布');
  meta.append(state, node('span', '', item.publishedAt.slice(0, 10) || '未注明日期'));
  if (item.category) meta.append(node('span', '', item.category));
  meta.append(node('code', '', item.id));
  main.append(meta);
  const actions = node('div', 'post-actions');
  if (item.trashed) {
    actions.append(actionButton('恢复', '', () => openAction(item, 'restore')));
  } else {
    const edit = node('a', '', '编辑');
    edit.href = `/?edit=${encodeURIComponent(item.id)}`;
    actions.append(edit);
    if (item.url) {
      const visit = node('a', '', '查看');
      visit.href = item.url;
      visit.target = '_blank';
      visit.rel = 'noopener noreferrer';
      actions.append(visit);
    }
    actions.append(actionButton('删除', 'remove', () => openAction(item, 'trash')));
  }
  article.append(main, actions);
  return article;
}

async function loadPosts() {
  const currentRequest = ++requestId;
  const query = search.value.trim();
  const url = new URL('/api/posts', location.origin);
  url.searchParams.set('filter', filter);
  url.searchParams.set('page', String(page));
  if (query) url.searchParams.set('q', query);
  history.replaceState(null, '', `/manager?${url.searchParams}`);
  list.replaceChildren(node('p', 'empty', '正在读取文章…'));
  try {
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    if (currentRequest !== requestId) return;
    if (!response.ok) throw new Error(data.error || '无法读取文章列表');
    if (page > data.pages) { page = data.pages; return loadPosts(); }
    pages = data.pages;
    document.querySelector('#list-count').textContent = `${data.total} 篇${filter === 'trash' ? '已删除的' : ''}文章`;
    document.querySelector('#list-page').textContent = query ? `搜索：${query}` : '';
    document.querySelector('#page-indicator').textContent = `${page} / ${pages}`;
    document.querySelector('#previous-page').disabled = page <= 1;
    document.querySelector('#next-page').disabled = page >= pages;
    list.replaceChildren(...(data.items.length ? data.items.map(row) : [node('p', 'empty', query ? '没有找到匹配的文章' : filter === 'trash' ? '回收站是空的' : '这里还没有文章')]));
  } catch (error) {
    if (currentRequest !== requestId) return;
    list.replaceChildren(node('p', 'empty', '文章列表暂时无法读取'));
    showMessage(error.message, true);
  }
}

function openAction(item, action) {
  pending = { item, action };
  dialogTitle.textContent = action === 'trash' ? '移入回收站' : '恢复文章';
  dialogDescription.textContent = action === 'trash'
    ? `“${item.title}”会从文章目录移入回收站。若推送，公开页面会在部署后下线；源码仍保留在 GitHub 回收站中。`
    : `“${item.title}”会回到原来的文件路径。若推送，公开文章会在部署后重新出现。`;
  confirmButton.textContent = action === 'trash' ? '移入回收站' : '恢复文章';
  confirmButton.classList.toggle('danger', action === 'trash');
  pushAction.checked = false;
  dialogError.hidden = true;
  dialog.showModal();
}

document.querySelector('#cancel-action').addEventListener('click', () => dialog.close());
confirmButton.addEventListener('click', async () => {
  if (!pending) return;
  const { item, action } = pending;
  confirmButton.disabled = true;
  dialogError.hidden = true;
  try {
    const response = await fetch(`/api/post/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, sourceHash: item.sourceHash, push: pushAction.checked }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '操作失败');
    dialog.close();
    pending = null;
    const done = action === 'trash' ? '已移入回收站' : '已恢复文章';
    showMessage(data.pushError ? `${done}，但推送失败：${data.pushError}` : `${done}${data.pushed ? '并推送；网站需要等待部署' : '，仅保存在本地'}`, Boolean(data.pushError));
    await loadPosts();
  } catch (error) {
    dialogError.textContent = error.message;
    dialogError.hidden = false;
  } finally { confirmButton.disabled = false; }
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    page = 1;
    document.querySelectorAll('[data-filter]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
    showMessage('');
    loadPosts();
  });
  button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
});
search.addEventListener('input', () => { clearTimeout(searchTimer); page = 1; searchTimer = setTimeout(loadPosts, 250); });
document.querySelector('#previous-page').addEventListener('click', () => { if (page > 1) { page--; loadPosts(); } });
document.querySelector('#next-page').addEventListener('click', () => { if (page < pages) { page++; loadPosts(); } });
loadPosts();

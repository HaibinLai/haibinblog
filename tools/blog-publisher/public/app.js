const form = document.querySelector('#post-form');
const bodyInput = document.querySelector('#body');
const result = document.querySelector('#result');
const imageInput = document.querySelector('#image');
const cardImageInput = document.querySelector('#card-image');
const imageDrop = document.querySelector('#image-drop');
const imageStatus = document.querySelector('#image-status');
const imagePreviewWrap = document.querySelector('.image-preview-wrap');
const imagePreview = document.querySelector('#image-preview');
const imageName = document.querySelector('#image-name');
const preview = document.querySelector('#preview');
const bodyCount = document.querySelector('#body-count');
const saveState = document.querySelector('#save-state');
const saveButton = document.querySelector('#save-button');
const pushStatus = document.querySelector('#push-status');
const checkPushButton = document.querySelector('#check-push');
const statusTitle = document.querySelector('#push-status-title');
const statusSummary = document.querySelector('#push-status-summary');
const statusChecked = document.querySelector('#push-status-checked');
const readingListImport = location.hash === '#import=reading-list';
const storageKey = readingListImport ? 'haibin-blog-publisher-reading-list-draft-v1' : 'haibin-blog-publisher-draft-v2';

const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
if (!form.elements.publishedAt.value) form.elements.publishedAt.value = today;
if (!form.elements.updatedAt.value) form.elements.updatedAt.value = today;
if (!form.elements.imageMonth.value) form.elements.imageMonth.value = today.slice(0, 7);

const escapeHtml = (value) => String(value).replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[char]));
const inlineMarkdown = (value) => {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return html;
};

function renderMarkdown(source = '') {
  const lines = source.replace(/\r/g, '').split('\n');
  const output = []; let inCode = false; let code = []; let list = null; let table = null;
  const closeList = () => { if (list) { output.push(`</${list}>`); list = null; } };
  const closeTable = () => { if (table) { output.push('</tbody></table>'); table = null; } };
  for (const line of lines) {
    if (line.startsWith('```')) {
      closeList(); closeTable();
      if (inCode) { output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`); code = []; inCode = false; }
      else inCode = true;
      continue;
    }
    if (inCode) { code.push(line); continue; }
    const tableRow = line.match(/^\|(.+)\|\s*$/);
    const separator = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line);
    if (separator) continue;
    if (tableRow && !separator) {
      closeList();
      const cells = tableRow[1].split('|').map((cell) => cell.trim());
      if (!table) { table = true; output.push('<table><thead><tr>'); output.push(cells.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')); output.push('</tr></thead><tbody>'); }
      else output.push(`<tr>${cells.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`);
      continue;
    }
    if (line.trim() === '') { closeList(); closeTable(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) { closeList(); closeTable(); const level = heading[1].length; output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    if (/^[-*]\s+/.test(line)) { closeTable(); if (list !== 'ul') { closeList(); output.push('<ul>'); list = 'ul'; } output.push(`<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`); continue; }
    if (/^\d+\.\s+/.test(line)) { closeTable(); if (list !== 'ol') { closeList(); output.push('<ol>'); list = 'ol'; } output.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>`); continue; }
    closeList(); closeTable();
    if (/^>\s?/.test(line)) output.push(`<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ''))}</blockquote>`);
    else output.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  if (inCode) output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  closeList(); closeTable();
  return output.join('');
}

function updatePreview() {
  bodyCount.textContent = `${bodyInput.value.length.toLocaleString()} 字`;
  preview.innerHTML = renderMarkdown(bodyInput.value || '*预览会显示在这里*');
}

function collectDraft() {
  const fields = Object.fromEntries(new FormData(form).entries());
  return { ...fields, showCitation: form.elements.showCitation.checked, draft: form.elements.draft.checked, push: false };
}

let saveTimer;
let editorDirty = false;
let statusRequestId = 0;
function saveLocalDraft() {
  localStorage.setItem(storageKey, JSON.stringify(collectDraft()));
  saveState.textContent = `已自动保存 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
function scheduleLocalDraft() { clearTimeout(saveTimer); saveTimer = setTimeout(saveLocalDraft, 450); }
function restoreLocalDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!saved || (!saved.title && !saved.body)) return;
    for (const [name, value] of Object.entries(saved)) {
      if (!form.elements[name] || name === 'push') continue;
      if (form.elements[name].type === 'checkbox') form.elements[name].checked = value === true || value === 'on';
      else form.elements[name].value = value;
    }
    saveState.textContent = '已恢复上次未完成的本地草稿';
    editorDirty = true;
  } catch { localStorage.removeItem(storageKey); }
}

const pushLabels = { pushed: '已推送', local: '仅在本地', pending: '待核对', missing: '未保存', none: '未使用', unknown: '无法确认', checking: '检测中', idle: '待检测' };
function showOverallState(state, title, detail) {
  pushStatus.dataset.state = state;
  statusTitle.textContent = title;
  statusSummary.textContent = detail;
}

function showPushState(kind, status) {
  const badge = document.querySelector(`#${kind}-push-state`);
  badge.textContent = status.label || pushLabels[status.state] || '无法确认';
  badge.dataset.state = status.state;
  document.querySelector(`#${kind}-push-detail`).textContent = `${status.message}${status.commit ? ` · main@${status.commit}` : ''}`;
}

function resetPushState() {
  showOverallState('idle', '等待文章信息', '填写标题后，可以检测保存和推送状态。');
  showPushState('article', { state: 'idle', message: '保存后自动检测' });
  showPushState('image', { state: 'idle', message: '保存后自动检测' });
  statusChecked.textContent = '尚未检测';
  for (const kind of ['article', 'image']) document.querySelector(`#${kind}-source`).hidden = true;
}

async function checkPushStatus() {
  const slug = form.elements.slug.value.trim() || form.elements.title.value.trim();
  const requestId = ++statusRequestId;
  showOverallState('checking', '正在核对 GitHub…', '正在检查仓库中已保存的文章和封面图片。');
  showPushState('article', { state: 'checking', message: '正在检测' });
  showPushState('image', { state: 'checking', message: '正在检测' });
  if (!slug) {
    showPushState('article', { state: 'missing', message: '请先填写标题或文件名' });
    showPushState('image', { state: 'none', message: '尚无文章可检测' });
    showOverallState('idle', '等待文章信息', '先填写标题或文件名，再检测推送状态。');
    return null;
  }
  checkPushButton.disabled = true;
  try {
    const response = await fetch(`/api/push-status?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
    const data = await response.json();
    if (requestId !== statusRequestId) return null;
    if (!response.ok) throw new Error(data.error || '检测失败');
    const articleMessage = data.article.state === 'pushed' && data.draft
      ? '已在 GitHub；仍是草稿，博客页面不会展示'
      : data.article.message;
    showPushState('article', {
      ...data.article,
      message: editorDirty && data.article.state === 'pushed'
        ? `${articleMessage}；当前编辑内容尚未保存`
        : articleMessage,
    });
    showPushState('image', { ...data.image, label: data.image.state === 'none' && data.imageUrl ? '外部链接' : undefined });
    const articleSource = document.querySelector('#article-source');
    articleSource.hidden = data.article.state !== 'pushed';
    if (!articleSource.hidden) articleSource.href = `https://github.com/HaibinLai/haibinblog/blob/main/${data.file.split('/').map(encodeURIComponent).join('/')}`;
    const imageSource = document.querySelector('#image-source');
    imageSource.hidden = !data.imageUrl || data.image.state !== 'pushed';
    if (!imageSource.hidden) imageSource.href = data.imageUrl;
    if (data.article.state === 'missing') showOverallState('local', '文章还没有保存', '点击底部“保存文章”后会自动检测。');
    else if (editorDirty) showOverallState('dirty', '编辑中的内容尚未保存', '下方结果只代表仓库中上一次保存的版本。');
    else if (data.article.state === 'pushed' && ['local', 'pending', 'unknown'].includes(data.image.state)) showOverallState('partial', '文章已推送，图片待核对', '请查看下方封面图片的状态。');
    else if (data.article.state === 'pushed') showOverallState('pushed', data.draft ? '已推送，仍是草稿' : '已推送到 GitHub', data.draft ? 'GitHub 有源码；公开博客不会展示这篇草稿。' : '文章已在 GitHub，公开页面还需等待部署。');
    else if (data.article.state === 'local') showOverallState('local', '仅保存在本地', '勾选底部的推送选项并保存，即可推送到 GitHub。');
    else if (data.article.state === 'pending') showOverallState('pending', '推送尚未确认', '本地与 GitHub 提交不同，请稍后重新检测。');
    else showOverallState('error', '无法确认推送状态', '请检查网络连接或 Git 仓库设置。');
    statusChecked.textContent = `最近检测：${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    return data;
  } catch (error) {
    if (requestId !== statusRequestId) return null;
    showPushState('article', { state: 'unknown', message: error.message });
    showPushState('image', { state: 'unknown', message: '请稍后重试' });
    showOverallState('error', '检测失败', '请检查网络连接后重试。');
    return null;
  } finally {
    if (requestId === statusRequestId) checkPushButton.disabled = false;
  }
}

async function prefillReadingList() {
  if (!readingListImport || localStorage.getItem(storageKey)) return;
  try {
    const saved = await fetch('/api/draft?slug=reading-list', { cache: 'no-store' });
    if (saved.ok) {
      const { metadata, body } = await saved.json();
      for (const name of ['title', 'description', 'publishedAt', 'updatedAt', 'category', 'language', 'translationKey', 'featuredRank', 'featuredTitle', 'featuredLabel', 'cardImage', 'featuredImage']) {
        if (form.elements[name]) form.elements[name].value = metadata[name] ?? '';
      }
      form.elements.slug.value = 'reading-list';
      form.elements.tags.value = (metadata.tags || []).join(', ');
      form.elements.categories.value = (metadata.categories || []).join(', ');
      for (const name of ['draft', 'showCitation']) form.elements[name].checked = metadata[name] === true;
      bodyInput.value = body;
      showImage(null);
      updatePreview();
      saveState.textContent = '已载入仓库中保存的文章';
      return;
    }
    if (saved.status !== 404) throw new Error('无法读取已保存的文章');
    const response = await fetch('/drafts/reading-list.md', { cache: 'no-store' });
    if (!response.ok) throw new Error('无法读取阅读清单');
    form.elements.title.value = 'Reading list';
    form.elements.slug.value = 'reading-list';
    form.elements.description.value = 'A reading list on scalable learning, practical ML systems, and LLM systems.';
    form.elements.category.value = 'Research';
    form.elements.tags.value = 'reading-list, machine-learning, LLM-systems';
    form.elements.language.value = 'en';
    form.elements.draft.checked = true;
    form.elements.push.checked = false;
    form.elements.showCitation.checked = false;
    bodyInput.value = await response.text();
    editorDirty = true;
    updatePreview();
    saveLocalDraft();
    saveState.textContent = '已导入阅读清单，保存在独立的本地草稿中';
  } catch (error) {
    saveState.textContent = error.message;
  }
}

function insertAtCursor(text) {
  const start = bodyInput.selectionStart; const end = bodyInput.selectionEnd;
  bodyInput.setRangeText(text, start, end, 'end'); bodyInput.focus(); updatePreview(); markEdited();
}

function markEdited() {
  editorDirty = true;
  statusRequestId++;
  checkPushButton.disabled = !(form.elements.slug.value.trim() || form.elements.title.value.trim());
  showOverallState('dirty', '有尚未保存的更改', '保存后会自动检测；也可以立即核对上一次保存的版本。');
  showPushState('article', { state: 'idle', message: '当前编辑内容尚未保存' });
  showPushState('image', { state: 'idle', message: '当前编辑内容尚未保存' });
  for (const kind of ['article', 'image']) document.querySelector(`#${kind}-source`).hidden = true;
  statusChecked.textContent = '编辑内容已改变，旧检测结果已清除';
  scheduleLocalDraft();
}

const fileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file);
});

function showImage(file) {
  if (!file) {
    const remote = cardImageInput.value.trim();
    if (remote) { imagePreview.src = remote; imageName.textContent = '远程封面图片'; imagePreviewWrap.hidden = false; imageStatus.textContent = '将使用这个远程地址作为封面图片。'; }
    else { imagePreviewWrap.hidden = true; imageStatus.textContent = '可以直接粘贴 S3、腾讯云或其他 HTTPS 图片地址；本地上传仍会保存到 image-backend。'; }
    return;
  }
  imagePreview.src = URL.createObjectURL(file); imageName.textContent = file.name; imagePreviewWrap.hidden = false;
  imageStatus.textContent = `已选择：${file.name}；保存后会写入 image-backend。`;
}
imageInput.addEventListener('change', () => showImage(imageInput.files[0]));
cardImageInput.addEventListener('input', () => { if (!imageInput.files[0]) showImage(null); scheduleLocalDraft(); });
['dragenter', 'dragover'].forEach((eventName) => imageDrop.addEventListener(eventName, (event) => { event.preventDefault(); imageDrop.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((eventName) => imageDrop.addEventListener(eventName, (event) => { event.preventDefault(); imageDrop.classList.remove('is-over'); }));
imageDrop.addEventListener('drop', (event) => { const file = event.dataTransfer.files[0]; if (file) { imageInput.files = event.dataTransfer.files; showImage(file); markEdited(); } });

document.querySelectorAll('[data-insert]').forEach((button) => button.addEventListener('click', () => insertAtCursor(button.dataset.insert)));
document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((tab) => tab.classList.toggle('is-active', tab === button));
  const isPreview = button.dataset.tab === 'preview'; bodyInput.hidden = isPreview; preview.hidden = !isPreview; updatePreview();
}));
bodyInput.addEventListener('input', updatePreview);
form.addEventListener('input', markEdited);
form.addEventListener('change', markEdited);
checkPushButton.addEventListener('click', checkPushStatus);
document.querySelector('#clear-draft').addEventListener('click', () => { clearTimeout(saveTimer); statusRequestId++; localStorage.removeItem(storageKey); form.reset(); form.elements.publishedAt.value = today; form.elements.updatedAt.value = today; form.elements.imageMonth.value = today.slice(0, 7); bodyInput.hidden = false; preview.hidden = true; document.querySelectorAll('[data-tab]').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.tab === 'write')); showImage(null); updatePreview(); saveState.textContent = '本地草稿已清除'; result.hidden = true; editorDirty = false; checkPushButton.disabled = true; resetPushState(); });

form.addEventListener('submit', async (event) => {
  event.preventDefault(); result.hidden = true; saveButton.disabled = true; saveButton.textContent = '保存中…';
  showOverallState('checking', '正在保存文章…', '保存完成后会自动核对 GitHub 状态。');
  try {
    const fields = Object.fromEntries(new FormData(form).entries()); const file = imageInput.files[0];
    const body = { ...fields, draft: form.elements.draft.checked, push: form.elements.push.checked, showCitation: form.elements.showCitation.checked, image: file ? { name: file.name, data: await fileAsBase64(file), month: fields.imageMonth, slug: fields.slug || fields.title } : null };
    const response = await fetch('/api/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败');
    clearTimeout(saveTimer);
    editorDirty = false;
    const checked = await checkPushStatus();
    if (!data.pushError) localStorage.removeItem(storageKey);
    saveState.textContent = data.pushError ? '本地已保存，推送未完成' : '已写入仓库';
    result.className = data.pushError ? 'result error' : 'result';
    if (data.pushError) result.textContent = `本地已保存：${data.file}。但推送失败：${data.pushError}。请检查后重试。`;
    else result.innerHTML = `已保存：<strong>${data.file}</strong>${checked?.article.state === 'pushed' ? '<br>文章已推送到 GitHub。' : '<br>推送状态请查看页面顶部。'}${data.imageUrl ? `<br>图片已保存：<code>${data.imageUrl}</code>` : ''}${data.url && !form.elements.draft.checked ? `<br><a href="${data.url}" target="_blank">打开对应页面 ↗</a>` : ''}`;
    result.hidden = false;
  } catch (error) { result.className = 'result error'; result.textContent = error.message; result.hidden = false; showOverallState('error', '保存失败', error.message); }
  finally { saveButton.disabled = false; saveButton.textContent = '保存文章'; }
});

restoreLocalDraft(); updatePreview();
prefillReadingList().then(() => { if (form.elements.slug.value || form.elements.title.value) checkPushStatus(); else resetPushState(); });

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
const storageKey = 'haibin-blog-publisher-draft-v2';

const today = new Date().toISOString().slice(0, 10);
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
  } catch { localStorage.removeItem(storageKey); }
}

function insertAtCursor(text) {
  const start = bodyInput.selectionStart; const end = bodyInput.selectionEnd;
  bodyInput.setRangeText(text, start, end, 'end'); bodyInput.focus(); updatePreview(); scheduleLocalDraft();
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
imageDrop.addEventListener('drop', (event) => { const file = event.dataTransfer.files[0]; if (file) { imageInput.files = event.dataTransfer.files; showImage(file); } });

document.querySelectorAll('[data-insert]').forEach((button) => button.addEventListener('click', () => insertAtCursor(button.dataset.insert)));
document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((tab) => tab.classList.toggle('is-active', tab === button));
  const isPreview = button.dataset.tab === 'preview'; bodyInput.hidden = isPreview; preview.hidden = !isPreview; updatePreview();
}));
bodyInput.addEventListener('input', () => { updatePreview(); scheduleLocalDraft(); });
form.addEventListener('input', scheduleLocalDraft);
document.querySelector('#clear-draft').addEventListener('click', () => { localStorage.removeItem(storageKey); form.reset(); form.elements.publishedAt.value = today; form.elements.updatedAt.value = today; form.elements.imageMonth.value = today.slice(0, 7); bodyInput.hidden = false; preview.hidden = true; document.querySelectorAll('[data-tab]').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.tab === 'write')); showImage(null); updatePreview(); saveState.textContent = '本地草稿已清除'; });

form.addEventListener('submit', async (event) => {
  event.preventDefault(); result.hidden = true; saveButton.disabled = true; saveButton.textContent = '保存中…';
  try {
    const fields = Object.fromEntries(new FormData(form).entries()); const file = imageInput.files[0];
    const body = { ...fields, draft: form.elements.draft.checked, push: form.elements.push.checked, showCitation: form.elements.showCitation.checked, image: file ? { name: file.name, data: await fileAsBase64(file), month: fields.imageMonth, slug: fields.slug || fields.title } : null };
    const response = await fetch('/api/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || '保存失败');
    localStorage.removeItem(storageKey); saveState.textContent = '已写入仓库'; result.className = 'result';
    result.innerHTML = `已保存：<strong>${data.file}</strong>${data.pushed ? '<br>已提交并推送到 GitHub，等待 Actions 部署。' : '<br>尚未推送；文章现在只在本地仓库。'}${data.imageUrl ? `<br>图片已保存：<code>${data.imageUrl}</code>` : ''}${data.url ? `<br><a href="${data.url}" target="_blank">打开对应页面 ↗</a>` : ''}`;
    result.hidden = false;
  } catch (error) { result.className = 'result error'; result.textContent = error.message; result.hidden = false; }
  finally { saveButton.disabled = false; saveButton.textContent = '保存文章'; }
});

restoreLocalDraft(); updatePreview();

const form = document.querySelector('#post-form');
const result = document.querySelector('#result');
const imageInput = document.querySelector('#image');
const imageStatus = document.querySelector('#image-status');

const today = new Date().toISOString().slice(0, 10);
form.elements.publishedAt.value = today;
form.elements.updatedAt.value = today;
form.elements.imageMonth.value = today.slice(0, 7);

const fileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  imageStatus.textContent = file ? `已选择：${file.name}（保存后会放到 image-backend）` : '图片会保存到 image-backend 的 YYYY-MM/文章名/ 目录。';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  result.hidden = true;
  const fields = Object.fromEntries(new FormData(form).entries());
  const file = imageInput.files[0];
  const body = {
    ...fields,
    draft: form.elements.draft.checked,
    push: form.elements.push.checked,
    showCitation: form.elements.showCitation.checked,
    image: file ? { name: file.name, data: await fileAsBase64(file), month: fields.imageMonth, slug: fields.slug || fields.title } : null,
  };
  try {
    const response = await fetch('/api/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '保存失败');
    result.className = 'result';
    result.innerHTML = `已保存：<strong>${data.file}</strong>${data.pushed ? '<br>已提交并推送到 GitHub，等待 Actions 部署。' : '<br>尚未推送；勾选“保存后提交并推送到 GitHub”即可发布。'}${data.imageUrl ? `<br>图片地址：<code>${data.imageUrl}</code>` : ''}`;
    result.hidden = false;
  } catch (error) {
    result.className = 'result error';
    result.textContent = error.message;
    result.hidden = false;
  }
});

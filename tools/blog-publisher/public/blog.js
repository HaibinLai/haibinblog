const blogFrame = document.querySelector('#blog-frame');
document.querySelector('#reload-blog').addEventListener('click', () => {
  const url = new URL(blogFrame.src);
  url.searchParams.set('publisher_check', String(Date.now()));
  blogFrame.src = url.href;
});

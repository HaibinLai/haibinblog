const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 1.35;

function createButton(label: string, text: string, title = label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'paper-figure-viewer__button';
  button.setAttribute('aria-label', label);
  button.title = title;
  button.textContent = text;
  return button;
}

export function initPaperFigures(root: ParentNode = document) {
  const figures = [...root.querySelectorAll<HTMLFigureElement>('figure[data-paper-figure]')]
    .filter((figure) => figure.querySelector('img') && !figure.dataset.paperFigureReady);
  if (!figures.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'paper-figure-viewer';
  dialog.setAttribute('aria-label', 'Figure viewer');

  const frame = document.createElement('div');
  frame.className = 'paper-figure-viewer__frame';
  const toolbar = document.createElement('div');
  toolbar.className = 'paper-figure-viewer__toolbar';
  const title = document.createElement('span');
  title.className = 'paper-figure-viewer__title';
  const actions = document.createElement('div');
  actions.className = 'paper-figure-viewer__actions';
  const zoomOut = createButton('缩小 / Zoom out', '−');
  const zoomValue = document.createElement('output');
  zoomValue.className = 'paper-figure-viewer__zoom';
  zoomValue.setAttribute('aria-label', 'Zoom level');
  const zoomIn = createButton('放大 / Zoom in', '+');
  const reset = createButton('重置缩放 / Reset zoom', '重置');
  const close = createButton('关闭 / Close', '×');
  close.classList.add('paper-figure-viewer__close');
  actions.append(zoomOut, zoomValue, zoomIn, reset, close);
  toolbar.append(title, actions);

  const stage = document.createElement('div');
  stage.className = 'paper-figure-viewer__stage';
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'Figure image');
  const preview = document.createElement('img');
  preview.className = 'paper-figure-viewer__image';
  preview.draggable = false;
  stage.append(preview);
  const caption = document.createElement('p');
  caption.className = 'paper-figure-viewer__caption';
  caption.id = 'paper-figure-viewer-caption';
  dialog.setAttribute('aria-describedby', caption.id);
  frame.append(toolbar, stage, caption);
  dialog.append(frame);
  document.body.append(dialog);

  let scale = MIN_ZOOM;
  let offsetX = 0;
  let offsetY = 0;
  let lastPoint: { x: number; y: number } | null = null;
  let opener: HTMLButtonElement | null = null;

  const paint = () => {
    const boundX = Math.max(0, (preview.clientWidth * scale - stage.clientWidth) / 2);
    const boundY = Math.max(0, (preview.clientHeight * scale - stage.clientHeight) / 2);
    offsetX = Math.max(-boundX, Math.min(boundX, offsetX));
    offsetY = Math.max(-boundY, Math.min(boundY, offsetY));
    preview.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`;
    zoomValue.textContent = `${Math.round(scale * 100)}%`;
    zoomOut.disabled = scale <= MIN_ZOOM;
    zoomIn.disabled = scale >= MAX_ZOOM;
    stage.classList.toggle('is-zoomed', scale > MIN_ZOOM);
  };

  const setZoom = (value: number) => {
    scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    if (scale === MIN_ZOOM) {
      offsetX = 0;
      offsetY = 0;
    }
    paint();
  };

  zoomIn.addEventListener('click', () => setZoom(scale * ZOOM_STEP));
  zoomOut.addEventListener('click', () => setZoom(scale / ZOOM_STEP));
  reset.addEventListener('click', () => setZoom(MIN_ZOOM));
  close.addEventListener('click', () => dialog.close());
  preview.addEventListener('load', paint);
  dialog.addEventListener('close', () => {
    document.body.classList.remove('paper-figure-viewer-open');
    preview.removeAttribute('src');
    opener?.focus();
    opener = null;
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === '+' || event.key === '=') setZoom(scale * ZOOM_STEP);
    else if (event.key === '-') setZoom(scale / ZOOM_STEP);
    else if (event.key === '0') setZoom(MIN_ZOOM);
    else if (scale > MIN_ZOOM && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const step = 55;
      if (event.key === 'ArrowUp') offsetY += step;
      if (event.key === 'ArrowDown') offsetY -= step;
      if (event.key === 'ArrowLeft') offsetX += step;
      if (event.key === 'ArrowRight') offsetX -= step;
      paint();
    } else return;
    event.preventDefault();
  });
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setZoom(scale * (event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP));
  }, { passive: false });
  stage.addEventListener('pointerdown', (event) => {
    if (scale <= MIN_ZOOM || !event.isPrimary || event.button !== 0) return;
    lastPoint = { x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (event) => {
    if (!lastPoint || !stage.hasPointerCapture(event.pointerId)) return;
    offsetX += event.clientX - lastPoint.x;
    offsetY += event.clientY - lastPoint.y;
    lastPoint = { x: event.clientX, y: event.clientY };
    paint();
  });
  const stopDrag = () => {
    lastPoint = null;
    stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', stopDrag);
  stage.addEventListener('pointercancel', stopDrag);
  stage.addEventListener('lostpointercapture', stopDrag);
  window.addEventListener('resize', () => { if (dialog.open) paint(); }, { passive: true });

  for (const figure of figures) {
    figure.dataset.paperFigureReady = 'true';
    figure.classList.add('paper-figure');
    const source = figure.querySelector<HTMLImageElement>('img')!;
    const label = figure.querySelector('figcaption')?.textContent?.trim() || source.alt || 'Figure';
    const open = createButton(`放大查看 / Expand: ${label}`, '查看大图 / View figure');
    open.classList.add('paper-figure__open');
    open.addEventListener('click', () => {
      opener = open;
      title.textContent = label;
      caption.textContent = label;
      preview.alt = source.alt || label;
      scale = MIN_ZOOM;
      offsetX = 0;
      offsetY = 0;
      preview.src = source.currentSrc || source.src;
      dialog.showModal();
      document.body.classList.add('paper-figure-viewer-open');
      requestAnimationFrame(paint);
      stage.focus();
    });
    figure.append(open);
  }
}

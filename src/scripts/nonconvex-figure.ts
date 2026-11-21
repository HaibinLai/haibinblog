import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type Point = { x: number; y: number };
type Trace = { name: string; color: string; points: Point[] };

const root = document.querySelector<HTMLElement>('.viewer')!;
const requestedMode = new URLSearchParams(window.location.search).get('scene');
const mode = requestedMode === 'field-b' || requestedMode === 'paths' ? requestedMode : 'field-a';
const heatmap = document.querySelector<HTMLCanvasElement>('.heatmap')!;
const surface = document.querySelector<HTMLElement>('.surface')!;
const title = document.querySelector<HTMLElement>('#figure-title')!;
const valueLabel = document.querySelector<HTMLElement>('#sample-value')!;
const legend = document.querySelector<HTMLElement>('#path-legend')!;
const size = 48;

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(rng(), 1e-12))) * Math.cos(2 * Math.PI * rng());
}

function randomField(seed: number) {
  const rng = random(seed);
  const modes: { x: number; y: number; a: number; b: number }[] = [];
  const length = 0.15;
  for (let ky = -8; ky <= 8; ky++) {
    for (let kx = -8; kx <= 8; kx++) {
      if (kx === 0 && ky === 0) continue;
      const amplitude = Math.exp(-(Math.PI ** 2) * length ** 2 * (kx * kx + ky * ky));
      modes.push({ x: kx, y: ky, a: gaussian(rng) * amplitude, b: gaussian(rng) * amplitude });
    }
  }
  const values = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let height = 0;
      for (const wave of modes) {
        const phase = 2 * Math.PI * (wave.x * x + wave.y * y) / (size - 1);
        height += wave.a * Math.cos(phase) + wave.b * Math.sin(phase);
      }
      values[y * size + x] = height;
    }
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  for (let i = 0; i < values.length; i++) values[i] = 2 * (values[i] - min) / (max - min) - 1;
  return values;
}

function saddleField() {
  const values = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = 2 * x / (size - 1) - 1;
      const py = 2 * y / (size - 1) - 1;
      values[y * size + x] = px * px - py * py;
    }
  }
  return values;
}

const values = mode === 'paths' ? saddleField() : randomField(mode === 'field-a' ? 3 : 11);
title.textContent = mode === 'paths' ? '鞍点附近的三种轨迹' : `二维随机场 · 样本 ${mode === 'field-a' ? 'A' : 'B'}`;
legend.hidden = mode !== 'paths';
if (mode === 'paths') valueLabel.textContent = 'f(x,y) = x² − y² · 从同一起点出发';

const traces: Trace[] = [];
if (mode === 'paths') {
  const start = { x: 0.75, y: 0.08 };
  const gd: Point[] = [start];
  for (let i = 0; i < 4; i++) {
    const p = gd[gd.length - 1];
    gd.push({ x: p.x * 0.5, y: p.y * 1.5 });
  }
  traces.push({ name: '梯度下降', color: '#167cba', points: gd });
  traces.push({ name: '牛顿法', color: '#d64c4c', points: [start, { x: 0, y: 0 }] });
  traces.push({ name: 'SFN', color: '#16996e', points: [start, { x: 0, y: 0.16 }, { x: 0, y: 0.32 }, { x: 0, y: 0.64 }] });
}

const stops = [
  { t: 0, c: [37, 57, 105] },
  { t: 0.25, c: [39, 122, 156] },
  { t: 0.5, c: [82, 172, 150] },
  { t: 0.75, c: [213, 198, 107] },
  { t: 1, c: [238, 135, 73] },
];

function colorAt(value: number) {
  const t = Math.max(0, Math.min(1, (value + 1) / 2));
  const hi = Math.min(stops.length - 1, Math.ceil(t * 4));
  const lo = Math.max(0, hi - 1);
  const blend = hi === lo ? 0 : (t - stops[lo].t) / (stops[hi].t - stops[lo].t);
  return stops[lo].c.map((channel, i) => Math.round(channel + (stops[hi].c[i] - channel) * blend));
}

function heightAt(x: number, y: number) {
  if (mode === 'paths') return x * x - y * y;
  const ix = Math.max(0, Math.min(size - 1, Math.round((x + 1) * (size - 1) / 2)));
  const iy = Math.max(0, Math.min(size - 1, Math.round((y + 1) * (size - 1) / 2)));
  return values[iy * size + ix];
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f4f7f7');
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(2.2, 1.85, 2.3);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
surface.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff, 1.8));
const light = new THREE.DirectionalLight(0xffffff, 1.6);
light.position.set(-2, 4, 3);
scene.add(light);

const positions: number[] = [];
const colors: number[] = [];
const indices: number[] = [];
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const value = values[y * size + x];
    positions.push(2 * x / (size - 1) - 1, value * 0.55, 2 * y / (size - 1) - 1);
    const color = colorAt(value);
    colors.push(...color.map(channel => channel / 255));
    if (x < size - 1 && y < size - 1) {
      const a = y * size + x;
      indices.push(a, a + size, a + 1, a + 1, a + size, a + size + 1);
    }
  }
}
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
geometry.setIndex(indices);
geometry.computeVertexNormals();
scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 })));
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1.7;
controls.maxDistance = 7;
controls.target.set(0, 0, 0);

for (const trace of traces) {
  const points = trace.points.map(p => new THREE.Vector3(p.x, heightAt(p.x, p.y) * 0.55 + 0.035, p.y));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: trace.color, linewidth: 3 })));
  for (const point of points) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.029, 12, 12), new THREE.MeshBasicMaterial({ color: trace.color }));
    dot.position.copy(point);
    scene.add(dot);
  }
}

const selected = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
selected.visible = false;
scene.add(selected);

const sourceCanvas = document.createElement('canvas');
sourceCanvas.width = size;
sourceCanvas.height = size;
const sourceContext = sourceCanvas.getContext('2d')!;
const pixels = sourceContext.createImageData(size, size);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const color = colorAt(values[(size - 1 - y) * size + x]);
    const at = (y * size + x) * 4;
    pixels.data.set([...color, 255], at);
  }
}
sourceContext.putImageData(pixels, 0, 0);
let hover: Point | null = null;

function drawHeatmap() {
  const rect = heatmap.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  heatmap.width = Math.max(1, Math.round(rect.width * ratio));
  heatmap.height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = heatmap.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sourceCanvas, 0, 0, heatmap.width, heatmap.height);
  for (const trace of traces) {
    ctx.strokeStyle = trace.color;
    ctx.fillStyle = trace.color;
    ctx.lineWidth = 3 * ratio;
    ctx.beginPath();
    for (const [i, p] of trace.points.entries()) {
      const px = (p.x + 1) * heatmap.width / 2;
      const py = (1 - p.y) * heatmap.height / 2;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    for (const p of trace.points) {
      ctx.beginPath();
      ctx.arc((p.x + 1) * heatmap.width / 2, (1 - p.y) * heatmap.height / 2, 4 * ratio, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  if (hover) {
    const x = (hover.x + 1) * heatmap.width / 2;
    const y = (1 - hover.y) * heatmap.height / 2;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 * ratio;
    ctx.beginPath();
    ctx.arc(x, y, 7 * ratio, 0, Math.PI * 2);
    ctx.stroke();
  }
}

heatmap.addEventListener('pointermove', event => {
  const rect = heatmap.getBoundingClientRect();
  hover = {
    x: Math.max(-1, Math.min(1, 2 * (event.clientX - rect.left) / rect.width - 1)),
    y: Math.max(-1, Math.min(1, 1 - 2 * (event.clientY - rect.top) / rect.height)),
  };
  const value = heightAt(hover.x, hover.y);
  selected.position.set(hover.x, value * 0.55 + 0.04, hover.y);
  selected.visible = true;
  valueLabel.textContent = `x ${hover.x.toFixed(2)} · y ${hover.y.toFixed(2)} · f ${value.toFixed(2)}`;
  drawHeatmap();
});
heatmap.addEventListener('pointerleave', () => {
  hover = null;
  selected.visible = false;
  valueLabel.textContent = mode === 'paths' ? 'f(x,y) = x² − y² · 从同一起点出发' : '亮色表示较高的函数值';
  drawHeatmap();
});

function resize() {
  const width = surface.clientWidth;
  const height = surface.clientHeight;
  if (!width || !height) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  drawHeatmap();
}
new ResizeObserver(resize).observe(surface);
resize();
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

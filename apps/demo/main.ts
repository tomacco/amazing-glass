import '../../src/elements';
import { Glass, GlassField, supportsRefraction, registerBackdrop, backdropChanged, type GlassVariant } from '../../src/core';
import { refractOffset, rimHeight } from '../../src/core/optics';
import type { AgSegmented, AgSheet, AgTabBar, AgMenu, AgSlider } from '../../src/elements';
import { paint, type SceneName } from '../shared/scenes';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!supportsRefraction) $('#engine-note').hidden = false;

/* ------------------------------------------------ Animated colour fields */
// Soft blobs drifting on a canvas. Rendered at half resolution; the glass on top does the rest.
function blobs(canvas: HTMLCanvasElement, palette: string[], opts: { base: string; count: number; speed: number; alpha: number }) {
  const ctx = canvas.getContext('2d', { willReadFrequently: !supportsRefraction })!;
  const seeds = Array.from({ length: opts.count }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 0.25 + Math.random() * 0.35, c: palette[i % palette.length], p: Math.random() * 7, s: 0.6 + Math.random() }));
  registerBackdrop(canvas);
  let visible = true, lastShare = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const draw = (t: number) => {
    const w = Math.max(1, Math.round(canvas.clientWidth / 2)), h = Math.max(1, Math.round(canvas.clientHeight / 2));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.globalAlpha = 1;
    ctx.fillStyle = opts.base; ctx.fillRect(0, 0, w, h);
    for (const b of seeds) {
      const k = t * 0.00006 * opts.speed * b.s;
      const x = (b.x + Math.sin(k + b.p) * 0.18) * w, y = (b.y + Math.cos(k * 1.3 + b.p) * 0.18) * h, r = b.r * Math.max(w, h);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, b.c); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = opts.alpha; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    // The CPU fallback reads these pixels; tell it about changes a few times a second, not every frame.
    if (!supportsRefraction && t - lastShare > 120) { backdropChanged(canvas); lastShare = t; }
  };
  const loop = (t: number) => { if (visible) draw(t); if (!still) requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
blobs($('.hero-bg'), ['#1d4ed8', '#7c3aed', '#db2777', '#0891b2', '#f97316'], { base: '#08090d', count: 7, speed: 1, alpha: 0.55 });
blobs($('.control-bg'), ['#ff5e62', '#ff9966', '#5b8cff', '#a855f7', '#22d3ee', '#fbbf24', '#f472b6'], { base: '#0b1b4d', count: 9, speed: 1.6, alpha: 0.8 });

/* ------------------------------------------------ Hero lens */
const hero = $('.hero'), lensEl = $('#lens');
new Glass(lensEl, { variant: 'lens', params: { blur: 0, zoom: 1.12, bezel: 0.36, maxBezel: 60, depth: 0.9, dispersion: 0.05, rim: 1.4 } });
let hold = 0, px = 0, py = 0;
function placeLens(x: number, y: number) { px = x; py = y; lensEl.style.transform = `translate(${x - lensEl.offsetWidth / 2}px, ${y - lensEl.offsetHeight / 2}px)`; }
function driftLens(t: number) {
  if (performance.now() > hold) {
    const r = hero.getBoundingClientRect(), title = $('.hero-title').getBoundingClientRect();
    // A slow figure-eight across the headline.
    const cx = title.left - r.left + title.width * 0.5, cy = title.top - r.top + title.height * 0.5;
    placeLens(cx + Math.sin(t * 0.00035) * title.width * 0.38, cy + Math.sin(t * 0.0007) * title.height * 0.32);
  }
  if (!still) requestAnimationFrame(driftLens);
}
requestAnimationFrame(driftLens);
if (still) placeLens(innerWidth * 0.6, innerHeight * 0.4);
lensEl.addEventListener('pointerdown', e => {
  lensEl.setPointerCapture(e.pointerId);
  const r = hero.getBoundingClientRect(), ox = e.clientX - r.left - px, oy = e.clientY - r.top - py;
  const move = (ev: PointerEvent) => { hold = performance.now() + 4000; placeLens(ev.clientX - r.left - ox, ev.clientY - r.top - oy); };
  const up = () => { lensEl.removeEventListener('pointermove', move); lensEl.removeEventListener('pointerup', up); hold = performance.now() + 2500; };
  lensEl.addEventListener('pointermove', move);
  lensEl.addEventListener('pointerup', up);
});
$('#cta-proof').addEventListener('click', () => $('#proof').scrollIntoView({ behavior: 'smooth' }));
$('#cta-code').addEventListener('click', () => $('#use').scrollIntoView({ behavior: 'smooth' }));

/* ------------------------------------------------ Ray diagram */
const rays = $<HTMLCanvasElement>('#rays');
let depth = 1.2;
function drawRays(t: number) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = rays.clientWidth, H = rays.clientHeight;
  if (rays.width !== Math.round(W * dpr)) { rays.width = Math.round(W * dpr); rays.height = Math.round(H * dpr); }
  const c = rays.getContext('2d')!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const floor = H * 0.84, left = W * 0.22, bezel = W * 0.34, top = H * 0.3, thick = Math.max(8, (floor - top) * 0.45 * depth);
  const surface = (x: number) => { const t = Math.min(1, (x - left) / bezel); return floor - thick * rimHeight(Math.max(0, t)); };
  // The page underneath: a stripe pattern the rays land on.
  for (let x = 0; x < W; x += 14) { c.fillStyle = (x / 14) % 2 ? '#1f2a44' : '#2c3d66'; c.fillRect(x, floor, 14, H - floor); }
  // The glass body.
  c.beginPath(); c.moveTo(left, floor);
  for (let x = left; x <= W; x += 2) c.lineTo(x, surface(x));
  c.lineTo(W, floor); c.closePath();
  const g = c.createLinearGradient(0, top, 0, floor);
  g.addColorStop(0, 'rgba(160,200,255,0.30)'); g.addColorStop(1, 'rgba(160,200,255,0.08)');
  c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.5; c.stroke();
  // Rays: straight down to the surface, then shifted by the refraction offset where they land.
  const n = 9, sweep = (t * 0.00005) % 1;
  for (let i = 0; i < n; i++) {
    const f = ((i / n + sweep) % 1);
    const x = left + f * bezel * 1.25;
    const tt = Math.min(1, Math.max(0, (x - left) / bezel));
    const off = refractOffset(tt, bezel, thick, 1.5) * 0.9;
    const sy = surface(x);
    c.strokeStyle = `hsla(${200 + i * 8}, 100%, 70%, 0.95)`; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, 8); c.lineTo(x, sy); c.lineTo(x + off, floor); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x + off, floor, 3, 0, 7); c.fill();
  }
  c.fillStyle = 'rgba(244,245,247,0.6)'; c.font = '500 12px "Geist Mono", monospace';
  c.textAlign = 'right';
  c.fillText('view rays ↓', W - 12, 22);
  c.fillText('flat top: no bend', W - 12, floor - thick - 10);
  c.textAlign = 'left';
  c.fillText('curved rim', 12, floor - thick * 0.5);
  c.fillText('the page behind', 12, H - 10);
  if (!still) requestAnimationFrame(drawRays);
}
requestAnimationFrame(drawRays);

/* ------------------------------------------------ Playground */
const playEl = $('#play-glass'), playStage = $('.play-stage');
const play = new Glass(playEl, { variant: 'clear' });
const shapes: Record<GlassVariant, [number, number, string]> = { regular: [260, 120, '60px'], clear: [260, 120, '60px'], lens: [170, 170, '50%'] };
$<AgSegmented>('#play-variant').addEventListener('change', e => {
  const v = (e.target as AgSegmented).value.toLowerCase() as GlassVariant;
  const [w, h, r] = shapes[v];
  Object.assign(playEl.style, { width: `${w}px`, height: `${h}px`, borderRadius: r });
  play.setVariant(v);
  // Reset the sliders to the new preset's values.
  const p = play.currentParams;
  $<AgSlider>('#p-depth').value = p.depth; $<AgSlider>('#p-bezel').value = p.bezel;
  $<AgSlider>('#p-disp').value = p.dispersion; $<AgSlider>('#p-blur').value = p.blur;
  depth = p.depth;
});
const bind = (id: string, key: 'depth' | 'bezel' | 'dispersion' | 'blur') =>
  $<AgSlider>(id).addEventListener('input', e => {
    const v = (e.target as AgSlider).value;
    play.setParams({ [key]: v, ...(key === 'bezel' ? { maxBezel: 60 } : {}) });
    if (key === 'depth') depth = v;
  });
bind('#p-depth', 'depth'); bind('#p-bezel', 'bezel'); bind('#p-disp', 'dispersion'); bind('#p-blur', 'blur');
playEl.addEventListener('pointerdown', e => {
  playEl.setPointerCapture(e.pointerId);
  const r = playStage.getBoundingClientRect(), b = playEl.getBoundingClientRect();
  const ox = e.clientX - (b.left + b.width / 2), oy = e.clientY - (b.top + b.height / 2);
  const move = (ev: PointerEvent) => {
    playEl.style.left = `${Math.min(r.width, Math.max(0, ev.clientX - r.left - ox))}px`;
    playEl.style.top = `${Math.min(r.height, Math.max(0, ev.clientY - r.top - oy))}px`;
    backdropChanged();
  };
  const up = () => { playEl.removeEventListener('pointermove', move); playEl.removeEventListener('pointerup', up); };
  playEl.addEventListener('pointermove', move);
  playEl.addEventListener('pointerup', up);
});

/* ------------------------------------------------ Proof wipe */
const wipe = $('#wipe'), handle = $('.wipe-handle', wipe);
const setSplit = (f: number) => { const v = Math.min(100, Math.max(0, f)); wipe.style.setProperty('--split', `${v}%`); handle.setAttribute('aria-valuenow', String(Math.round(v))); };
wipe.addEventListener('pointerdown', e => {
  const r = wipe.getBoundingClientRect();
  const at = (ev: PointerEvent) => setSplit(((ev.clientX - r.left) / r.width) * 100);
  at(e); wipe.setPointerCapture(e.pointerId);
  const up = () => { wipe.removeEventListener('pointermove', at); wipe.removeEventListener('pointerup', up); };
  wipe.addEventListener('pointermove', at); wipe.addEventListener('pointerup', up);
});
handle.addEventListener('keydown', e => {
  const d = { ArrowLeft: -5, ArrowRight: 5 }[e.key];
  if (d) { e.preventDefault(); setSplit(Number(handle.getAttribute('aria-valuenow')) + d); }
});
$<AgSegmented>('#wipe-scene').addEventListener('change', e => {
  const s = (e.target as AgSegmented).selectedIndex ? 'dusk' : 'chart';
  $<HTMLImageElement>('.wipe-web', wipe).src = `assets/web-${s}.jpg`;
  $<HTMLImageElement>('.wipe-apple img', wipe).src = `assets/apple-${s}.jpg`;
});
// Sweep the divider once when it first scrolls into view, so the difference is obvious.
new IntersectionObserver(([e], o) => {
  if (!e.isIntersecting || still) return;
  o.disconnect();
  const t0 = performance.now();
  const step = (t: number) => { const k = Math.min(1, (t - t0) / 2200); setSplit(50 + Math.sin(k * Math.PI * 2) * 32 * (1 - k)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}, { threshold: 0.6 }).observe(wipe);

/* ------------------------------------------------ Menus and phone */
const menuItems = [
  { label: 'Share', icon: 'share' }, { label: 'Duplicate', icon: 'copy' }, { label: 'Rename', icon: 'pencil' },
  { separator: true as const }, { label: 'Delete', icon: 'trash', destructive: true },
];
$<AgMenu>('#demo-menu').items = menuItems;
$<AgMenu>('#phone-menu').items = [{ label: 'Share playlist', icon: 'share' }, { label: 'Add to library', icon: 'plus' }, { separator: true }, { label: 'Remove', icon: 'trash', destructive: true }];

const albums: [string, string, SceneName, number][] = [
  ['Neon Harbour', 'Night Drive', 'bloom', 4], ['Orchard', 'Juniper Lane', 'citrus', 11], ['Low Tide', 'Marisol', 'dusk', 21],
  ['Paper Kites', 'Fold', 'bloom', 9], ['Cinder', 'Oak & Ash', 'dusk', 3], ['Sunday Market', 'Pellucid', 'citrus', 5],
  ['Afterglow', 'Nine Lanterns', 'bloom', 17], ['Northbound', 'The Cairns', 'dusk', 8], ['Pith', 'Citrine', 'citrus', 2],
  ['Glasshouse', 'Lumen', 'bloom', 30], ['Ridgeline', 'Alder', 'dusk', 12], ['Zest', 'Pomelo', 'citrus', 14],
];
const albumsEl = $('#albums');
albumsEl.innerHTML = albums.map(([t, a], i) => `<button class="album" data-i="${i}"><canvas></canvas><b>${t}</b><span>${a}</span></button>`).join('');
const sheet = $<AgSheet>('#sheet');
$$<HTMLButtonElement>('.album', albumsEl).forEach(b => b.addEventListener('click', () => {
  const [t, a] = albums[Number(b.dataset.i)];
  $('#np-title').textContent = t; $('#np-artist').textContent = a;
  sheet.detent = 'medium';
}));
$('#phone').addEventListener('pointerdown', e => {
  const t = e.target as Element;
  if (sheet.detent !== 'closed' && !t.closest('ag-sheet') && !t.closest('.album')) sheet.detent = 'closed';
});
$<AgTabBar>('#tabs').items = [
  { label: 'Listen', icon: 'play' }, { label: 'Browse', icon: 'grid' }, { label: 'Library', icon: 'note' }, { label: 'You', icon: 'person' },
];

/* ------------------------------------------------ Liquid field */
const liquid = $('#liquid-stage'), fieldEl = $('#liquid-field');
const field = new GlassField(fieldEl, { variant: 'clear', merge: 60, params: { blur: 0.6, bezel: 0.4, maxBezel: 40, depth: 1.3, dispersion: 0.16, rim: 1.3 } });
let target = { x: 0.7, y: 0.5 }, drop = { x: 0.7, y: 0.5 }, pointerIn = false;
liquid.addEventListener('pointermove', e => { const r = liquid.getBoundingClientRect(); target = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; pointerIn = true; });
liquid.addEventListener('pointerleave', () => { pointerIn = false; });
let liquidVisible = false;
new IntersectionObserver(([e]) => { liquidVisible = e.isIntersecting; }).observe(liquid);
function liquidLoop(t: number) {
  if (liquidVisible) {
    const w = fieldEl.offsetWidth, h = fieldEl.offsetHeight;
    if (!pointerIn) target = { x: 0.5 + Math.sin(t * 0.0006) * 0.28, y: 0.5 + Math.sin(t * 0.0011) * 0.18 };
    drop.x += (target.x - drop.x) * 0.12; drop.y += (target.y - drop.y) * 0.12;
    const s = Math.min(w, h);
    field.setShapes([
      { x: w * 0.42, y: h * 0.5, w: s * 0.62, h: s * 0.3, r: s * 0.15 },
      { x: w * drop.x, y: h * drop.y, w: s * 0.26, h: s * 0.26, r: s * 0.13 },
      { x: w * 0.42 + Math.cos(t * 0.0009) * s * 0.42, y: h * 0.5 + Math.sin(t * 0.0009) * s * 0.3, w: s * 0.12, h: s * 0.12, r: s * 0.06 },
    ]);
  }
  requestAnimationFrame(liquidLoop);
}
requestAnimationFrame(liquidLoop);

/* ------------------------------------------------ Code */
const snippets: Record<string, string> = {
  HTML: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/tomacco/amazing-glass@main/dist/amazing-glass.css">
<script type="module" src="https://cdn.jsdelivr.net/gh/tomacco/amazing-glass@main/dist/amazing-glass.min.js"></script>

<ag-glass variant="clear">Anything you like</ag-glass>
<ag-switch checked></ag-switch>
<ag-segmented options="Day,Week,Month" value="Week"></ag-segmented>`,
  React: `// npm i github:tomacco/amazing-glass
import { useState } from 'react';
import 'amazing-glass/styles.css';
import { Glass, Switch, Segmented } from 'amazing-glass/react';

export function Settings() {
  const [on, setOn] = useState(true);
  return (
    <Glass variant="regular" params={{ blur: 8 }}>
      <Switch checked={on} onChange={setOn} />
      <Segmented options={['Day', 'Week', 'Month']} value="Week" />
    </Glass>
  );
}`,
  Vue: `<!-- npm i github:tomacco/amazing-glass -->
<script setup>
import { ref } from 'vue';
import 'amazing-glass/styles.css';
import { Glass, Switch, Segmented, vGlass } from 'amazing-glass/vue';
const on = ref(true);
const period = ref('Week');
</script>

<template>
  <Glass variant="clear">
    <Switch v-model="on" />
    <Segmented :options="['Day', 'Week', 'Month']" v-model="period" />
  </Glass>
  <div v-glass="{ variant: 'regular' }">Glass on any element</div>
</template>`,
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Single-pass tokenizer: each match is classified once, so no pass can touch another's output.
const TOKENS = /(<!--[\s\S]*?-->|(?<![:\w])\/\/[^\n]*)|("[^"\n]*"|'[^'\n]*')|(<\/?[\w-]+|\/?>)|\b(import|from|export|function|const|return)\b/g;
function highlight(src: string) {
  let out = '', last = 0;
  for (const m of src.matchAll(TOKENS)) {
    out += esc(src.slice(last, m.index));
    const cls = m[1] ? 'tok-com' : m[2] ? 'tok-str' : m[3] ? 'tok-tag' : 'tok-kw';
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = m.index! + m[0].length;
  }
  return out + esc(src.slice(last));
}
const codeEl = $('#code code');
const showCode = (k: string) => { codeEl.innerHTML = highlight(snippets[k]); };
showCode('HTML');
$<AgSegmented>('#code-tabs').addEventListener('change', e => showCode((e.target as AgSegmented).value));
$('#copy').addEventListener('click', async () => {
  const text = snippets[$<AgSegmented>('#code-tabs').value];
  try { await navigator.clipboard.writeText(text); } catch {
    const sel = getSelection(), range = document.createRange(); range.selectNodeContents(codeEl); sel?.removeAllRanges(); sel?.addRange(range);
  }
  const b = $('#copy'); const label = [...b.childNodes].find(n => n.nodeType === 3)!;
  label.textContent = 'Copied'; setTimeout(() => { label.textContent = 'Copy'; }, 1400);
});

/* ------------------------------------------------ Scenes and reveals */
function paintScenes() {
  $$<HTMLCanvasElement>('canvas.scene-canvas').forEach(c => paint(c, c.dataset.scene as SceneName));
  $$<HTMLCanvasElement>('.album canvas', albumsEl).forEach((c, i) => paint(c, albums[i][2], albums[i][3]));
}
requestAnimationFrame(paintScenes);
let resizeT = 0;
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = window.setTimeout(paintScenes, 150); });

// Reveal on scroll. Everything starts visible; only blocks below the fold are armed.
const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
if (!still) $$('.reveal, .reveal-y').forEach(el => {
  if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('armed'); io.observe(el); }
  else el.classList.add('in');
});

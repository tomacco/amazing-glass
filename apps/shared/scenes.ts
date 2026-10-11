// Procedural backdrops for the sites. Glass needs detail underneath to show refraction,
// so these paint photo-like scenes into canvases instead of loading images.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function layerRidge(ctx: CanvasRenderingContext2D, w: number, h: number, base: number, amp: number, color: string, rand: () => number, rough = 0.5) {
  ctx.beginPath();
  ctx.moveTo(0, h);
  let y = base;
  const step = w / 90;
  for (let x = 0; x <= w + step; x += step) {
    y += (rand() - 0.5) * amp * rough;
    y += (base - y) * 0.06;
    ctx.lineTo(x, y + Math.sin(x / w * 7 + base) * amp * 0.4);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Light and Space palettes for the skyspace: top, middle, low, horizon. The aperture drifts
// through them slowly, the way a Turrell sky does at dusk.
const SKIES = [
  ['#1a1446', '#6b3fd1', '#ff6a88', '#ffb25c'],
  ['#2a0f3d', '#c02a8a', '#ff5f6d', '#ffc36b'],
  ['#061a40', '#1f5fd1', '#39c6ff', '#b9f0ff'],
];
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`; };
/** The sky colours at time t (ms), easing from one palette to the next every 14 s. */
export function skyAt(t: number) {
  const f = (t / 14000) % SKIES.length, i = Math.floor(f), k = 0.5 - 0.5 * Math.cos((f - i) * Math.PI);
  const a = SKIES[i], b = SKIES[(i + 1) % SKIES.length];
  return a.map((c, j) => mix(c, b[j], k));
}

/**
 * A Light and Space room: a dim wall, a rectangle of sky cut into it, a disc of light and one
 * person standing in front of it. `align` puts the opening in the middle or to the right.
 */
export function skyspace(ctx: CanvasRenderingContext2D, w: number, h: number, t = 0, align: 'center' | 'right' | 'top' = 'center') {
  const sky = skyAt(t);
  const ax = align === 'right' ? w * 0.56 : w * 0.16, aw = align === 'right' ? w * 0.36 : w * 0.68;
  // 'top' is for phones: a band of sky above the text.
  const ay = h * (align === 'top' ? 0.09 : 0.1), ah = h * (align === 'top' ? 0.15 : 0.62), floor = ay + ah + h * (align === 'top' ? 0.02 : 0.08);
  // The wall takes a little of the sky's colour.
  ctx.fillStyle = '#0c0a12'; ctx.fillRect(0, 0, w, h);
  const spill = ctx.createRadialGradient(ax + aw / 2, ay + ah / 2, 0, ax + aw / 2, ay + ah / 2, Math.max(w, h) * 0.7);
  spill.addColorStop(0, sky[2]); spill.addColorStop(1, 'rgba(12,10,18,0)');
  ctx.globalAlpha = 0.28; ctx.fillStyle = spill; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
  // The opening.
  const g = ctx.createLinearGradient(0, ay, 0, ay + ah);
  g.addColorStop(0, sky[0]); g.addColorStop(0.45, sky[1]); g.addColorStop(0.8, sky[2]); g.addColorStop(1, sky[3]);
  ctx.save(); ctx.shadowColor = sky[2]; ctx.shadowBlur = Math.min(w, h) * 0.12;
  ctx.fillStyle = g; ctx.fillRect(ax, ay, aw, ah); ctx.restore();
  // A disc of light, low in the opening.
  const r = Math.min(aw, ah) * 0.2, cx = ax + aw * 0.62, cy = ay + ah * 0.66;
  const disc = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
  disc.addColorStop(0, 'rgba(255,248,232,1)'); disc.addColorStop(0.36, 'rgba(255,232,200,0.95)');
  disc.addColorStop(0.42, 'rgba(255,190,150,0.45)'); disc.addColorStop(1, 'rgba(255,160,140,0)');
  ctx.save(); ctx.beginPath(); ctx.rect(ax, ay, aw, ah); ctx.clip();
  ctx.fillStyle = disc; ctx.fillRect(ax, ay, aw, ah);
  // Thin horizontal lines, like coated glass catching the light.
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  for (let y = ay + 18; y < ay + ah; y += 18) { ctx.beginPath(); ctx.moveTo(ax, y + 0.5); ctx.lineTo(ax + aw, y + 0.5); ctx.stroke(); }
  ctx.restore();
  // The floor reflects the opening, faintly.
  const fl = ctx.createLinearGradient(0, floor, 0, h);
  fl.addColorStop(0, mix(hexOf(sky[2]), '#0c0a12', 0.75)); fl.addColorStop(1, '#0c0a12');
  ctx.fillStyle = fl; ctx.fillRect(0, floor, w, h - floor);
  // On phones the room ends under the band, so text below stays on a dark wall.
  if (align === 'top') { const f = ctx.createLinearGradient(0, floor, 0, floor + h * 0.1); f.addColorStop(0, 'rgba(12,10,18,0)'); f.addColorStop(1, '#0c0a12'); ctx.fillStyle = f; ctx.fillRect(0, floor, w, h - floor); }
  // One person, seen from behind, in the light.
  const ph = Math.min(h * 0.2, 150, ah * 0.6), px = ax + aw / 2, py = floor + ph * 0.06;
  ctx.fillStyle = '#08060c';
  const u = ph / 100, P = (pts: number[][]) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(px + x * u, py + y * u) : ctx.moveTo(px + x * u, py + y * u)); ctx.closePath(); ctx.fill(); };
  ctx.beginPath(); ctx.ellipse(px, py - 90 * u, 6 * u, 7.2 * u, 0, 0, 7); ctx.fill();
  // Shoulders and coat, arms close to the body, then two legs with a gap.
  P([[-3, -83], [3, -83], [13, -78], [15, -60], [14, -40], [11, -38], [10, -46], [8, -38], [-8, -38], [-10, -46], [-11, -38], [-14, -40], [-15, -60], [-13, -78]]);
  P([[-8, -39], [-0.8, -39], [-1.5, 0], [-7, 0]]);
  P([[0.8, -39], [8, -39], [7, 0], [1.5, 0]]);
  ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(px, py + 2, ph * 0.16, ph * 0.025, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
}
const hexOf = (rgb: string) => '#' + (rgb.match(/\d+/g) ?? ['0', '0', '0']).map(n => Number(n).toString(16).padStart(2, '0')).join('');

export type SceneName = 'dusk' | 'bloom' | 'citrus' | 'chart' | 'skyspace' | 'crystal' | 'rose' | 'planes';

export const scenes: Record<SceneName, (ctx: CanvasRenderingContext2D, w: number, h: number, seed?: number) => void> = {
  // Alpine dusk: bright sky over dark ridges, a lake with a reflection.
  dusk(ctx: CanvasRenderingContext2D, w: number, h: number, seed = 7) {
    const rand = rng(seed);
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#1e3a8a');
    sky.addColorStop(0.45, '#7c6fd6');
    sky.addColorStop(0.75, '#f59e8b');
    sky.addColorStop(1, '#fcd9a1');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // sun
    const sx = w * 0.64, sy = h * 0.5;
    const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.35);
    sun.addColorStop(0, 'rgba(255,245,215,1)');
    sun.addColorStop(0.08, 'rgba(255,230,180,0.95)');
    sun.addColorStop(0.3, 'rgba(255,180,140,0.35)');
    sun.addColorStop(1, 'rgba(255,160,140,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h);
    // stars
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rand() * 0.7})`;
      ctx.fillRect(rand() * w, rand() * h * 0.3, 1.2, 1.2);
    }
    layerRidge(ctx, w, h, h * 0.5, h * 0.09, '#8b6aa8', rand, 0.9);
    layerRidge(ctx, w, h, h * 0.56, h * 0.07, '#5b4a86', rand, 0.8);
    layerRidge(ctx, w, h, h * 0.62, h * 0.05, '#2f2a55', rand, 0.7);
    // lake with reflection
    const lake = ctx.createLinearGradient(0, h * 0.66, 0, h);
    lake.addColorStop(0, '#f2b99b'); lake.addColorStop(0.25, '#8f7cc9'); lake.addColorStop(1, '#1b2350');
    ctx.fillStyle = lake; ctx.fillRect(0, h * 0.66, w, h * 0.34);
    for (let i = 0; i < 70; i++) {
      const y = h * 0.67 + rand() * h * 0.3;
      ctx.fillStyle = `rgba(255,236,210,${0.15 + rand() * 0.35})`;
      ctx.fillRect(sx - 60 - rand() * 90, y, 120 + rand() * 180, 1.5);
    }
    // foreground pines
    ctx.fillStyle = '#12112a';
    for (let i = 0; i < 26; i++) {
      const x = rand() * w, th = h * (0.1 + rand() * 0.18), tw = th * 0.3, by = h * 0.68 + rand() * 6;
      ctx.beginPath(); ctx.moveTo(x, by - th); ctx.lineTo(x + tw / 2, by); ctx.lineTo(x - tw / 2, by); ctx.fill();
    }
  },

  // iOS-style wallpaper: saturated soft blobs.
  bloom(ctx: CanvasRenderingContext2D, w: number, h: number, seed = 3) {
    const rand = rng(seed);
    ctx.fillStyle = '#0b1b4d'; ctx.fillRect(0, 0, w, h);
    const cols = ['#ff5e62', '#ff9966', '#5b8cff', '#a855f7', '#22d3ee', '#fbbf24', '#f472b6'];
    for (let i = 0; i < 9; i++) {
      const x = rand() * w, y = rand() * h, r = (0.3 + rand() * 0.5) * Math.max(w, h);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, cols[i % cols.length]);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;
  },

  // Bright citrus still life: a light scene where dark glass text matters.
  citrus(ctx: CanvasRenderingContext2D, w: number, h: number, seed = 11) {
    const rand = rng(seed);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#fff7e6'); bg.addColorStop(1, '#ffe3c2');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const fruit = [['#ff9f1c', '#ffbf69'], ['#f7d02c', '#fff09a'], ['#ff5d5d', '#ffa3a3'], ['#8ac926', '#c7f283']];
    for (let i = 0; i < 16; i++) {
      const [c1, c2] = fruit[i % fruit.length];
      const x = rand() * w, y = rand() * h, r = 40 + rand() * 90;
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, c2); g.addColorStop(1, c1);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath(); ctx.arc(x + 8, y + 12, r, 0, 7); ctx.fill();
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      // segments
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85); ctx.stroke();
      }
    }
  },

  // Light and Space, still.
  skyspace(ctx: CanvasRenderingContext2D, w: number, h: number, seed = 0) { skyspace(ctx, w, h, seed * 1000); },

  // Glass Chain: a cold crystal, facets around a bright core.
  crystal(ctx: CanvasRenderingContext2D, w: number, h: number, seed = 5) {
    const rand = rng(seed);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#04121f'); bg.addColorStop(1, '#0d2a44');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const cx = w * 0.55, cy = h * 0.5, cols = ['#4fd6ff', '#a7f0ff', '#2a7bd8', '#d8fbff', '#7a6cff', '#1f9fbf'];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + rand() * 0.2, r1 = Math.min(w, h) * (0.1 + rand() * 0.15), r2 = Math.max(w, h) * (0.35 + rand() * 0.4);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a + 0.13) * r2, cy + Math.sin(a + 0.13) * r2);
      ctx.lineTo(cx + Math.cos(a + 0.26) * r1 * 1.4, cy + Math.sin(a + 0.26) * r1 * 1.4); ctx.closePath();
      ctx.globalAlpha = 0.35 + rand() * 0.5; ctx.fillStyle = cols[i % cols.length]; ctx.fill();
      ctx.globalAlpha = 0.8; ctx.strokeStyle = '#e6fdff'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  // Lux Nova: a rose window, coloured panes held in dark lead.
  rose(ctx: CanvasRenderingContext2D, w: number, h: number, seed = 9) {
    const rand = rng(seed);
    ctx.fillStyle = '#17131d'; ctx.fillRect(0, 0, w, h);
    const cols = ['#1f4fd8', '#c8203a', '#e8b21c', '#1d8f5a', '#6a2bb8', '#2a6fe8', '#d83a2a'];
    const cell = 34;
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      ctx.fillStyle = cols[Math.floor(rand() * cols.length)];
      ctx.globalAlpha = 0.75 + rand() * 0.25;
      ctx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
    }
    ctx.globalAlpha = 1;
    const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.42;
    ctx.strokeStyle = '#17131d'; ctx.lineWidth = 7;
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, (R * k) / 3, 0, 7); ctx.stroke(); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
    glow.addColorStop(0, 'rgba(255,240,200,0.35)'); glow.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  },

  // Bauhaus: flat planes in primary colour that overlap on cream paper.
  planes(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#efe8d8'; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#e5322d'; ctx.fillRect(w * 0.08, h * 0.16, w * 0.42, h * 0.5);
    ctx.fillStyle = '#ffd200'; ctx.beginPath(); ctx.arc(w * 0.58, h * 0.46, Math.min(w, h) * 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#1e4fc8'; ctx.fillRect(w * 0.36, h * 0.58, w * 0.52, h * 0.28);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#141414';
    ctx.fillRect(w * 0.08, h * 0.9, w * 0.84, 4); ctx.fillRect(w * 0.9, h * 0.08, 4, h * 0.82);
  },

  // Test card: stripes and type, the harshest check for refraction quality.
  chart(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#f8f8fa'; ctx.fillRect(0, 0, w, h);
    const cols = ['#ff383c', '#ff8d28', '#ffcc00', '#34c759', '#00c3d0', '#0088ff', '#6155f5', '#cb30e0'];
    const bw = w / cols.length;
    cols.forEach((c: string, i: number) => { ctx.fillStyle = c; ctx.fillRect(i * bw, 0, bw, h * 0.34); });
    ctx.strokeStyle = '#1c1c1e'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x + 0.5, h * 0.34); ctx.lineTo(x + 0.5, h * 0.62); ctx.stroke(); }
    for (let y = h * 0.34; y < h * 0.62; y += 24) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    ctx.fillStyle = '#1c1c1e';
    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, sans-serif';
    const words: string = 'Glass sits on its own layer above the content. It bends what is behind it at the rim and frosts the middle so text on top stays readable. '.repeat(40);
    let x = 12, y = h * 0.62 + 24;
    for (const word of words.split(' ')) {
      const ww = ctx.measureText(word + ' ').width;
      if (x + ww > w - 12) { x = 12; y += 22; }
      if (y > h - 8) break;
      ctx.fillText(word, x, y); x += ww;
    }
  },
};

import { registerBackdrop, backdropChanged } from '../../src/core';

/** Paint a scene into a canvas sized to its box and make it readable to the glass engine. */
export function paint(canvas: HTMLCanvasElement, name: SceneName, seed?: number) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scenes[name](ctx, r.width, r.height, seed);
  if (!(canvas as any).__agRegistered) { registerBackdrop(canvas); (canvas as any).__agRegistered = true; }
  else backdropChanged(canvas);
}

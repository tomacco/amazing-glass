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

export type SceneName = 'dusk' | 'bloom' | 'citrus' | 'chart';

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

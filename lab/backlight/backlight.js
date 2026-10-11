// Backlight lab. Research preview, not approved for production.
// A diffused light sits under every glass shape on the page. The cursor suggests where it
// should go; the light follows on a critically damped spring, slowly.
import '../../dist/elements.js';
import { registerBackdrop, backdropChanged, supportsRefraction } from '../../dist/core.js';
import { Sound, PING_NOTES, benchAudio } from './sound.js';

const q = new URLSearchParams(location.search);
const MODE = q.get('mode') || 'both';
const PARKED = q.get('light')?.split(',').map(Number);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = reduced || (PARKED?.length === 2 && PARKED.every(Number.isFinite));
const OMEGA = Number(q.get('omega')) || 1.0; // rad/s; 2 / OMEGA is roughly the time constant
const FOLLOW = 0.6;                           // fraction of the cursor offset the light takes
const H = 90;                                 // light depth below the glass, px
const REACH = 210;                            // falloff distance, px

const usePool = MODE === 'both' || MODE === 'backdrop' || MODE === 'param';
const useRim = MODE === 'both' || MODE === 'rim';
const useParam = MODE === 'param';

// ---- HUD
const modes = document.getElementById('modes');
for (const m of ['both', 'backdrop', 'rim', 'param']) {
  const a = document.createElement('a');
  const u = new URLSearchParams(location.search); u.set('mode', m);
  a.href = '?' + u; a.textContent = m;
  if (m === MODE) a.setAttribute('aria-current', 'page');
  modes.append(a);
}
const statsEl = document.getElementById('stats');

// ---- canvases
const room = document.getElementById('room'), halo = document.getElementById('halo'), rim = document.getElementById('rim');
const rctx = room.getContext('2d'), hctx = halo.getContext('2d'), lctx = rim.getContext('2d');
const ROOM_Q = 0.5, HALO_Q = 0.25;
let W = 0, Hh = 0, dpr = 1;
function resize() {
  W = innerWidth; Hh = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
  room.width = Math.ceil(W * ROOM_Q); room.height = Math.ceil(Hh * ROOM_Q);
  halo.width = Math.ceil(W * HALO_Q); halo.height = Math.ceil(Hh * HALO_Q);
  rim.width = Math.ceil(W * dpr); rim.height = Math.ceil(Hh * dpr);
  radii.clear();
}
addEventListener('resize', resize);
const radii = new Map();
resize();
registerBackdrop(room);

// ---- light state
const light = { x: W * 0.4, y: Hh * 0.45, vx: 0, vy: 0 };
const aim = { x: light.x, y: light.y };
if (still) {
  const [fx, fy] = PARKED?.length === 2 ? PARKED : [0.38, 0.42];
  light.x = aim.x = fx * W; light.y = aim.y = fy * Hh;
}
addEventListener('pointermove', e => { if (!still) { aim.x = e.clientX; aim.y = e.clientY; } }, { passive: true });
addEventListener('pointerdown', e => { if (!still) { aim.x = e.clientX; aim.y = e.clientY; } }, { passive: true });

function stepLight(dt, t) {
  if (still) return;
  // The cursor only suggests: the target is part of the way from the centre to the cursor,
  // plus a slow drift so the light never quite stops.
  const cx = W / 2, cy = Hh / 2;
  const tx = cx + (aim.x - cx) * FOLLOW + Math.sin(t * 0.00021) * 40;
  const ty = cy + (aim.y - cy) * FOLLOW + Math.sin(t * 0.00017 + 1.3) * 28;
  // Critically damped spring, semi-implicit Euler.
  light.vx += (OMEGA * OMEGA * (tx - light.x) - 2 * OMEGA * light.vx) * dt;
  light.vy += (OMEGA * OMEGA * (ty - light.y) - 2 * OMEGA * light.vy) * dt;
  light.x += light.vx * dt; light.y += light.vy * dt;
}

// ---- approach a: the light painted into the backdrop canvas
function paintRoom(t) {
  const c = rctx, s = ROOM_Q, w = room.width, h = room.height;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#040406';
  c.fillRect(0, 0, w, h);
  // Cool room wash, very faint, for the Turrell edge of the field.
  const wash = c.createRadialGradient(w / 2, h * 1.1, 0, w / 2, h * 1.1, Math.max(w, h));
  wash.addColorStop(0, 'rgba(40,30,90,0.35)'); wash.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = wash; c.fillRect(0, 0, w, h);
  const x = light.x * s, y = light.y * s, R = Math.max(W, Hh) * 0.6 * s;
  const strong = usePool ? 1 : 0.18;
  // Hue drifts slowly between amber and rose over about two minutes.
  const hue = 28 + 12 * Math.sin(t * 0.00005);
  const g = c.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, `hsla(40, 100%, 96%, ${0.95 * strong})`);
  g.addColorStop(0.05, `hsla(${hue + 8}, 100%, 82%, ${0.8 * strong})`);
  g.addColorStop(0.18, `hsla(${hue}, 95%, 58%, ${0.42 * strong})`);
  g.addColorStop(0.42, `hsla(${hue - 40}, 70%, 40%, ${0.16 * strong})`);
  g.addColorStop(1, 'hsla(260, 60%, 20%, 0)');
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  // A fine floor grid, darker than the light: visible only where the light falls, which is
  // what lets the eye read the bend at the rim.
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = 'rgba(0,0,0,0.16)';
  c.lineWidth = 1;
  c.beginPath();
  const step = 24 * s;
  for (let gx = 0; gx < w; gx += step) { c.moveTo(gx + 0.5, 0); c.lineTo(gx + 0.5, h); }
  for (let gy = 0; gy < h; gy += step) { c.moveTo(0, gy + 0.5); c.lineTo(w, gy + 0.5); }
  c.stroke();
}

// ---- approach b: rim emission from each shape's outline and the light position
const SAMPLE = 4; // px between rim samples
function targets() {
  const out = [...document.querySelectorAll('[data-bl]')];
  for (const s of ['.ag-switch-track', '.ag-switch-knob', '.ag-slider-thumb']) out.push(...document.querySelectorAll(s));
  return out;
}
let shapes = [];
function radiusOf(el, w, h) {
  let r = radii.get(el);
  if (r === undefined || el.matches('.ag-switch-knob, .ag-slider-thumb')) {
    const raw = getComputedStyle(el).borderTopLeftRadius;
    r = parseFloat(raw) || 0;
    if (raw.includes('%')) r = Math.min(w, h) * r / 100;
    radii.set(el, r);
  }
  return Math.min(r, w / 2, h / 2);
}

/** Walks a rounded rectangle outline; calls fn(x, y, nx, ny) every SAMPLE px. */
function walk(b, r, inset, fn) {
  const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
  const hw = b.width / 2 - inset, hh = b.height / 2 - inset, rr = Math.max(0, r - inset);
  const ax = hw - rr, ay = hh - rr;
  const line = (x0, y0, x1, y1, nx, ny) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / SAMPLE));
    for (let i = 0; i < n; i++) fn(cx + x0 + (x1 - x0) * i / n, cy + y0 + (y1 - y0) * i / n, nx, ny);
  };
  const arc = (ox, oy, a0) => {
    const n = Math.max(1, Math.round((Math.PI / 2) * rr / SAMPLE));
    for (let i = 0; i < n; i++) {
      const a = a0 + (Math.PI / 2) * i / n, nx = Math.cos(a), ny = Math.sin(a);
      fn(cx + ox + nx * rr, cy + oy + ny * rr, nx, ny);
    }
  };
  line(-ax, -hh, ax, -hh, 0, -1); arc(ax, -ay, -Math.PI / 2);
  line(hw, -ay, hw, ay, 1, 0);    arc(ax, ay, 0);
  line(ax, hh, -ax, hh, 0, 1);    arc(-ax, ay, Math.PI / 2);
  line(-hw, ay, -hw, -ay, -1, 0); arc(-ax, -ay, Math.PI);
}

/** Brightness of a rim point: distance falloff, strongest where the rim faces along the light path. */
function emission(x, y, nx, ny) {
  const vx = x - light.x, vy = y - light.y, d = Math.hypot(vx, vy, H);
  const c = Math.abs((nx * vx + ny * vy) / d);
  const fall = 1 / (1 + (d / REACH) * (d / REACH));
  return Math.min(1, fall * (0.28 + 0.72 * Math.pow(c, 1.3)) * 1.6);
}

const pts = [];
function drawRims() {
  lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lctx.clearRect(0, 0, W, Hh);
  hctx.setTransform(HALO_Q, 0, 0, HALO_Q, 0, 0);
  hctx.clearRect(0, 0, W, Hh);
  if (!useRim) return;
  lctx.lineCap = 'butt'; hctx.lineCap = 'round'; lctx.lineJoin = 'round';
  for (const s of shapes) {
    const b = s.getBoundingClientRect();
    if (!b.width || !b.height) continue;
    const r = radiusOf(s, b.width, b.height);
    pts.length = 0;
    walk(b, r, 0.8, (x, y, nx, ny) => pts.push(x, y, emission(x, y, nx, ny), nx, ny));
    const n = pts.length / 5;
    // Batch consecutive segments of equal (quantised) brightness into one path.
    for (const pass of [0, 1, 2]) {
      const c = pass === 2 ? hctx : lctx;
      c.lineWidth = pass === 0 ? 2 : pass === 1 ? 8 : 20;
      let cur = -1, prevLv = -1;
      for (let i = 0; i <= n; i++) {
        const j = (i % n) * 5, k = ((i + 1) % n) * 5;
        const e = pts[j + 2];
        const lv = Math.round(e * 24);
        if (lv !== cur || i === n) {
          if (cur > 0) c.stroke();
          if (i === n) break;
          cur = lv; prevLv = -1;
          const a = lv / 24;
          // Hot rims are near white; dim ones keep the colour of the light.
          const red = 255, grn = Math.round(150 + 100 * a), blu = Math.round(80 + 150 * a * a);
          const alpha = pass === 0 ? Math.min(1, a * 1.25) : pass === 1 ? a * 0.4 : a * a * 0.7;
          c.strokeStyle = `rgba(${red},${grn},${blu},${alpha})`;
          c.beginPath();
        }
        if (cur <= 0) continue;
        // The inner glow sits 3 px inside the rim, the halo 5 px outside it. One continuous
        // path per run, butt caps: overlapping round caps made the rim look beaded.
        const off = pass === 1 ? -3 : pass === 2 ? 5 : 0;
        if (lv !== prevLv) c.moveTo(pts[j] + pts[j + 3] * off, pts[j + 1] + pts[j + 4] * off);
        c.lineTo(pts[k] + pts[k + 3] * off, pts[k + 1] + pts[k + 4] * off);
        prevLv = lv;
      }
    }
  }
}

// ---- approach b2: the existing `light` and `rim` params, per instance
let paramChanges = 0, renderMs = 0;
// Glass.render runs in its own animation frame callback. Wrap it so its cost is counted.
function timeRenders() {
  for (const el of document.querySelectorAll('ag-glass, ag-button')) {
    const g = el.glass;
    if (!g) continue;
    for (const [obj, name] of [[g, 'render'], [g.cpu, 'render']]) {
      if (!obj || obj['_timed_' + name]) continue;
      const orig = obj[name].bind(obj);
      obj[name] = (...a) => { const t0 = performance.now(); orig(...a); renderMs += performance.now() - t0; };
      obj['_timed_' + name] = true;
    }
  }
}
function updateParams() {
  for (const el of document.querySelectorAll('ag-glass, ag-button')) {
    if (!el.glass) continue;
    const b = el.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    // Quantised, so the cached maps can be reused: 10 degree and 0.2 rim steps.
    const ang = Math.round(Math.atan2(light.y - cy, light.x - cx) * 180 / Math.PI / 10) * 10;
    const d = Math.hypot(light.x - cx, light.y - cy, H);
    const k = Math.round((0.2 + 2.2 / (1 + (d / REACH) ** 2)) * 5) / 5;
    const p = el.glass.currentParams;
    if (p.light !== ang || p.rim !== k) { el.glass.setParams({ light: ang, rim: k, rimWidth: 1.2 }); paramChanges++; }
  }
}

// ---- sound
const sound = new Sound();
const soundBtn = document.getElementById('sound');
soundBtn.addEventListener('click', async () => {
  const on = await sound.toggle();
  for (const n of soundBtn.childNodes) if (n.nodeType === 3 && n.textContent.trim()) n.textContent = on ? 'Sound on' : 'Sound off';
  soundBtn.setAttribute('aria-pressed', String(on));
});
document.getElementById('sw').addEventListener('change', e => sound.ping(e.target.checked ? PING_NOTES[4] : PING_NOTES[2], 0.06));
let lastTick = 0;
const sl = document.getElementById('sl');
sl.addEventListener('input', () => {
  const now = performance.now();
  if (now - lastTick < 140) return;
  lastTick = now;
  sound.ping(PING_NOTES[Math.round(sl.value / 100 * (PING_NOTES.length - 1))], 0.025);
});
// A ping when the light crosses a glass edge.
const inside = new Map(), lastPing = new Map();
function edgePings() {
  if (!sound.on) return;
  shapes.forEach((s, i) => {
    const b = s.getBoundingClientRect();
    const now = light.x > b.left && light.x < b.right && light.y > b.top && light.y < b.bottom;
    if (inside.has(s) && inside.get(s) !== now && performance.now() - (lastPing.get(s) || 0) > 700) {
      sound.ping(PING_NOTES[i % PING_NOTES.length], 0.045);
      lastPing.set(s, performance.now());
    }
    inside.set(s, now);
  });
}

// ---- frame loop and cost
const cost = [], gaps = [];
let prev = performance.now(), lastBackdrop = 0, frames = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - prev) / 1000);
  gaps.push(t - prev); prev = t;
  const t0 = performance.now();
  shapes = targets();
  stepLight(dt, t);
  paintRoom(t);
  drawRims();
  if (useParam || !supportsRefraction) timeRenders();
  if (useParam) updateParams();
  // Chromium refracts the canvas through the SVG filter on its own. Other browsers run the
  // CPU fallback, which has to read the canvas back: do that a few times a second only.
  if (!supportsRefraction && t - lastBackdrop > 250) { backdropChanged(room); lastBackdrop = t; }
  sound.light(light.x / W, light.y / Hh);
  edgePings();
  // renderMs holds map rebuilds from the previous frame (param mode and the CPU fallback).
  cost.push(performance.now() - t0 + renderMs); renderMs = 0;
  if (cost.length > 240) { cost.shift(); gaps.shift(); }
  if (++frames % 15 === 0) statsEl.textContent = summary();
  requestAnimationFrame(frame);
}
function summary() {
  const s = blStats();
  return `${MODE} · ${s.refraction} · update ${s.meanMs} ms mean, ${s.p95Ms} ms p95, ${s.maxMs} ms max · ${s.fps} fps${useParam ? ` · ${paramChanges} param changes` : ''}`;
}
window.blStats = () => {
  const sorted = [...cost].sort((a, b) => a - b), m = cost.reduce((a, b) => a + b, 0) / (cost.length || 1);
  const g = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
  return { mode: MODE, refraction: supportsRefraction ? 'svg filter' : 'cpu fallback', frames: cost.length,
    meanMs: +m.toFixed(2), p95Ms: +(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(2), maxMs: +(sorted[sorted.length - 1] || 0).toFixed(2), fps: Math.round(1000 / g), paramChanges };
};
window.blAudioBench = benchAudio;
await customElements.whenDefined('ag-switch');
requestAnimationFrame(frame);

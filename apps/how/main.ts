// Inside the glass: every layer is computed with the library's own code (the same refraction
// map, rim light and channel offsets the engine uses), then stacked in 3D and pulled apart by
// scroll position.
import { resolveParams } from '../../src/core/params';
import { bezelWidth, roundedRect } from '../../src/core/optics';
import { computeMaps, rawOffsets } from '../../src/core/maps';
import { scenes } from '../shared/scenes';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll(s)] as T[];

// Geometry, in the rig's own CSS pixels. Everything is rendered at 2x.
const W = 640, H = 400, S = 2;
const cap = { x: 160, y: 158, w: 320, h: 120, r: 60 };
// Exaggerated a little (frost, dispersion) so each step is visible on its own.
const P = resolveParams('clear', { blur: 3, bezel: 0.45, maxBezel: 44, depth: 1.3, dispersion: 0.12, rim: 1.5, rimWidth: 1.1, shade: 0.1, saturate: 1.45, contrast: 0.88, lum: 1.05 });

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; return c; };

await document.fonts.ready;

// 1. The page behind: a scene and a line of type, which shows bending best.
const back = canvas(W, H);
{
  const x = back.getContext('2d')!;
  x.scale(S, S);
  scenes.dusk(x, W, H, 7);
  x.fillStyle = '#f5f5f7';
  x.font = '800 78px "Bricolage Grotesque", sans-serif';
  x.textAlign = 'center';
  (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-3px';
  x.fillText('light bends', W / 2, cap.y + cap.h / 2 + 26);
}

// 2. Frost: the backdrop blurred, as feGaussianBlur does.
const frostFull = canvas(W, H);
{ const x = frostFull.getContext('2d')!; x.filter = `blur(${P.blur * S}px)`; x.drawImage(back, 0, 0); }
const crop = (src: HTMLCanvasElement) => { const c = canvas(cap.w, cap.h); c.getContext('2d')!.drawImage(src, cap.x * S, cap.y * S, cap.w * S, cap.h * S, 0, 0, cap.w * S, cap.h * S); return c; };
const frost = crop(frostFull);

// 3. The refraction map, from the engine.
const sample = (px: number, py: number) => roundedRect(px - cap.w / 2, py - cap.h / 2, cap.w / 2, cap.h / 2, cap.r);
const bezel = bezelWidth(cap.w, cap.h, P.bezel, P.maxBezel);
const maps = computeMaps(cap.w, cap.h, sample, P, bezel, { q: S, dpr: S });
const mapC = canvas(cap.w, cap.h);
mapC.getContext('2d')!.putImageData(maps.displacement, 0, 0);

// 4. Three bends: the frosted backdrop displaced once per colour channel.
const raw = rawOffsets('how', maps.displacement, S, maps.scale);
const src = frostFull.getContext('2d')!.getImageData(0, 0, W * S, H * S).data;
const chans = [0, 1, 2].map(ch => {
  const c = canvas(cap.w, cap.h), x = c.getContext('2d')!, out = x.createImageData(c.width, c.height);
  const f = 1 + (1 - ch) * P.dispersion; // red bends most, blue least
  for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) {
    const i = y * c.width + xx, sx = Math.round(cap.x * S + xx + raw.dx[i] * f * S), sy = Math.round(cap.y * S + y + raw.dy[i] * f * S);
    const si = (Math.min(H * S - 1, Math.max(0, sy)) * W * S + Math.min(W * S - 1, Math.max(0, sx))) * 4;
    out.data[i * 4 + ch] = src[si + ch];
    out.data[i * 4 + 3] = 255;
  }
  x.putImageData(out, 0, 0);
  return c;
});

// 5. Colour grade: the three channels added back together, then saturation and contrast.
const combined = canvas(cap.w, cap.h);
{ const x = combined.getContext('2d')!; x.globalCompositeOperation = 'lighter'; chans.forEach(c => x.drawImage(c, 0, 0)); }
const grade = canvas(cap.w, cap.h);
{ const x = grade.getContext('2d')!; x.filter = `saturate(${P.saturate}) brightness(${P.lum}) contrast(${P.contrast})`; x.drawImage(combined, 0, 0); }

// 6. Tint and rim light, from the engine's specular map.
const rim = canvas(cap.w, cap.h);
{
  const x = rim.getContext('2d')!;
  x.fillStyle = 'rgb(255 255 255 / 0.1)'; x.fillRect(0, 0, rim.width, rim.height);
  const s = canvas(cap.w, cap.h); s.getContext('2d')!.putImageData(maps.specular, 0, 0);
  x.drawImage(s, 0, 0);
}

// 7. The shape: the border-radius clip, drawn as an outline.
const outline = canvas(cap.w, cap.h);
{
  const x = outline.getContext('2d')!;
  x.strokeStyle = 'rgb(245 245 247 / 0.9)'; x.lineWidth = 2 * S; x.setLineDash([8 * S, 6 * S]);
  x.beginPath(); x.roundRect(S, S, outline.width - 2 * S, outline.height - 2 * S, cap.r * S - S); x.stroke();
}

// The finished glass: grade, tint and rim together.
const final = canvas(cap.w, cap.h);
{ const x = final.getContext('2d')!; x.drawImage(grade, 0, 0); x.drawImage(rim, 0, 0); }

/* ---------------- Place the planes ---------------- */
const planes = $$('.plane');
const [pBack, pFrost, pMap, pR, pG, pB, pGrade, pRim, pOutline, pFinal] = planes;
pBack.prepend(back);
([[pFrost, frost], [pMap, mapC], [pR, chans[0]], [pG, chans[1]], [pB, chans[2]], [pGrade, grade], [pRim, rim], [pOutline, outline], [pFinal, final]] as const)
  .forEach(([pl, c]) => { pl.prepend(c); Object.assign(pl.style, { left: `${cap.x}px`, top: `${cap.y}px`, width: `${cap.w}px`, height: `${cap.h}px` }); });

// Depth of each plane when fully exploded (rig px), and which caption step it belongs to.
const depth = [0, 70, 135, 200, 218, 236, 300, 365, 430, 0];
const stepOf = [0, 1, 2, 3, 3, 3, 4, 5, 6, -1];

/* ---------------- Scroll timeline ---------------- */
const section = $('#exploded'), rig = $('#rig'), intro = $('#intro'), outro = $('#outro'), bar = $('#bar');
const caps = $$('#captions li');
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const STEP0 = 0.2, STEP1 = 0.84, STEPS = 7;
let lastStep = -2;

function frame() {
  const r = section.getBoundingClientRect(), vh = innerHeight;
  const p = clamp(-r.top / (r.height - vh));
  // a: how far apart the layers are. In over 6-20%, out over 84-96%.
  const a = ease(p < 0.5 ? clamp((p - 0.06) / 0.14) : 1 - clamp((p - 0.84) / 0.12));
  const narrow = innerWidth < 860;
  const fit = Math.min((innerWidth - 40) / W, (vh * (narrow ? 0.5 : 0.62)) / H, 1.25);
  // Assembled, the object rests below the title at the start and above the closing text at
  // the end; exploded, the stack sits a little low so its top layer stays on screen.
  const end = p > 0.5;
  const rest = end ? { y: -vh * 0.1, s: 0.78 } : { y: vh * 0.17, s: 0.8 };
  const scale = fit * ((1 - a) * rest.s + a * (narrow ? 0.66 : 0.74));
  const shiftX = narrow ? 0 : -innerWidth * 0.12 * a, shiftY = (narrow ? -vh * 0.02 : vh * 0.1) * a + (1 - a) * rest.y;
  rig.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(${scale}) rotateX(${56 * a}deg) rotateZ(${-32 * a}deg)`;

  const step = a > 0.92 ? clamp(Math.floor((p - STEP0) / ((STEP1 - STEP0) / STEPS)), 0, STEPS - 1) : -1;
  planes.forEach((pl, i) => {
    const z = depth[i] * a + i * 0.4;
    pl.style.transform = `translateZ(${z}px)`;
    const own = stepOf[i];
    let o: number;
    if (i === 9) o = 1 - a;                               // finished glass: only when assembled
    else if (i === 0) o = step >= 0 && step !== 0 ? 0.55 + 0.45 * (1 - a) : 1;
    else o = a * (step < 0 || own === step ? 1 : 0.28);
    pl.style.opacity = String(o);
    pl.classList.toggle('active', own === step);
    const tag = pl.querySelector<HTMLElement>('.tag');
    if (tag) tag.style.opacity = String(a > 0.9 ? 1 : 0);
  });
  if (step !== lastStep) { caps.forEach((c, i) => c.classList.toggle('on', i === step)); lastStep = step; }
  intro.style.opacity = String(1 - clamp(p / 0.06));
  outro.style.opacity = String(clamp((p - 0.93) / 0.05));
  bar.style.width = `${p * 100}%`;
}

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (still) {
  // No scroll choreography: the layers as a plain list.
  section.hidden = true;
  const list = $('#static-list'), st = $('#static');
  st.hidden = false;
  const items: [string, HTMLCanvasElement][] = [['1', back], ['2', frost], ['3', mapC], ['4', combined], ['5', grade], ['6', rim], ['7', final]];
  list.innerHTML = '';
  items.forEach(([n, c], i) => {
    const row = document.createElement('div'); row.className = 'static-item';
    const copy = canvas(c.width / S, c.height / S); copy.getContext('2d')!.drawImage(c, 0, 0);
    const text = caps[i].cloneNode(true) as HTMLElement; text.classList.add('on');
    row.append(copy, text); list.append(row);
    void n;
  });
} else {
  let queued = false;
  const tick = () => { queued = false; frame(); };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(tick); } }, { passive: true });
  addEventListener('resize', frame);
  frame();
}

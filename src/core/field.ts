import { resolveParams, type GlassParams, type GlassVariant } from './params';
import { computeMaps, displacementScale, pngUrl, rawOffsets, shaders, type MapPixels } from './maps';
import { bezelWidth, boxDistance, smoothMin, type Box } from './optics';
import { createFilter, cssBackdrop, supportsRefraction, updateFilter } from './filter';
import { CpuRefraction } from './fallback';
import { FieldGL, webgl2Available } from './field-gl';

export type { Box };

let uid = 0;

/**
 * Several glass shapes that melt into each other when they get close, like SwiftUI's
 * GlassEffectContainer. Shapes are rounded boxes; their signed distance fields are blended
 * with a smooth minimum, and refraction, rim light and outline all follow the merged field.
 *
 *   const field = new GlassField(el, { merge: 40 });
 *   field.setShapes([{ x: 80, y: 60, w: 120, h: 64, r: 32 }, { x: 200, y: 60, w: 64, h: 64, r: 32 }]);
 *
 * How a frame is built, cheapest first:
 * 1. Each shape's maps are computed once per size and cached as a sprite.
 * 2. Every frame, sprites are stamped into the frame buffers at the shapes' positions.
 * 3. The smooth minimum only changes the surface where two shapes are within merge distance,
 *    so only a box around each such neck is recomputed from the full distance field.
 * 4. The buffers are encoded as PNG data URLs. (Uncompressed BMP was tried: it moves the
 *    same cost into the browser's decoder and measured no faster. See lab/field-perf.html.)
 */
export class GlassField {
  readonly el: HTMLElement;
  readonly layer: HTMLSpanElement;
  private params: GlassParams;
  private merge: number;
  private shapes: Box[] = [];
  private frame = 0;
  private filter?: SVGFilterElement;
  private cpu?: CpuRefraction;
  private readonly id = `ag-field-${++uid}`;
  private fit: boolean;
  private margin: number;
  private lastSet = 0;
  private settle = 0;
  private sprites = new Map<string, MapPixels>();
  /** Which renderer is active: 'svg' (stable path) or 'webgl' (experimental, opt-in). */
  readonly renderer: 'svg' | 'webgl' = 'svg';
  private gl?: FieldGL;
  private tint: [number, number, number, number] = [1, 1, 1, 0.05];
  /** Timing of the last frame, for benchmarks: total, and the part spent on neck regions. */
  lastFrame = { ms: 0, regionMs: 0, regions: 0 };

  /**
   * Options:
   * - `merge`: distance in px over which shapes melt together.
   * - `fit`: shapes are given in the coordinates of the element's offset parent, and the
   *   element resizes itself to just the shapes, which keeps the per-pixel work small.
   * - `margin`: extra room around fitted shapes, for the merge bridges and the rim.
   * - `renderer: 'webgl'` (experimental) with `backdrop: canvas`: render on the GPU from a
   *   canvas the page draws itself. The element then covers the area the shapes move in, and
   *   shapes are in its coordinates; `fit` is ignored. Falls back to the SVG path when WebGL2
   *   is unavailable. Check `field.renderer` to see which one runs.
   */
  constructor(el: HTMLElement, opts: { variant?: GlassVariant; params?: Partial<GlassParams>; merge?: number; fit?: boolean; margin?: number; renderer?: 'svg' | 'webgl'; backdrop?: HTMLCanvasElement } = {}) {
    this.el = el;
    this.params = resolveParams(opts.variant ?? 'clear', opts.params);
    this.merge = opts.merge ?? 36;
    this.fit = opts.fit ?? false;
    this.margin = opts.margin ?? this.merge;
    if (this.fit) Object.assign(el.style, { position: 'absolute', left: '0px', top: '0px' });
    el.classList.add('ag-glass', 'ag-field');
    el.dataset.variant = opts.variant ?? 'clear';
    this.layer = document.createElement('span');
    this.layer.className = 'ag-refract';
    this.layer.setAttribute('aria-hidden', 'true');
    el.prepend(this.layer);
    if (opts.renderer === 'webgl' && opts.backdrop && webgl2Available()) {
      try {
        this.gl = new FieldGL(el, opts.backdrop);
        (this as { renderer: 'svg' | 'webgl' }).renderer = 'webgl';
        this.fit = false;
        el.classList.add('ag-field-gl');
        this.readTint();
      } catch { this.gl = undefined; }
    }
  }

  /** The tint comes from CSS (--ag-tint), so the GPU path honours the same theming. */
  private readTint() {
    const probe = getComputedStyle(this.layer).backgroundColor;
    const m = probe.match(/rgba?\(([^)]+)\)/);
    if (!m) return;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    this.tint = [r / 255, g / 255, b / 255, a];
  }

  setShapes(shapes: Box[]) {
    this.shapes = shapes;
    if (this.gl) {
      if (!this.frame) this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        const t0 = performance.now();
        this.gl!.draw(this.shapes, { ...this.params, zoom: 1 }, this.merge, this.tint);
        this.presented++;
        this.lastFrame = { ms: performance.now() - t0, regionMs: 0, regions: 0 };
      });
      return;
    }
    // Updates arriving faster than every 100 ms mean motion: render a draft now and a
    // full-quality frame once things settle.
    const now = performance.now(), live = now - this.lastSet < 100;
    this.lastSet = now;
    clearTimeout(this.settle);
    if (live) this.settle = window.setTimeout(() => this.render(false), 150);
    if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(live); });
  }

  setParams(params: Partial<GlassParams>) {
    this.params = { ...this.params, ...params };
    this.sprites.clear();
    if (this.gl) this.readTint();
    this.setShapes(this.shapes);
  }

  /** Cached maps for one shape, drawn with the field's shared rim width and scale. */
  private sprite(s: Box, bezel: number, scale: number, draft: boolean): MapPixels {
    const key = [s.w, s.h, s.r, bezel, scale, draft].join('|');
    let m = this.sprites.get(key);
    if (!m) {
      const pad = 2, w = s.w + pad * 2, h = s.h + pad * 2;
      const one = { x: w / 2, y: h / 2, w: s.w, h: s.h, r: s.r };
      m = computeMaps(w, h, sampler([one], 0), { ...this.params, zoom: 1 }, bezel, { mask: true, sprite: true, scale, q: 1, dpr: fieldDpr(draft) });
      if (this.sprites.size > 64) this.sprites.clear();
      this.sprites.set(key, m);
    }
    return m;
  }

  private render(draft = false) {
    if (!this.shapes.length) return;
    const t0 = performance.now();
    // Whole-pixel positions: sprites, neck regions and the frame share one grid, so the
    // recomputed necks line up with the stamped sprites without a seam.
    // Even sizes put every centre on a whole pixel too.
    const even = (v: number) => Math.max(2, 2 * Math.round(v / 2));
    let shapes = this.shapes.map(s => ({ ...s, x: Math.round(s.x), y: Math.round(s.y), w: even(s.w), h: even(s.h) }));
    let box: FieldFrame['box'];
    if (this.fit) {
      const m = Math.ceil(this.margin);
      const x0 = Math.min(...shapes.map(s => s.x - Math.ceil(s.w / 2))) - m, y0 = Math.min(...shapes.map(s => s.y - Math.ceil(s.h / 2))) - m;
      const x1 = Math.max(...shapes.map(s => s.x + Math.ceil(s.w / 2))) + m, y1 = Math.max(...shapes.map(s => s.y + Math.ceil(s.h / 2))) + m;
      // Applied with the frame's images in present(), so outline and position never disagree.
      box = { transform: `translate(${x0}px, ${y0}px)`, width: `${x1 - x0}px`, height: `${y1 - y0}px` };
      shapes = shapes.map(s => ({ ...s, x: s.x - x0, y: s.y - y0 }));
    }
    const w = box ? parseInt(box.width) : this.el.offsetWidth, h = box ? parseInt(box.height) : this.el.offsetHeight;
    if (!w || !h) return;
    const p = { ...this.params, zoom: 1 }, k = this.merge;
    const minSide = Math.min(...shapes.map(s => Math.min(s.w, s.h)));
    const bezel = bezelWidth(minSide, minSide, p.bezel, p.maxBezel);
    const scale = displacementScale(minSide, minSide, p, bezel);
    // Displacement stays at full resolution (sprites make it cheap); draft lowers the rim only.
    const q = 1, dpr = fieldDpr(draft);

    // Frame buffers: neutral displacement, empty rim and mask.
    const D = new ImageData(Math.ceil(w * q), Math.ceil(h * q)), S = new ImageData(Math.ceil(w * dpr), Math.ceil(h * dpr)), M = new ImageData(S.width, S.height);
    new Uint32Array(D.data.buffer).fill(0xff808080);

    // 1-2. Stamp the cached sprite of every shape.
    for (const s of shapes) {
      const sp = this.sprite(s, bezel, scale, draft), pad = 2;
      const ox = s.x - s.w / 2 - pad, oy = s.y - s.h / 2 - pad;
      stamp(D, sp.displacement, Math.round(ox * q), Math.round(oy * q), 'opaque');
      stamp(S, sp.specular, Math.round(ox * dpr), Math.round(oy * dpr), 'max');
      stamp(M, sp.mask!, Math.round(ox * dpr), Math.round(oy * dpr), 'max');
    }

    // 3. Recompute the necks. The smooth minimum differs from a plain minimum only where
    // two distances are within `merge` of each other, and that only matters near the surface,
    // so it lives within ~1.25 x merge of both shapes: the overlap of their grown boxes.
    const r0 = performance.now();
    const grow = Math.ceil(k * 1.25 + 4);
    const sh = shaders(p, bezel, scale, w, h);
    const d32 = new Uint32Array(D.data.buffer), s32 = new Uint32Array(S.data.buffer), m32 = new Uint32Array(M.data.buffer);
    const deep = -2.5 * bezel;
    // Only pixels where the two distances are within `merge` of each other can differ from
    // the stamped sprites; everywhere else the smooth minimum equals the plain minimum.
    // Mark the union of all neck boxes, so each pixel is visited once however many pairs
    // overlap there (small drops with a large merge distance overlap almost everywhere).
    const marks = new Uint8Array(w * h);
    let regions = 0;
    for (let i = 0; i < shapes.length; i++) for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i], b = shapes[j];
      // No neck unless the surfaces come within merge distance. The gap between the boxes
      // never exceeds the gap between the rounded shapes, so this test is conservative.
      const gx = Math.max(0, Math.abs(a.x - b.x) - (a.w + b.w) / 2), gy = Math.max(0, Math.abs(a.y - b.y) - (a.h + b.h) / 2);
      if (Math.hypot(gx, gy) >= k) continue;
      const x0 = Math.max(0, Math.floor(Math.max(a.x - a.w / 2, b.x - b.w / 2) - grow)), x1 = Math.min(w, Math.ceil(Math.min(a.x + a.w / 2, b.x + b.w / 2) + grow));
      const y0 = Math.max(0, Math.floor(Math.max(a.y - a.h / 2, b.y - b.h / 2) - grow)), y1 = Math.min(h, Math.ceil(Math.min(a.y + a.h / 2, b.y + b.h / 2) + grow));
      if (x1 - x0 < 2 || y1 - y0 < 2) continue;
      for (let y = y0; y < y1; y++) marks.fill(1, y * w + x0, y * w + x1);
      regions++;
    }
    // Per pixel: every shape's distance and gradient once, then the smooth fold from those.
    // A pixel differs from the stamped sprites only if its two nearest shapes are within
    // `merge` of each other.
    const n = shapes.length, dd = new Float64Array(n), gxs = new Float64Array(n), gys = new Float64Array(n);
    const out = { d: 0, nx: 0, ny: 0 };
    const fold = (px: number, py: number, grad: boolean): boolean => {
      let m1 = 1e9, m2 = 1e9;
      // Inlined rounded-box distance and gradient: this is the hot loop, so no allocation.
      for (let i = 0; i < n; i++) {
        const sp = shapes[i], dx = px - sp.x, dy = py - sp.y, sx = dx < 0 ? -1 : 1, sy = dy < 0 ? -1 : 1;
        const qx = Math.abs(dx) - (sp.w / 2 - sp.r), qy = Math.abs(dy) - (sp.h / 2 - sp.r);
        let dist: number;
        if (qx > 0 && qy > 0) { const len = Math.sqrt(qx * qx + qy * qy); dist = len - sp.r; gxs[i] = (sx * qx) / len; gys[i] = (sy * qy) / len; }
        else if (qx > qy) { dist = qx - sp.r; gxs[i] = sx; gys[i] = 0; }
        else { dist = qy - sp.r; gxs[i] = 0; gys[i] = sy; }
        dd[i] = dist;
        if (dist < m1) { m2 = m1; m1 = dist; } else if (dist < m2) m2 = dist;
      }
      if (m2 - m1 >= k || m1 > k + 1.5) return false;
      let d = 1e9, gx = 0, gy = 0;
      for (let i = 0; i < n; i++) {
        const diff = Math.abs(d - dd[i]);
        if (diff >= k) { if (dd[i] < d) { d = dd[i]; gx = gxs[i]; gy = gys[i]; } continue; }
        const hh = (k - diff) / k, wa = d < dd[i] ? 1 - hh / 2 : hh / 2;
        d = Math.min(d, dd[i]) - hh * hh * k * 0.25;
        if (grad) { gx = gx * wa + gxs[i] * (1 - wa); gy = gy * wa + gys[i] * (1 - wa); }
      }
      if (d > 1.5 || d < deep) return false;
      const gl = Math.sqrt(gx * gx + gy * gy) || 1;
      out.d = d; out.nx = gx / gl; out.ny = gy / gl;
      return true;
    };
    if (regions) {
      // Draft: shading once per 2 x 2 block (motion hides it), outline mask per pixel (it does not).
      const step = draft ? 2 : 1, same = dpr === q;
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
        if (!marks[y * w + x]) continue;
        const cx = x + step / 2, cy = y + step / 2;
        if (!fold(cx, cy, true)) continue;
        const s = out;
        const disp = sh.displacement(s.d, s.nx, s.ny, cx, cy), spec = sh.specular(s.d, s.nx, s.ny, dpr);
        for (let yy = y; yy < Math.min(h, y + step); yy++) for (let xx = x; xx < Math.min(w, x + step); xx++) {
          d32[yy * D.width + xx] = disp;
          if (same) s32[yy * S.width + xx] = spec;
        }
      }
      if (same) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (!marks[y * w + x]) continue;
          if (fold(x + 0.5, y + 0.5, false)) m32[y * S.width + x] = sh.mask(out.d, dpr);
        }
      } else for (let y = 0; y < S.height; y++) for (let x = 0; x < S.width; x++) {
        if (!marks[Math.min(h - 1, Math.floor(y / dpr)) * w + Math.min(w - 1, Math.floor(x / dpr))]) continue;
        if (!fold((x + 0.5) / dpr, (y + 0.5) / dpr, true)) continue;
        const s = out, i = y * S.width + x;
        s32[i] = sh.specular(s.d, s.nx, s.ny, dpr);
        m32[i] = sh.mask(s.d, dpr);
      }
    }
    const regionMs = performance.now() - r0;

    // 4. Encode and apply. While moving, the displacement ships at half resolution: it is
    // smooth, feImage scales it, and a quarter of the pixels is a quarter of the work.
    const Dout = draft ? halve(D) : D;
    this.present({ disp: pngUrl(Dout), spec: pngUrl(S), mask: pngUrl(M), w, h, scale, p, Dout, q: Dout.width / w, t0, box });
    this.lastFrame = { ms: performance.now() - t0, regionMs, regions };
  }

  private present(f: FieldFrame) {
    if (f.box) Object.assign(this.el.style, f.box);
    const ls = this.layer.style;
    ls.maskImage = ls.webkitMaskImage = `url(${f.mask})`;
    ls.maskSize = ls.webkitMaskSize = '100% 100%';
    ls.backgroundImage = `url(${f.spec})`;
    if (supportsRefraction) {
      this.filter ??= createFilter(this.id);
      updateFilter(this.filter, f.w, f.h, f.disp, f.scale, f.p);
      ls.backdropFilter = `url(#${this.id})`;
    } else {
      ls.backdropFilter = cssBackdrop(f.p);
      ls.setProperty('-webkit-backdrop-filter', cssBackdrop(f.p));
      this.cpu ??= new CpuRefraction(this.el);
      this.cpu.render(rawOffsets(this.id + f.t0, f.Dout, f.q, f.scale), f.w, f.h, f.p.dispersion, f.mask);
    }
    this.presented++;
  }

  /** Frames actually put on screen, for benchmarks (renders can outpace presentation). */
  presented = 0;

  destroy() {
    cancelAnimationFrame(this.frame);
    clearTimeout(this.settle);
    this.filter?.remove();
    this.cpu?.destroy();
    this.gl?.destroy();
    this.layer.remove();
    this.el.classList.remove('ag-glass', 'ag-field', 'ag-field-gl');
  }
}

interface FieldFrame { disp: string; spec: string; mask: string; w: number; h: number; scale: number; p: GlassParams; Dout: ImageData; q: number; t0: number; box?: { transform: string; width: string; height: string } }

const fieldDpr = (draft: boolean) => (draft ? 1 : Math.min(2, globalThis.devicePixelRatio || 1));

/**
 * Signed distance and normal of a set of boxes merged with a smooth minimum (k = 0: plain).
 * With `bezel`, the normal is skipped where it cannot show: outside the shape, and deep
 * inside past the rim where refraction is zero and the rim light has faded out.
 */
function sampler(shapes: Box[], k: number, bezel = 0) {
  const field = (x: number, y: number) => {
    let d = 1e9;
    for (const s of shapes) d = k > 0 ? smoothMin(d, boxDistance(x, y, s), k) : Math.min(d, boxDistance(x, y, s));
    return d;
  };
  const deep = -2.5 * bezel;
  return (px: number, py: number) => {
    const d = field(px, py);
    if (bezel && (d > 1.5 || d < deep)) return { d, nx: 0, ny: 0 };
    const gx = field(px + 0.5, py) - field(px - 0.5, py), gy = field(px, py + 0.5) - field(px, py - 0.5);
    const gl = Math.hypot(gx, gy) || 1;
    return { d, nx: gx / gl, ny: gy / gl };
  };
}

/** Half-resolution copy, one pixel of each 2 x 2 block. */
function halve(src: ImageData): ImageData {
  const w = Math.ceil(src.width / 2), h = Math.ceil(src.height / 2), out = new ImageData(w, h);
  const s32 = new Uint32Array(src.data.buffer), o32 = new Uint32Array(out.data.buffer);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o32[y * w + x] = s32[Math.min(src.height - 1, y * 2) * src.width + Math.min(src.width - 1, x * 2)];
  return out;
}

/**
 * Copy `src` into `dst` at (x, y), clipped to `dst`.
 * - 'copy': every pixel. 'opaque': only pixels with alpha. 'max': keep the higher alpha.
 */
function stamp(dst: ImageData, src: ImageData, x: number, y: number, mode: 'copy' | 'opaque' | 'max') {
  const d32 = new Uint32Array(dst.data.buffer), s32 = new Uint32Array(src.data.buffer);
  const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(dst.width, x + src.width), y1 = Math.min(dst.height, y + src.height);
  for (let yy = y0; yy < y1; yy++) {
    let di = yy * dst.width + x0, si = (yy - y) * src.width + (x0 - x);
    if (mode === 'copy') { d32.set(s32.subarray(si, si + (x1 - x0)), di); continue; }
    for (let xx = x0; xx < x1; xx++, di++, si++) {
      const sp = s32[si], sa = sp >>> 24;
      if (!sa) continue;
      if (mode === 'opaque' || sa > d32[di] >>> 24) d32[di] = sp;
    }
  }
}

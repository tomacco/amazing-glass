import { resolveParams, type GlassParams, type GlassVariant } from './params';
import { drawMaps } from './maps';
import { bezelWidth, boxDistance, smoothMin, type Box } from './optics';
import { createFilter, cssBackdrop, supportsRefraction, updateFilter } from './filter';
import { CpuRefraction } from './fallback';

export type { Box };

let uid = 0;

/**
 * Several glass shapes that melt into each other when they get close, like SwiftUI's
 * GlassEffectContainer. Shapes are rounded boxes in the element's coordinates; their signed
 * distance fields are blended with a smooth minimum, and refraction, rim light and the
 * outline mask all come from the merged field. Recomputed on the CPU per update, so keep
 * the element small (a few hundred px square).
 *
 *   const field = new GlassField(el, { merge: 40 });
 *   field.setShapes([{ x: 80, y: 60, w: 120, h: 64, r: 32 }, { x: 200, y: 60, w: 64, h: 64, r: 32 }]);
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

  /**
   * Options:
   * - `merge`: distance in px over which shapes melt together.
   * - `fit`: shapes are given in the coordinates of the element's offset parent, and the
   *   element resizes itself to just the shapes. Use it when shapes roam a large area:
   *   the cost is per pixel of the element, so a small box stays fast.
   * - `margin`: extra room around fitted shapes, for the merge bridges and the rim.
   */
  constructor(el: HTMLElement, opts: { variant?: GlassVariant; params?: Partial<GlassParams>; merge?: number; fit?: boolean; margin?: number } = {}) {
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
  }

  setShapes(shapes: Box[]) {
    this.shapes = shapes;
    // Updates arriving faster than every 100 ms mean motion: render a draft now and a
    // full-quality frame once things settle.
    const now = performance.now(), live = now - this.lastSet < 100;
    this.lastSet = now;
    clearTimeout(this.settle);
    if (live) this.settle = window.setTimeout(() => this.render(false), 150);
    if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(live); });
  }

  setParams(params: Partial<GlassParams>) { this.params = { ...this.params, ...params }; this.setShapes(this.shapes); }

  private render(draft = false) {
    if (!this.shapes.length) return;
    let shapes = this.shapes;
    if (this.fit) {
      const m = this.margin;
      const x0 = Math.floor(Math.min(...shapes.map(s => s.x - s.w / 2)) - m), y0 = Math.floor(Math.min(...shapes.map(s => s.y - s.h / 2)) - m);
      const x1 = Math.ceil(Math.max(...shapes.map(s => s.x + s.w / 2)) + m), y1 = Math.ceil(Math.max(...shapes.map(s => s.y + s.h / 2)) + m);
      Object.assign(this.el.style, { transform: `translate(${x0}px, ${y0}px)`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
      shapes = shapes.map(s => ({ ...s, x: s.x - x0, y: s.y - y0 }));
    }
    const w = this.el.offsetWidth, h = this.el.offsetHeight;
    if (!w || !h) return;
    const p = this.params, k = this.merge;
    const minSide = Math.min(...shapes.map(s => Math.min(s.w, s.h)));
    const bezel = bezelWidth(minSide, minSide, p.bezel, p.maxBezel);

    // Distance field on a grid (half resolution while moving); normals from its gradient.
    const g = draft ? 0.5 : 1;
    const gw = Math.max(2, Math.ceil(w * g)), gh = Math.max(2, Math.ceil(h * g));
    const sdf = new Float32Array(gw * gh);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      let d = 1e9;
      for (const s of shapes) d = smoothMin(d, boxDistance((x + 0.5) / g, (y + 0.5) / g, s), k);
      sdf[y * gw + x] = d;
    }
    const at = (x: number, y: number) => sdf[Math.min(gh - 1, Math.max(0, y)) * gw + Math.min(gw - 1, Math.max(0, x))];
    const sample = (px: number, py: number) => {
      const fx = px * g - 0.5, fy = py * g - 0.5, x = Math.floor(fx), y = Math.floor(fy), tx = fx - x, ty = fy - y;
      // Bilinear distance keeps the outline smooth when the grid is coarse.
      const d = (at(x, y) * (1 - tx) + at(x + 1, y) * tx) * (1 - ty) + (at(x, y + 1) * (1 - tx) + at(x + 1, y + 1) * tx) * ty;
      const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1);
      const gl = Math.hypot(gx, gy) || 1;
      return { d, nx: gx / gl, ny: gy / gl };
    };
    const maps = drawMaps(this.id + performance.now(), w, h, sample, { ...p, zoom: 1 }, bezel, { mask: true, draft });
    const mask = `url(${maps.mask})`;
    const ls = this.layer.style;
    ls.maskImage = ls.webkitMaskImage = mask;
    ls.maskSize = ls.webkitMaskSize = '100% 100%';
    ls.backgroundImage = `url(${maps.specular})`;
    if (supportsRefraction) {
      this.filter ??= createFilter(this.id);
      updateFilter(this.filter, w, h, maps.displacement, maps.scale, p);
      ls.backdropFilter = `url(#${this.id})`;
    } else {
      ls.backdropFilter = cssBackdrop(p);
      ls.setProperty('-webkit-backdrop-filter', cssBackdrop(p));
      this.cpu ??= new CpuRefraction(this.el);
      this.cpu.render(maps.raw, w, h, p.dispersion, maps.mask);
    }
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.filter?.remove();
    this.cpu?.destroy();
    this.layer.remove();
    this.el.classList.remove('ag-glass', 'ag-field');
  }
}

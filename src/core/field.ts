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

  constructor(el: HTMLElement, opts: { variant?: GlassVariant; params?: Partial<GlassParams>; merge?: number } = {}) {
    this.el = el;
    this.params = resolveParams(opts.variant ?? 'clear', opts.params);
    this.merge = opts.merge ?? 36;
    el.classList.add('ag-glass', 'ag-field');
    el.dataset.variant = opts.variant ?? 'clear';
    this.layer = document.createElement('span');
    this.layer.className = 'ag-refract';
    this.layer.setAttribute('aria-hidden', 'true');
    el.prepend(this.layer);
  }

  setShapes(shapes: Box[]) {
    this.shapes = shapes;
    if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(); });
  }

  setParams(params: Partial<GlassParams>) { this.params = { ...this.params, ...params }; this.setShapes(this.shapes); }

  private render() {
    const w = this.el.offsetWidth, h = this.el.offsetHeight;
    if (!w || !h || !this.shapes.length) return;
    const p = this.params, k = this.merge;
    const minSide = Math.min(...this.shapes.map(s => Math.min(s.w, s.h)));
    const bezel = bezelWidth(minSide, minSide, p.bezel, p.maxBezel);

    // One distance sample per pixel; normals from the gradient of that grid.
    const sdf = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let d = 1e9;
      for (const s of this.shapes) d = smoothMin(d, boxDistance(x + 0.5, y + 0.5, s), k);
      sdf[y * w + x] = d;
    }
    const at = (x: number, y: number) => sdf[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
    const sample = (px: number, py: number) => {
      const x = Math.floor(px), y = Math.floor(py);
      const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1);
      const gl = Math.hypot(gx, gy) || 1;
      return { d: at(x, y), nx: gx / gl, ny: gy / gl };
    };
    const maps = drawMaps(this.id + performance.now(), w, h, sample, { ...p, zoom: 1 }, bezel, { mask: true });
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

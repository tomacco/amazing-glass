import { resolveParams, type GlassParams, type GlassVariant } from './params';
import { roundedRectMaps, type GlassMaps } from './maps';
import { createFilter, cssBackdrop, supportsRefraction, updateFilter } from './filter';
import { measureTone, onRefresh } from './backdrop';
import { CpuRefraction } from './fallback';

export type GlassTone = 'auto' | 'light' | 'dark';

export interface GlassOptions {
  variant?: GlassVariant;
  /** Override any preset value. */
  params?: Partial<GlassParams>;
  /** Ink colour strategy. `auto` samples what is behind the glass. Default: auto, except lens. */
  tone?: GlassTone;
}

let uid = 0;

/**
 * Turns any element into Liquid Glass. The element keeps its children; the engine adds one
 * layer (`.ag-refract`) as its first child that carries the refraction, frost, tint and rim.
 *
 *   const glass = new Glass(el, { variant: 'clear', params: { blur: 4 } });
 *   glass.setParams({ dispersion: 0.2 });
 *   glass.destroy();
 */
export class Glass {
  readonly el: HTMLElement;
  readonly layer: HTMLSpanElement;
  private variant: GlassVariant;
  private overrides: Partial<GlassParams>;
  private tone: GlassTone;
  private params: GlassParams;
  private filter?: SVGFilterElement;
  private cpu?: CpuRefraction;
  private maps?: GlassMaps;
  private frame = 0;
  private live = false;
  private ro: ResizeObserver;
  private stopRefresh: () => void;
  private readonly id = `ag-${++uid}`;

  constructor(el: HTMLElement, opts: GlassOptions = {}) {
    this.el = el;
    this.variant = opts.variant ?? (el.getAttribute('variant') as GlassVariant) ?? 'regular';
    this.overrides = opts.params ?? {};
    this.tone = opts.tone ?? (this.variant === 'lens' ? 'light' : 'auto');
    this.params = resolveParams(this.variant, this.overrides);
    el.classList.add('ag-glass');
    el.dataset.variant = this.variant;
    if (this.tone !== 'auto') el.dataset.tone = this.tone;
    this.layer = document.createElement('span');
    this.layer.className = 'ag-refract';
    this.layer.setAttribute('aria-hidden', 'true');
    el.prepend(this.layer);
    this.ro = new ResizeObserver(() => this.schedule());
    this.ro.observe(el);
    // Scrolls, resizes and backdrop repaints: re-check tone and the CPU fallback.
    this.stopRefresh = onRefresh(() => this.onRefresh());
    this.schedule();
  }

  get currentParams(): Readonly<GlassParams> { return this.params; }

  setVariant(variant: GlassVariant) {
    this.variant = variant;
    this.el.dataset.variant = variant;
    this.params = resolveParams(variant, this.overrides);
    this.schedule();
  }

  setParams(params: Partial<GlassParams>) {
    this.overrides = { ...this.overrides, ...params };
    this.params = resolveParams(this.variant, this.overrides);
    this.schedule();
  }

  setTone(tone: GlassTone) {
    this.tone = tone;
    if (tone === 'auto') this.onRefresh(); else this.el.dataset.tone = tone;
  }

  /**
   * While an element changes size every frame (a morph, a drag), maps are rebuilt at draft
   * quality each frame. Call with false when the motion ends for a full-quality rebuild.
   */
  morph(on: boolean) {
    this.live = on;
    this.schedule();
  }

  /** Rebuild on the next frame. */
  schedule() {
    if (this.frame || typeof requestAnimationFrame === 'undefined') return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.render(); });
  }

  private radius(w: number, h: number) {
    const cs = getComputedStyle(this.el);
    const raw = cs.borderTopLeftRadius;
    let r = parseFloat(raw) || 0;
    if (raw.includes('%')) r = (Math.min(w, h) * r) / 100;
    return Math.min(r, w / 2, h / 2);
  }

  private render() {
    const w = Math.round(this.el.offsetWidth), h = Math.round(this.el.offsetHeight);
    if (this.live) this.schedule();
    if (!w || !h) return;
    const p = this.params;
    this.maps = roundedRectMaps(w, h, this.radius(w, h), p, this.live);
    this.layer.style.backgroundImage = `url(${this.maps.specular})`;
    if (supportsRefraction) {
      this.filter ??= createFilter(this.id);
      updateFilter(this.filter, w, h, this.maps.displacement, this.maps.scale, p);
      this.layer.style.backdropFilter = `url(#${this.id})`;
    } else {
      this.layer.style.backdropFilter = cssBackdrop(p);
      this.layer.style.setProperty('-webkit-backdrop-filter', cssBackdrop(p));
      this.cpu ??= new CpuRefraction(this.el);
      this.cpu.render(this.maps.raw, w, h, p.dispersion);
    }
    this.onRefresh();
  }

  private onRefresh() {
    if (!this.el.isConnected) return;
    if (this.tone === 'auto') {
      const t = measureTone(this.el);
      if (t && this.el.dataset.tone !== t) this.el.dataset.tone = t;
    }
    if (this.cpu && this.maps) this.cpu.render(this.maps.raw, this.el.offsetWidth, this.el.offsetHeight, this.params.dispersion);
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    this.stopRefresh();
    this.filter?.remove();
    this.cpu?.destroy();
    this.layer.remove();
    this.el.classList.remove('ag-glass');
  }
}

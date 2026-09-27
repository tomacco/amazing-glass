import { Glass } from '../core';
import { Base, clamp, define, fire, onDrag } from './base';
import { icon } from './icons';

/**
 * <ag-slider value="40" min="0" max="100" step="1" min-icon="sunSmall" max-icon="sun"></ag-slider>
 * The thumb swells into a lens while dragged, so the fill stays visible through it.
 * Fires `input` while moving and `change` on release.
 */
export class AgSlider extends Base {
  static observedAttributes = ['value', 'min', 'max', 'step', 'min-icon', 'max-icon', 'disabled'];
  private rail?: HTMLSpanElement;
  private thumb?: HTMLSpanElement;
  private lens?: Glass;

  get min() { return Number(this.getAttribute('min') ?? 0); }
  get max() { return Number(this.getAttribute('max') ?? 100); }
  get step() { return Number(this.getAttribute('step') ?? 0); }
  get value() { return clamp(Number(this.getAttribute('value') ?? (this.min + this.max) / 2), this.min, this.max); }
  set value(v: number) {
    const s = this.step;
    const q = s > 0 ? Math.round((v - this.min) / s) * s + this.min : v;
    this.setAttribute('value', String(+clamp(q, this.min, this.max).toFixed(6)));
  }

  attributeChangedCallback(name: string) {
    if (!this.rail) return;
    if (name === 'min-icon' || name === 'max-icon') return this.renderIcons();
    const f = (this.value - this.min) / (this.max - this.min || 1);
    this.style.setProperty('--ag-fraction', String(f));
    this.setAttribute('aria-valuenow', String(this.value));
    this.setAttribute('aria-valuemin', String(this.min));
    this.setAttribute('aria-valuemax', String(this.max));
  }

  private renderIcons() {
    this.querySelectorAll(':scope > .ag-slider-icon').forEach(n => n.remove());
    const lo = this.getAttribute('min-icon'), hi = this.getAttribute('max-icon');
    if (lo) this.rail!.insertAdjacentHTML('beforebegin', `<span class="ag-slider-icon">${icon(lo, 18)}</span>`);
    if (hi) this.rail!.insertAdjacentHTML('afterend', `<span class="ag-slider-icon">${icon(hi, 22)}</span>`);
  }

  connectedCallback() {
    if (this.rail) return;
    this.setAttribute('role', 'slider');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.rail = document.createElement('span');
    this.rail.className = 'ag-slider-rail';
    this.rail.innerHTML = '<span class="ag-slider-fill"></span><span class="ag-slider-thumb"></span>';
    this.append(this.rail);
    this.thumb = this.rail.querySelector('.ag-slider-thumb')!;
    this.lens = new Glass(this.thumb, { variant: 'lens' });
    this.thumb.dataset.solid = '';
    this.renderIcons();
    this.attributeChangedCallback('value');

    let v0 = 0;
    const fromX = (x: number) => { const r = this.rail!.getBoundingClientRect(); return this.min + clamp((x - r.left) / r.width, 0, 1) * (this.max - this.min); };
    onDrag(this.rail, {
      start: e => {
        if (this.hasAttribute('disabled')) return false;
        this.classList.add('ag-active');
        delete this.thumb!.dataset.solid;
        // Grabbing the thumb keeps its offset; tapping the rail jumps there.
        v0 = this.thumb!.contains(e.target as Node) ? this.value : fromX(e.clientX);
        this.value = v0;
        fire(this, 'input');
      },
      move: dx => {
        const w = this.rail!.getBoundingClientRect().width;
        this.value = v0 + (dx / w) * (this.max - this.min);
        fire(this, 'input');
      },
      end: () => {
        this.classList.remove('ag-active');
        setTimeout(() => { if (this.thumb) this.thumb.dataset.solid = ''; }, 180);
        fire(this, 'change');
      },
    });
    this.addEventListener('keydown', e => {
      const unit = this.step || (this.max - this.min) / 20;
      const d = { ArrowRight: unit, ArrowUp: unit, ArrowLeft: -unit, ArrowDown: -unit }[e.key];
      if (d) { e.preventDefault(); this.value = this.value + d; fire(this, 'input'); fire(this, 'change'); }
    });
  }
}
define('ag-slider', AgSlider);

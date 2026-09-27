import { Glass } from '../core';
import { Base, clamp, define, fire, onDrag, parseList, reducedMotion } from './base';

/**
 * <ag-segmented options="Day,Week,Month" value="Week"></ag-segmented>
 * Tap a segment to jump there with a small liquid stretch, or grab the selection and slide
 * it as a lens. `options` also accepts a JSON array; set the `options` property from JS.
 * Fires `change`; read `.value` or `.selectedIndex`.
 */
export class AgSegmented extends Base {
  static observedAttributes = ['options', 'value'];
  private pill?: HTMLSpanElement;
  private lens?: Glass;
  private items: HTMLButtonElement[] = [];
  private opts: string[] = [];
  private index = 0;
  private dragged = false;

  get options() { return this.opts; }
  set options(v: string[]) { this.opts = v; this.renderItems(); }
  get value() { return this.opts[this.index] ?? ''; }
  set value(v: string) { this.setAttribute('value', v); }
  get selectedIndex() { return this.index; }
  set selectedIndex(i: number) { this.select(i, false); }

  attributeChangedCallback(name: string, _: string | null, next: string | null) {
    if (name === 'options') { this.opts = parseList(next); this.renderItems(); }
    else if (name === 'value') { const i = this.opts.indexOf(next ?? ''); if (i >= 0 && i !== this.index) this.select(i, false); }
  }

  connectedCallback() {
    if (this.pill) return;
    this.setAttribute('role', 'tablist');
    this.pill = document.createElement('span');
    this.pill.className = 'ag-segmented-pill';
    this.prepend(this.pill);
    this.lens = new Glass(this.pill, { variant: 'lens' });
    this.pill.dataset.solid = '';
    if (!this.opts.length) this.opts = parseList(this.getAttribute('options'));
    this.renderItems();
    new ResizeObserver(() => this.place(false)).observe(this);

    let x0: number | null = null;
    onDrag(this, {
      start: e => {
        this.dragged = false;
        const hit = this.items.findIndex(b => b.contains(e.target as Node));
        if (hit !== this.index) { x0 = null; return; }
        x0 = this.pill!.offsetLeft;
        this.classList.add('ag-active');
        delete this.pill!.dataset.solid;
      },
      move: dx => {
        if (x0 == null) return;
        this.dragged = Math.abs(dx) > 3;
        this.pill!.style.transition = 'none';
        this.pill!.style.left = `${clamp(x0 + dx, 2, this.offsetWidth - this.pill!.offsetWidth - 2)}px`;
      },
      end: () => {
        if (x0 == null) return;
        this.pill!.style.transition = '';
        this.classList.remove('ag-active');
        const w = this.items[0]?.offsetWidth || 1;
        this.select(clamp(Math.round((this.pill!.offsetLeft - 2) / w), 0, this.items.length - 1), true);
        setTimeout(() => { if (this.pill) this.pill.dataset.solid = ''; this.dragged = false; }, 180);
        x0 = null;
      },
    });
    this.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); this.select(clamp(this.index + d, 0, this.items.length - 1), true); this.items[this.index]?.focus(); }
    });
  }

  private renderItems() {
    if (!this.pill) return;
    this.items.forEach(b => b.remove());
    const want = this.getAttribute('value');
    this.index = Math.max(0, want ? this.opts.indexOf(want) : this.index);
    this.items = this.opts.map((label, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ag-segmented-item';
      b.setAttribute('role', 'tab');
      b.textContent = label;
      b.addEventListener('click', () => { if (!this.dragged) this.select(i, true); });
      this.append(b);
      return b;
    });
    requestAnimationFrame(() => this.place(false));
  }

  private place(animate = true) {
    const b = this.items[this.index];
    if (!b || !this.pill) return;
    if (!animate) this.pill.style.transition = 'none';
    this.pill.style.left = `${b.offsetLeft}px`;
    this.pill.style.width = `${b.offsetWidth}px`;
    if (!animate) { void this.pill.offsetWidth; this.pill.style.transition = ''; }
    this.items.forEach((x, k) => { x.setAttribute('aria-selected', String(k === this.index)); x.tabIndex = k === this.index ? 0 : -1; });
  }

  private select(i: number, user: boolean) {
    const from = this.index;
    this.index = i;
    if (from !== i && user && !reducedMotion()) {
      this.pill?.animate([{ transform: 'scale(1, 1)' }, { transform: 'scale(1.18, 0.86)', offset: 0.35 }, { transform: 'scale(1, 1)' }], { duration: 420, easing: 'ease-out' });
    }
    this.place();
    if (from !== i && user) fire(this, 'change');
  }
}
define('ag-segmented', AgSegmented);

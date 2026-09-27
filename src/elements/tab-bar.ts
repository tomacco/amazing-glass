import { Glass } from '../core';
import { Base, clamp, define, fire, onDrag, parseJSON } from './base';
import { icon } from './icons';
import { AgButton } from './surface';

export interface TabItem { label: string; icon?: string; value?: string }

/**
 * <ag-tab-bar items='[{"label":"Home","icon":"house"}, …]' value="0" search minimize-on-scroll="#feed"></ag-tab-bar>
 * Floats on regular glass. Dragging across the bar turns the selection into a lens that
 * follows your finger. With `minimize-on-scroll` (a CSS selector for the scroller) it shrinks
 * to the selected tab when content scrolls down and expands on the way back up.
 * Fires `change` (read `.value`) and `search` when the search button is pressed.
 */
export class AgTabBar extends Base {
  static observedAttributes = ['items', 'value', 'search', 'minimize-on-scroll'];
  private bar?: HTMLDivElement;
  private pill?: HTMLSpanElement;
  private glass?: Glass;
  private lens?: Glass;
  private searchBtn?: AgButton;
  private tabs: HTMLButtonElement[] = [];
  private list: TabItem[] = [];
  private index = 0;
  private dragged = false;
  private minimized = false;
  private unbindScroll?: () => void;

  get items() { return this.list; }
  set items(v: TabItem[]) { this.list = v; this.renderTabs(); }
  get value() { const t = this.list[this.index]; return t?.value ?? String(this.index); }
  set value(v: string) { this.setAttribute('value', v); }

  attributeChangedCallback(name: string, _: string | null, next: string | null) {
    if (!this.bar) return;
    if (name === 'items') { this.list = parseJSON<TabItem[]>(next, []); this.renderTabs(); }
    else if (name === 'value') this.selectValue(next);
    else if (name === 'search') this.renderSearch();
    else if (name === 'minimize-on-scroll') this.bindScroll();
  }

  connectedCallback() {
    if (this.bar) return;
    this.bar = document.createElement('div');
    this.bar.className = 'ag-tab-bar-bar';
    this.bar.setAttribute('role', 'tablist');
    this.pill = document.createElement('span');
    this.pill.className = 'ag-tab-pill';
    this.bar.append(this.pill);
    this.append(this.bar);
    this.glass = new Glass(this.bar, { variant: 'regular' });
    this.lens = new Glass(this.pill, { variant: 'lens' });
    this.pill.dataset.solid = '';
    if (!this.list.length) this.list = parseJSON<TabItem[]>(this.getAttribute('items'), []);
    this.renderTabs();
    this.renderSearch();
    this.bindScroll();
    new ResizeObserver(() => this.place(false)).observe(this.bar);

    let x0: number | null = null;
    onDrag(this.bar, {
      start: e => {
        this.dragged = false;
        if (this.minimized) { x0 = null; return; }
        x0 = e.clientX - this.bar!.getBoundingClientRect().left - this.pill!.offsetWidth / 2;
      },
      move: dx => {
        if (x0 == null || Math.abs(dx) < 4) return;
        if (!this.dragged) {
          this.dragged = true;
          this.classList.add('ag-active');
          delete this.pill!.dataset.solid;
          this.pill!.style.transition = 'none';
        }
        this.pill!.style.left = `${clamp(x0 + dx, 4, this.bar!.offsetWidth - this.pill!.offsetWidth - 4)}px`;
        const i = this.nearest();
        this.tabs.forEach((b, k) => b.classList.toggle('ag-under', k === i));
      },
      end: () => {
        this.pill!.style.transition = '';
        if (x0 == null || !this.dragged) return;
        this.classList.remove('ag-active');
        this.tabs.forEach(b => b.classList.remove('ag-under'));
        this.select(this.nearest(), true);
        setTimeout(() => { if (this.pill) this.pill.dataset.solid = ''; this.dragged = false; }, 200);
      },
    });
  }

  disconnectedCallback() { this.unbindScroll?.(); }

  private renderTabs() {
    if (!this.bar) return;
    this.tabs.forEach(b => b.remove());
    this.tabs = this.list.map((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ag-tab';
      b.setAttribute('role', 'tab');
      b.innerHTML = `${icon(t.icon, 24)}<span></span>`;
      b.querySelector('span')!.textContent = t.label;
      b.addEventListener('click', () => { if (!this.dragged) this.select(i, true); });
      this.bar!.append(b);
      return b;
    });
    this.selectValue(this.getAttribute('value'));
    requestAnimationFrame(() => this.place(false));
  }

  private renderSearch() {
    if (!this.bar) return;
    const want = this.hasAttribute('search');
    if (want && !this.searchBtn) {
      this.searchBtn = document.createElement('ag-button') as AgButton;
      this.searchBtn.setAttribute('icon', 'search');
      this.searchBtn.setAttribute('size', 'large');
      this.searchBtn.setAttribute('aria-label', 'Search');
      this.searchBtn.className = 'ag-tab-search';
      this.searchBtn.addEventListener('click', () => fire(this, 'search'));
      this.append(this.searchBtn);
    } else if (!want && this.searchBtn) { this.searchBtn.remove(); this.searchBtn = undefined; }
  }

  private selectValue(v: string | null) {
    if (v == null) return;
    const i = this.list.findIndex((t, k) => (t.value ?? String(k)) === v);
    if (i >= 0 && i !== this.index) { this.index = i; this.place(); }
  }

  private nearest() {
    const c = this.pill!.offsetLeft + this.pill!.offsetWidth / 2;
    let best = 0, bd = Infinity;
    this.tabs.forEach((b, k) => { const d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - c); if (d < bd) { bd = d; best = k; } });
    return best;
  }

  private place(animate = true) {
    const b = this.tabs[this.index];
    if (!b || !this.pill) return;
    if (!animate) this.pill.style.transition = 'none';
    this.pill.style.left = `${b.offsetLeft}px`;
    this.pill.style.width = `${b.offsetWidth}px`;
    if (!animate) { void this.pill.offsetWidth; this.pill.style.transition = ''; }
    this.tabs.forEach((x, k) => x.setAttribute('aria-selected', String(k === this.index)));
  }

  private select(i: number, user: boolean) {
    const changed = i !== this.index;
    this.index = i;
    if (this.minimized) this.minimize(false);
    this.place();
    if (changed && user) fire(this, 'change');
  }

  /** Shrink to the selected tab (true) or expand (false). */
  minimize(on: boolean) {
    if (this.minimized === on || !this.bar) return;
    this.minimized = on;
    this.glass!.morph(true);
    this.classList.toggle('ag-minimized', on);
    this.tabs.forEach((b, k) => { b.hidden = on && k !== this.index; });
    requestAnimationFrame(() => this.place(false));
    setTimeout(() => this.glass!.morph(false), 520);
  }

  private bindScroll() {
    this.unbindScroll?.();
    const sel = this.getAttribute('minimize-on-scroll');
    const scroller = sel ? document.querySelector<HTMLElement>(sel) : null;
    if (!scroller) return;
    let last = scroller.scrollTop;
    const onScroll = () => {
      const y = scroller.scrollTop, dy = y - last;
      if (Math.abs(dy) < 6) return;
      this.minimize(dy > 0 && y > 40);
      last = y;
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    this.unbindScroll = () => scroller.removeEventListener('scroll', onScroll);
  }
}
define('ag-tab-bar', AgTabBar);

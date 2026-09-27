import { Glass } from '../core';
import { Base, define, fire, parseJSON, reducedMotion, SPRING } from './base';
import { icon } from './icons';

export type MenuItem = { label: string; icon?: string; value?: string; destructive?: boolean } | { separator: true };

/**
 * <ag-menu icon="ellipsis" label="More" items='[{"label":"Copy","icon":"copy"},{"separator":true},{"label":"Delete","icon":"trash","destructive":true}]'></ag-menu>
 * The button becomes the menu: one glass surface grows out of the button's corner on a spring
 * and shrinks back into it. Opens toward the left and down by default; add `align="start"` to
 * grow to the right. Fires `select` with the item's value (or label) as `detail`.
 */
export class AgMenu extends Base {
  static observedAttributes = ['items', 'icon', 'label'];
  private surface?: HTMLDivElement;
  private trigger?: HTMLButtonElement;
  private listEl?: HTMLDivElement;
  private glass?: Glass;
  private list: MenuItem[] = [];
  private isOpen = false;

  get items() { return this.list; }
  set items(v: MenuItem[]) { this.list = v; this.renderItems(); }
  get open() { return this.isOpen; }
  set open(v: boolean) { this.toggle(v); }

  attributeChangedCallback(name: string, _: string | null, next: string | null) {
    if (!this.surface) return;
    if (name === 'items') { this.list = parseJSON<MenuItem[]>(next, []); this.renderItems(); }
    else this.renderTrigger();
  }

  connectedCallback() {
    if (this.surface) return;
    this.surface = document.createElement('div');
    this.surface.className = 'ag-menu-surface';
    this.trigger = document.createElement('button');
    this.trigger.type = 'button';
    this.trigger.className = 'ag-menu-trigger';
    this.trigger.setAttribute('aria-haspopup', 'menu');
    this.listEl = document.createElement('div');
    this.listEl.className = 'ag-menu-list';
    this.listEl.setAttribute('role', 'menu');
    this.surface.append(this.trigger, this.listEl);
    this.append(this.surface);
    this.glass = new Glass(this.surface, { variant: 'regular' });
    if (!this.list.length) this.list = parseJSON<MenuItem[]>(this.getAttribute('items'), []);
    this.renderTrigger();
    this.renderItems();
    this.trigger.addEventListener('click', e => { e.stopPropagation(); this.toggle(!this.isOpen); });
    document.addEventListener('pointerdown', e => { if (this.isOpen && !this.contains(e.target as Node)) this.toggle(false); });
    this.addEventListener('keydown', e => { if (e.key === 'Escape') { this.toggle(false); this.trigger?.focus(); } });
  }

  private renderTrigger() {
    this.trigger!.innerHTML = icon(this.getAttribute('icon') || 'ellipsis', 22);
    this.trigger!.setAttribute('aria-label', this.getAttribute('label') || 'More');
    this.trigger!.setAttribute('aria-expanded', String(this.isOpen));
  }

  private renderItems() {
    if (!this.listEl) return;
    this.listEl.replaceChildren(...this.list.map(it => {
      if ('separator' in it) { const hr = document.createElement('hr'); hr.className = 'ag-menu-separator'; return hr; }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ag-menu-item' + (it.destructive ? ' ag-destructive' : '');
      b.setAttribute('role', 'menuitem');
      b.innerHTML = `<span></span>${icon(it.icon, 20)}`;
      b.querySelector('span')!.textContent = it.label;
      b.addEventListener('click', () => { fire(this, 'select', it.value ?? it.label); this.toggle(false); });
      return b;
    }));
  }

  private toggle(on: boolean) {
    if (on === this.isOpen || !this.surface) return;
    this.isOpen = on;
    this.trigger!.setAttribute('aria-expanded', String(on));
    const s = this.surface;
    const from = { w: s.offsetWidth, h: s.offsetHeight };
    this.classList.toggle('ag-open', on);
    // Grow toward whichever side has room, unless align is set explicitly.
    if (on && !this.hasAttribute('align')) {
      this.classList.remove('ag-flip');
      const r = s.getBoundingClientRect();
      if (r.left < 8) this.classList.add('ag-flip');
    }
    const to = { w: s.offsetWidth, h: s.offsetHeight };
    if (on) (this.listEl!.querySelector('button') as HTMLButtonElement | null)?.focus({ preventScroll: true });
    fire(this, on ? 'open' : 'close');
    if (reducedMotion()) return;
    this.glass!.morph(true);
    s.animate([
      { width: `${from.w}px`, height: `${from.h}px`, borderRadius: on ? `${from.h / 2}px` : '28px' },
      { width: `${to.w}px`, height: `${to.h}px`, borderRadius: on ? '28px' : `${to.h / 2}px` },
    ], { duration: on ? 520 : 380, easing: on ? SPRING : 'cubic-bezier(.32,.72,0,1)' }).finished.then(() => this.glass!.morph(false));
    if (on) this.listEl!.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: 90, easing: 'ease-out', fill: 'backwards' });
  }
}
define('ag-menu', AgMenu);

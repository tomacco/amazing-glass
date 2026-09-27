import { Glass } from '../core';
import { applyGlassAttrs, Base, define, GLASS_ATTRS } from './base';
import { icon } from './icons';

/**
 * <ag-glass variant="clear" tint="#34c759" tone="auto" params='{"blur":6}'>…</ag-glass>
 * A plain glass surface. Children are yours; the element only adds its refraction layer.
 */
export class AgGlass extends Base {
  static observedAttributes = GLASS_ATTRS;
  glass?: Glass;
  connectedCallback() {
    this.glass ??= new Glass(this, { variant: (this.getAttribute('variant') as never) ?? 'regular' });
    applyGlassAttrs(this, this.glass);
  }
  attributeChangedCallback() { applyGlassAttrs(this, this.glass); }
  disconnectedCallback() {
    // Frameworks move nodes around; only tear down when the element is really gone.
    queueMicrotask(() => { if (!this.isConnected) { this.glass?.destroy(); this.glass = undefined; } });
  }
}
define('ag-glass', AgGlass);

/**
 * <ag-button variant="glass|prominent|clear|plain" icon="plus" tint="#ff383c" size="small|large">Label</ag-button>
 * `prominent` is stained glass in the accent colour (or `tint`). `plain` has no glass of its own,
 * for use inside a toolbar group.
 */
export class AgButton extends Base {
  static observedAttributes = [...GLASS_ATTRS, 'icon'];
  glass?: Glass;
  private iconEl?: HTMLSpanElement;

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    if (!this.iconEl) {
      this.iconEl = document.createElement('span');
      this.iconEl.className = 'ag-button-icon';
      this.prepend(this.iconEl);
      this.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
      });
    }
    const kind = this.getAttribute('variant') ?? 'glass';
    if (kind !== 'plain') this.glass ??= new Glass(this, { variant: kind === 'clear' ? 'clear' : 'regular' });
    this.sync();
  }

  attributeChangedCallback() { if (this.iconEl) this.sync(); }

  private sync() {
    const kind = this.getAttribute('variant') ?? 'glass';
    this.iconEl!.innerHTML = icon(this.getAttribute('icon'), this.hasAttribute('size') && this.getAttribute('size') === 'large' ? 24 : 20);
    this.iconEl!.hidden = !this.getAttribute('icon');
    const hasLabel = [...this.childNodes].some(n => n !== this.iconEl && !(n as Element).classList?.contains('ag-refract') && n.textContent?.trim());
    this.toggleAttribute('data-icon-only', !hasLabel);
    if (!hasLabel && !this.hasAttribute('aria-label') && this.getAttribute('icon')) this.setAttribute('aria-label', this.getAttribute('icon')!);
    if (!this.glass) return;
    this.glass.setVariant(kind === 'clear' ? 'clear' : 'regular');
    if (kind === 'prominent' || this.hasAttribute('tint')) {
      this.dataset.stained = '';
      const tint = this.getAttribute('tint');
      if (tint) this.style.setProperty('--ag-stain', tint); else this.style.removeProperty('--ag-stain');
    } else delete this.dataset.stained;
    const tone = this.getAttribute('tone');
    if (tone) this.glass.setTone(tone as never);
    const params = this.getAttribute('params');
    if (params) try { this.glass.setParams(JSON.parse(params)); } catch { /* ignore bad JSON */ }
  }

  disconnectedCallback() {
    queueMicrotask(() => { if (!this.isConnected) { this.glass?.destroy(); this.glass = undefined; } });
  }
}
define('ag-button', AgButton);

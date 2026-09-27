import { Glass } from '../core';
import { Base, define } from './base';
import { icon } from './icons';

/**
 * <ag-search placeholder="Search" value=""></ag-search>
 * Capsule on regular glass with a dictation symbol trailing. The inner input's `input` and
 * `change` events bubble; read `.value` from the element.
 */
export class AgSearch extends Base {
  static observedAttributes = ['placeholder', 'value'];
  private input?: HTMLInputElement;
  private glass?: Glass;

  get value() { return this.input?.value ?? this.getAttribute('value') ?? ''; }
  set value(v: string) { if (this.input) this.input.value = v; else this.setAttribute('value', v); }

  attributeChangedCallback(name: string, _: string | null, next: string | null) {
    if (!this.input) return;
    if (name === 'placeholder') { this.input.placeholder = next ?? ''; this.input.setAttribute('aria-label', next || 'Search'); }
    if (name === 'value' && next !== this.input.value) this.input.value = next ?? '';
  }

  connectedCallback() {
    if (this.input) return;
    this.insertAdjacentHTML('beforeend', `<span class="ag-search-icon">${icon('search', 18)}</span><input type="search" enterkeyhint="search"><span class="ag-search-icon">${icon('mic', 18)}</span>`);
    this.input = this.querySelector('input')!;
    const ph = this.getAttribute('placeholder') ?? 'Search';
    this.input.placeholder = ph;
    this.input.setAttribute('aria-label', ph);
    this.input.value = this.getAttribute('value') ?? '';
    if (this.id) this.input.id = `${this.id}-input`;
    this.glass = new Glass(this, { variant: 'regular' });
  }

  focus(options?: FocusOptions) { this.input?.focus(options); }
}
define('ag-search', AgSearch);

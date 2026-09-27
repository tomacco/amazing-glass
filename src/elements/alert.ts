import { Glass } from '../core';
import { Base, define, fire, parseJSON } from './base';
import './surface';

export interface AlertAction { label: string; role?: 'default' | 'cancel' | 'destructive'; value?: string }

/**
 * <ag-alert heading="Delete 3 photos?" message="…" actions='[{"label":"Cancel","role":"cancel"},{"label":"Delete","role":"destructive"}]'></ag-alert>
 * Leading-aligned text and capsule buttons side by side. The default action is stained in the
 * accent colour, a destructive one in red. Fires `action` with the value (or label) as `detail`.
 */
export class AgAlert extends Base {
  static observedAttributes = ['heading', 'message', 'actions'];
  private list: AlertAction[] = [];
  private glass?: Glass;
  private built = false;

  get actions() { return this.list; }
  set actions(v: AlertAction[]) { this.list = v; this.render(); }

  attributeChangedCallback(name: string, _: string | null, next: string | null) {
    if (name === 'actions') this.list = parseJSON<AlertAction[]>(next, []);
    if (this.built) this.render();
  }

  connectedCallback() {
    if (this.built) return;
    this.built = true;
    this.setAttribute('role', 'alertdialog');
    if (!this.list.length) this.list = parseJSON<AlertAction[]>(this.getAttribute('actions'), []);
    this.render();
    this.glass = new Glass(this, { variant: 'regular' });
  }

  private render() {
    const nodes: Node[] = [];
    const title = document.createElement('div');
    title.className = 'ag-alert-heading';
    title.textContent = this.getAttribute('heading') ?? '';
    const msg = document.createElement('div');
    msg.className = 'ag-alert-message';
    msg.textContent = this.getAttribute('message') ?? '';
    const row = document.createElement('div');
    row.className = 'ag-alert-actions';
    for (const a of this.list) {
      const b = document.createElement('ag-button');
      if (a.role === 'destructive') { b.setAttribute('variant', 'prominent'); b.setAttribute('tint', 'var(--ag-red)'); }
      else if (a.role !== 'cancel') b.setAttribute('variant', 'prominent');
      else b.classList.add('ag-alert-cancel');
      b.textContent = a.label;
      b.addEventListener('click', () => fire(this, 'action', a.value ?? a.label));
      row.append(b);
    }
    nodes.push(title, msg, row);
    // Keep the refraction layer (first child) and replace only our own content.
    const layer = this.querySelector(':scope > .ag-refract');
    this.replaceChildren(...(layer ? [layer] : []), ...nodes);
    this.setAttribute('aria-label', title.textContent ?? '');
  }
}
define('ag-alert', AgAlert);

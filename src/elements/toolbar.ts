import { Glass } from '../core';
import { applyGlassAttrs, Base, define, GLASS_ATTRS } from './base';
import './surface';

/**
 * <ag-toolbar>
 *   <ag-toolbar-group><ag-button variant="plain" icon="chevronLeft" aria-label="Back"></ag-button></ag-toolbar-group>
 *   <ag-toolbar-group><ag-button variant="plain" icon="share" aria-label="Share"></ag-button>…</ag-toolbar-group>
 * </ag-toolbar>
 * HIG: actions that affect the same thing share one glass background; groups float apart.
 * Keep icons and text apart within a group, and label every icon.
 */
export class AgToolbar extends Base {
  connectedCallback() { this.setAttribute('role', 'toolbar'); }
}
define('ag-toolbar', AgToolbar);

export class AgToolbarGroup extends Base {
  static observedAttributes = [...GLASS_ATTRS, 'dim'];
  glass?: Glass;
  connectedCallback() {
    this.glass ??= new Glass(this, { variant: (this.getAttribute('variant') as never) ?? 'regular' });
    applyGlassAttrs(this, this.glass);
  }
  attributeChangedCallback() { applyGlassAttrs(this, this.glass); }
}
define('ag-toolbar-group', AgToolbarGroup);

import { Glass } from '../core';
import { Base, define, fire } from './base';

export type Detent = 'closed' | 'medium' | 'large';

/**
 * <ag-sheet detent="medium">…your content…</ag-sheet>
 * A bottom sheet on regular glass, positioned inside its nearest positioned ancestor.
 * Medium floats inset from the edges so content peeks around it; large goes flush and more
 * opaque to hold focus. Drag or tap the grabber to change detent. Fires `detentchange`.
 * Children stay where you put them; the element only adds the grabber.
 */
export class AgSheet extends Base {
  static observedAttributes = ['detent'];
  private grabber?: HTMLButtonElement;
  private glass?: Glass;
  private settle = 0;

  get detent(): Detent { return (this.getAttribute('detent') as Detent) || 'closed'; }
  set detent(d: Detent) { this.setAttribute('detent', d); }

  attributeChangedCallback() {
    if (!this.glass) return;
    this.glass.morph(true);
    clearTimeout(this.settle);
    this.settle = window.setTimeout(() => this.glass?.morph(false), 560);
    this.setAttribute('aria-hidden', String(this.detent === 'closed'));
  }

  connectedCallback() {
    if (this.grabber) return;
    this.setAttribute('role', 'dialog');
    this.grabber = document.createElement('button');
    this.grabber.type = 'button';
    this.grabber.className = 'ag-sheet-grabber';
    this.grabber.setAttribute('aria-label', 'Resize sheet');
    this.prepend(this.grabber);
    this.glass = new Glass(this, { variant: 'regular' });
    this.attributeChangedCallback();

    let h0: number | null = null, y0 = 0, moved = false;
    this.grabber.addEventListener('click', () => { if (!moved) this.change(this.detent === 'large' ? 'medium' : 'large'); });
    this.grabber.addEventListener('pointerdown', e => {
      h0 = this.offsetHeight; y0 = e.clientY; moved = false;
      this.grabber!.setPointerCapture(e.pointerId);
      this.style.transition = 'none';
      this.glass!.morph(true);
    });
    this.grabber.addEventListener('pointermove', e => {
      if (h0 == null) return;
      const dy = e.clientY - y0;
      if (Math.abs(dy) > 4) moved = true;
      this.style.height = `${Math.max(80, h0 - dy)}px`;
    });
    this.grabber.addEventListener('pointerup', () => {
      if (h0 == null) return;
      const h = this.offsetHeight, H = this.offsetParent?.clientHeight || innerHeight;
      h0 = null;
      this.style.transition = '';
      this.style.height = '';
      if (moved) this.change(h > H * 0.72 ? 'large' : h > H * 0.3 ? 'medium' : 'closed');
      else this.glass!.morph(false);
    });
  }

  private change(d: Detent) {
    if (d === this.detent) return;
    this.detent = d;
    fire(this, 'detentchange', d);
  }
}
define('ag-sheet', AgSheet);

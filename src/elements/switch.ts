import { Glass } from '../core';
import { Base, define, fire, onDrag, lensDelay, MORPH_MS, SETTLE_MS, TRAVEL_MS } from './base';

const KNOB = 38, INSET = 2;

/**
 * <ag-switch checked></ag-switch>
 * The knob is solid at rest and lifts off the track as a clear glass lens while touched,
 * the way iOS 26 switches do. Tap to toggle or drag the knob. Fires `change`.
 */
export class AgSwitch extends Base {
  static observedAttributes = ['checked', 'disabled'];
  private knob?: HTMLSpanElement;
  private lens?: Glass;
  private morphT = 0;

  get checked() { return this.hasAttribute('checked'); }
  set checked(v: boolean) { this.toggleAttribute('checked', !!v); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v: boolean) { this.toggleAttribute('disabled', !!v); }

  attributeChangedCallback() {
    this.setAttribute('aria-checked', String(this.checked));
    this.setAttribute('aria-disabled', String(this.disabled));
  }

  connectedCallback() {
    if (this.knob) return;
    this.setAttribute('role', 'switch');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.attributeChangedCallback();
    const track = document.createElement('span');
    track.className = 'ag-switch-track';
    this.knob = document.createElement('span');
    this.knob.className = 'ag-switch-knob';
    track.append(this.knob);
    this.append(track);
    this.lens = new Glass(this.knob, { variant: 'lens' });
    this.knob.dataset.solid = '';

    // Travel uses the resting knob width; the knob grows while touched.
    // As on macOS, a quick click only slides the solid knob and the lens waits for a hold or a
    // drag. As on iOS, a finger gets the lens at once (see lensDelay).
    const travel = () => this.offsetWidth - KNOB - INSET * 2;
    let startOn = false, x = 0, lifted = false, timer = 0;
    const lift = () => {
      if (lifted) return;
      lifted = true;
      this.classList.add('ag-active');
      this.classList.toggle('ag-drag-on', startOn);
      delete this.knob!.dataset.solid;
      this.morphFor(MORPH_MS);
    };
    onDrag(this, {
      start: e => {
        if (this.disabled) return false;
        startOn = this.checked;
        x = startOn ? travel() : 0;
        lifted = false;
        if (lensDelay(e) === 0) lift(); else timer = window.setTimeout(lift, lensDelay(e));
      },
      move: dx => {
        lift();
        x = Math.min(travel() + 6, Math.max(-6, (startOn ? travel() : 0) + dx));
        this.knob!.style.setProperty('--x', `${x}px`);
        this.classList.toggle('ag-drag-on', x > travel() / 2);
      },
      end: (moved, e) => {
        clearTimeout(timer);
        this.knob!.style.removeProperty('--x');
        this.set(moved ? x > travel() / 2 : !startOn);
        if (!lifted) return;
        // iOS keeps the lens while the knob travels after a tap, then lands it.
        const travelMs = !moved && e.pointerType !== 'mouse' ? TRAVEL_MS : 0;
        this.classList.remove('ag-drag-on');
        setTimeout(() => {
          this.classList.remove('ag-active');
          this.morphFor(MORPH_MS);
          setTimeout(() => { if (this.knob && !this.classList.contains('ag-active')) this.knob.dataset.solid = ''; }, SETTLE_MS);
        }, travelMs);
      },
    });
    this.addEventListener('keydown', e => {
      if ((e.key === ' ' || e.key === 'Enter') && !this.disabled) { e.preventDefault(); this.set(!this.checked); }
    });
  }

  /** Draft-quality glass while the knob changes size, then one full rebuild. */
  private morphFor(ms: number) {
    this.lens?.morph(true);
    clearTimeout(this.morphT);
    this.morphT = window.setTimeout(() => this.lens?.morph(false), ms);
  }

  private set(v: boolean) {
    if (v === this.checked) return;
    this.checked = v;
    fire(this, 'input');
    fire(this, 'change');
  }
}
define('ag-switch', AgSwitch);

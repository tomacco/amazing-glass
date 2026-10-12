import { Glass, type GlassParams, type GlassTone, type GlassVariant } from '../core';

export const SPRING = 'linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017 19.4%, 1.061 22.2%, 1.078 25.3%, 1.066 29.2%, 1.018 38.3%, 0.996 45.2%, 0.993 52.3%, 1)';
export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Server-side rendering: custom elements only exist in the browser.
export const Base = (typeof HTMLElement !== 'undefined' ? HTMLElement : class {}) as typeof HTMLElement;

export function define(name: string, ctor: CustomElementConstructor) {
  if (typeof customElements !== 'undefined' && !customElements.get(name)) customElements.define(name, ctor);
}

export function parseJSON<T>(v: string | null, fallback: T): T {
  if (!v) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

/** Parse a list attribute: JSON array or comma-separated text. */
export function parseList(v: string | null): string[] {
  if (!v) return [];
  const t = v.trim();
  return t.startsWith('[') ? parseJSON<string[]>(t, []) : t.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Horizontal drag. Pointer capture starts only after 3 px of movement, so a plain tap
 * stays an ordinary click on whatever was tapped.
 */
/**
 * Press feel, measured against SwiftUI (lab/feel). With a mouse, macOS 27: a 60 ms click never
 * shows a lens, a hold shows one within about 100 ms. With a finger, iOS 27: the lens appears on
 * touch-down, even for a quick tap. Either way the knob is solid again about 150 ms after release.
 */
export const HOLD_MS = 90, MORPH_MS = 220, SETTLE_MS = 140, TRAVEL_MS = 200;
/** How long a press waits before the lens: the platform the pointer belongs to decides. */
export const lensDelay = (e: PointerEvent) => (e.pointerType === 'mouse' ? HOLD_MS : 0);

export function onDrag(el: HTMLElement, h: {
  start?: (e: PointerEvent) => void | false;
  move?: (dx: number, e: PointerEvent) => void;
  end?: (moved: boolean, e: PointerEvent) => void;
}) {
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 || h.start?.(e) === false) return;
    const x0 = e.clientX;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - x0) > 3) { moved = true; el.setPointerCapture(e.pointerId); }
      h.move?.(ev.clientX - x0, ev);
    };
    // Listen on the window: until the pointer has moved 3 px sideways it is not captured, so a
    // press that drifts off the control and is released elsewhere must still end here.
    const mine = (ev: PointerEvent) => ev.pointerId === e.pointerId;
    const onMove = (ev: PointerEvent) => { if (mine(ev)) move(ev); };
    const up = (ev: PointerEvent) => {
      if (!mine(ev)) return;
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      h.end?.(moved, ev);
    };
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  });
}

export const GLASS_ATTRS = ['variant', 'tint', 'tone', 'params'];

/**
 * Applies the shared glass attributes to a Glass instance:
 *   variant="regular|clear|lens"   tint="#0088ff" (stained glass)
 *   tone="auto|light|dark"         params='{"blur":6}' (any GlassParams)
 */
export function applyGlassAttrs(host: HTMLElement, glass: Glass | undefined, target: HTMLElement = host) {
  if (!glass) return;
  const v = host.getAttribute('variant') as GlassVariant | null;
  if (v === 'regular' || v === 'clear' || v === 'lens') glass.setVariant(v);
  const tint = host.getAttribute('tint');
  if (tint) { target.dataset.stained = ''; target.style.setProperty('--ag-stain', tint); }
  else { delete target.dataset.stained; target.style.removeProperty('--ag-stain'); }
  const tone = host.getAttribute('tone') as GlassTone | null;
  if (tone) glass.setTone(tone);
  const params = parseJSON<Partial<GlassParams>>(host.getAttribute('params'), {});
  if (Object.keys(params).length) glass.setParams(params);
}

export const fire = (el: HTMLElement, type: string, detail?: unknown) =>
  el.dispatchEvent(detail === undefined ? new Event(type, { bubbles: true }) : new CustomEvent(type, { bubbles: true, detail }));

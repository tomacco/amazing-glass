// What sits behind the glass. A page cannot read pixels from arbitrary DOM, so the engine
// knows about two sources: canvases you register (exact pixels) and computed background
// colours (a coarse estimate). Adaptive tone and the CPU fallback both use this.

interface Source { canvas: HTMLCanvasElement; version: number; pixels?: ImageData; pixelsVersion?: number }
const sources = new Map<HTMLCanvasElement, Source>();

/** Register a canvas whose pixels glass may read. Call `backdropChanged` after repainting it. */
export function registerBackdrop(canvas: HTMLCanvasElement): () => void {
  if (!sources.has(canvas)) sources.set(canvas, { canvas, version: 0 });
  backdropChanged(canvas);
  return () => { sources.delete(canvas); };
}

/** Tell the engine a registered canvas was repainted. */
export function backdropChanged(canvas?: HTMLCanvasElement) {
  if (canvas) { const s = sources.get(canvas); if (s) s.version++; }
  refresh();
}

function pixelsOf(s: Source): ImageData {
  if (!s.pixels || s.pixelsVersion !== s.version || s.pixels.width !== s.canvas.width || s.pixels.height !== s.canvas.height) {
    const ctx = s.canvas.getContext('2d', { willReadFrequently: true })!;
    s.pixels = ctx.getImageData(0, 0, s.canvas.width, s.canvas.height);
    s.pixelsVersion = s.version;
  }
  return s.pixels;
}

function parseRGB(c: string): number | null {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return a < 0.2 ? null : (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

const isGlass = (e: Element) => !!e.closest('.ag-glass');

/** The registered canvas directly behind a point, if nothing opaque sits in between. */
function canvasAt(x: number, y: number, self: Element): Source | null {
  const stack = document.elementsFromPoint(x, y);
  let blocker: Element | null = null;
  for (const e of stack) {
    if (self.contains(e) || isGlass(e)) continue;
    if (e instanceof HTMLCanvasElement && sources.has(e)) return sources.get(e)!;
    if (parseRGB(getComputedStyle(e).backgroundColor) != null) { blocker = e; break; }
  }
  // A canvas with pointer-events: none never appears in the hit-test stack. Accept it if it
  // covers the point and the first opaque element found is one of its own ancestors.
  for (const s of sources.values()) {
    const r = s.canvas.getBoundingClientRect();
    if (x >= r.left && x < r.right && y >= r.top && y < r.bottom && s.canvas.isConnected &&
        (!blocker || blocker.contains(s.canvas))) return s;
  }
  return null;
}

/** Luminance 0..1 behind a viewport point, or null when unknown. */
export function luminanceAt(x: number, y: number, self: Element): number | null {
  const src = canvasAt(x, y, self);
  if (src) {
    const r = src.canvas.getBoundingClientRect(), px = pixelsOf(src);
    const cx = Math.floor(((x - r.left) / r.width) * px.width), cy = Math.floor(((y - r.top) / r.height) * px.height);
    const i = (Math.min(px.height - 1, Math.max(0, cy)) * px.width + Math.min(px.width - 1, Math.max(0, cx))) * 4;
    return (0.2126 * px.data[i] + 0.7152 * px.data[i + 1] + 0.0722 * px.data[i + 2]) / 255;
  }
  for (const e of document.elementsFromPoint(x, y)) {
    if (self.contains(e) || isGlass(e)) continue;
    const l = parseRGB(getComputedStyle(e).backgroundColor);
    if (l != null) return l;
  }
  return null;
}

/**
 * Light or dark ink for small glass, from the content behind it. Hysteresis keeps it
 * from flickering over mid-grey content.
 */
export function measureTone(el: HTMLElement): 'light' | 'dark' | null {
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  let sum = 0, n = 0;
  for (let i = 0; i < 5; i++) {
    const l = luminanceAt(r.left + (r.width * (i + 0.5)) / 5, r.top + r.height / 2, el);
    if (l != null) { sum += l; n++; }
  }
  if (!n) return null;
  const lum = sum / n, cur = el.dataset.tone || 'light';
  return cur === 'light' ? (lum < 0.47 ? 'dark' : 'light') : (lum > 0.57 ? 'light' : 'dark');
}

/** The source canvas fully behind an element, for the CPU refraction path. */
export function canvasBehind(el: HTMLElement) {
  if (el.parentElement?.closest('.ag-glass')) return null; // glass on glass needs the parent's result
  const r = el.getBoundingClientRect();
  const src = canvasAt(r.left + r.width / 2, r.top + r.height / 2, el);
  if (!src) return null;
  const c = src.canvas.getBoundingClientRect();
  if (r.left < c.left - 1 || r.top < c.top - 1 || r.right > c.right + 1 || r.bottom > c.bottom + 1) return null;
  return { source: src, rect: r, canvasRect: c, pixels: pixelsOf(src) };
}

// One animation frame per burst of scrolls, resizes or repaints.
type Listener = () => void;
const listeners = new Set<Listener>();
let queued = false;
export function onRefresh(fn: Listener) { listeners.add(fn); refresh(); return () => { listeners.delete(fn); }; }
export function refresh() {
  if (queued || typeof requestAnimationFrame === 'undefined') return;
  queued = true;
  requestAnimationFrame(() => { queued = false; listeners.forEach(fn => fn()); });
}
if (typeof window !== 'undefined') {
  addEventListener('scroll', refresh, { passive: true, capture: true });
  addEventListener('resize', refresh);
}

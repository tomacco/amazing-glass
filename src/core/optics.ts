// The physics, kept free of the DOM so it can be tested on its own.

export interface ShapeSample {
  /** Signed distance to the outline: negative inside. */
  d: number;
  /** Outward normal. */
  nx: number;
  ny: number;
}

/**
 * Signed distance and normal for a rounded rectangle centred at the origin.
 * Corners are circular arcs because CSS border-radius clips to circular arcs. The shape the
 * light is computed for must be the shape the browser shows: an earlier superellipse corner
 * bulged past the clip, so the rim highlight survived only at the four edge midpoints.
 */
export function roundedRect(px: number, py: number, hw: number, hh: number, r: number): ShapeSample {
  const ax = Math.abs(px), ay = Math.abs(py);
  const qx = ax - (hw - r), qy = ay - (hh - r);
  let d: number, nx: number, ny: number;
  if (qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy);
    d = len - r;
    nx = qx / len; ny = qy / len;
  } else if (qx > qy) {
    d = qx - r; nx = 1; ny = 0;
  } else {
    d = qy - r; nx = 0; ny = 1;
  }
  return { d, nx: nx * Math.sign(px || 1), ny: ny * Math.sign(py || 1) };
}

/** Rounded box centred at (x, y), for fields of several shapes. */
export interface Box { x: number; y: number; w: number; h: number; r: number }

export function boxDistance(px: number, py: number, s: Box): number {
  const qx = Math.abs(px - s.x) - (s.w / 2 - s.r), qy = Math.abs(py - s.y) - (s.h / 2 - s.r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - s.r;
}

/** Distance to a rounded box and its exact gradient (the outward normal where it exists). */
export function boxDistanceGrad(px: number, py: number, s: Box): { d: number; gx: number; gy: number } {
  const dx = px - s.x, dy = py - s.y, sx = dx < 0 ? -1 : 1, sy = dy < 0 ? -1 : 1;
  const qx = Math.abs(dx) - (s.w / 2 - s.r), qy = Math.abs(dy) - (s.h / 2 - s.r);
  if (qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy);
    return { d: len - s.r, gx: (sx * qx) / len, gy: (sy * qy) / len };
  }
  return qx > qy ? { d: qx - s.r, gx: sx, gy: 0 } : { d: qy - s.r, gx: 0, gy: sy };
}

/**
 * Smooth minimum of several boxes with its exact gradient. For smin(a, b) with
 * h = max(k - |a - b|, 0) / k, the partial derivatives are 1 - h/2 for the smaller input and
 * h/2 for the larger, so the gradient is carried through the fold at no extra evaluations.
 */
export function smoothFieldGrad(px: number, py: number, shapes: Box[], k: number): { d: number; gx: number; gy: number } {
  let d = 1e9, gx = 0, gy = 0;
  for (const s of shapes) {
    const b = boxDistanceGrad(px, py, s);
    const diff = Math.abs(d - b.d);
    if (diff >= k) { if (b.d < d) { d = b.d; gx = b.gx; gy = b.gy; } continue; }
    const h = (k - diff) / k, small = d < b.d;
    const wa = small ? 1 - h / 2 : h / 2, wb = 1 - wa;
    d = Math.min(d, b.d) - h * h * k * 0.25;
    gx = gx * wa + b.gx * wb; gy = gy * wa + b.gy * wb;
  }
  return { d, gx, gy };
}

/** Polynomial smooth minimum: blends two distances so shapes melt together within k px. */
export function smoothMin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/**
 * Height of the glass at depth t into the rim (0 at the edge, 1 where the flat top starts).
 * A squircle profile: vertical at the edge, flattening quickly.
 */
export const rimHeight = (t: number) => Math.pow(1 - Math.pow(1 - t, 4), 0.25);

/**
 * Sideways shift, in px, of a view ray that enters the rim at depth t.
 * The surface slope gives the angle of incidence; Snell's law gives the refracted angle;
 * the ray then crosses the slab, so the shift is thickness × tan(deviation). It peaks at the
 * edge, where the surface is steepest, and falls to zero on the flat top.
 */
export function refractOffset(t: number, bezelPx: number, thickness: number, ior: number): number {
  if (t >= 1) return 0;
  const e = 0.001;
  const t0 = Math.max(t, e), t1 = Math.min(t0 + e, 1);
  const slope = ((rimHeight(t1) - rimHeight(t0)) / e) * thickness / bezelPx;
  const incidence = Math.atan(slope);
  const refracted = Math.asin(Math.sin(incidence) / ior);
  return thickness * Math.tan(incidence - refracted);
}

/** Offsets sampled across the rim, so per-pixel work is a table lookup. */
export function rimProfile(bezelPx: number, thickness: number, ior: number, samples = 64) {
  const table = new Float32Array(samples + 1);
  let max = 0;
  for (let i = 0; i <= samples; i++) {
    table[i] = refractOffset(i / samples, bezelPx, thickness, ior);
    max = Math.max(max, table[i]);
  }
  const at = (depth: number) => {
    if (depth <= 0) return 0;
    const f = Math.min(1, depth / bezelPx) * samples, i = Math.floor(f), fr = f - i;
    return i >= samples ? 0 : table[i] * (1 - fr) + table[i + 1] * fr;
  };
  return { at, max };
}

/** Rim width in px for a shape, from the params. */
export const bezelWidth = (w: number, h: number, bezel: number, maxBezel: number) =>
  Math.max(4, Math.min(maxBezel, Math.min(w, h) * bezel));

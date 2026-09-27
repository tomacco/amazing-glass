export interface ShapeSample {
    /** Signed distance to the outline: negative inside. */
    d: number;
    /** Outward normal. */
    nx: number;
    ny: number;
}
/**
 * Signed distance and normal for a rounded rectangle centred at the origin.
 * Corners use a superellipse (exponent 2.6), which reads like Apple's continuous
 * corners rather than plain circular arcs.
 */
export declare function roundedRect(px: number, py: number, hw: number, hh: number, r: number): ShapeSample;
/** Rounded box centred at (x, y), for fields of several shapes. */
export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
    r: number;
}
export declare function boxDistance(px: number, py: number, s: Box): number;
/** Polynomial smooth minimum: blends two distances so shapes melt together within k px. */
export declare function smoothMin(a: number, b: number, k: number): number;
/**
 * Height of the glass at depth t into the rim (0 at the edge, 1 where the flat top starts).
 * A squircle profile: vertical at the edge, flattening quickly.
 */
export declare const rimHeight: (t: number) => number;
/**
 * Sideways shift, in px, of a view ray that enters the rim at depth t.
 * The surface slope gives the angle of incidence; Snell's law gives the refracted angle;
 * the ray then crosses the slab, so the shift is thickness × tan(deviation). It peaks at the
 * edge, where the surface is steepest, and falls to zero on the flat top.
 */
export declare function refractOffset(t: number, bezelPx: number, thickness: number, ior: number): number;
/** Offsets sampled across the rim, so per-pixel work is a table lookup. */
export declare function rimProfile(bezelPx: number, thickness: number, ior: number, samples?: number): {
    at: (depth: number) => number;
    max: number;
};
/** Rim width in px for a shape, from the params. */
export declare const bezelWidth: (w: number, h: number, bezel: number, maxBezel: number) => number;

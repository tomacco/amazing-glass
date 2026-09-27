import { type GlassParams, type GlassVariant } from './params';
import { type Box } from './optics';
export type { Box };
/**
 * Several glass shapes that melt into each other when they get close, like SwiftUI's
 * GlassEffectContainer. Shapes are rounded boxes; their signed distance fields are blended
 * with a smooth minimum, and refraction, rim light and outline all follow the merged field.
 *
 *   const field = new GlassField(el, { merge: 40 });
 *   field.setShapes([{ x: 80, y: 60, w: 120, h: 64, r: 32 }, { x: 200, y: 60, w: 64, h: 64, r: 32 }]);
 *
 * How a frame is built, cheapest first:
 * 1. Each shape's maps are computed once per size and cached as a sprite.
 * 2. Every frame, sprites are stamped into the frame buffers at the shapes' positions.
 * 3. The smooth minimum only changes the surface where two shapes are within merge distance,
 *    so only a box around each such neck is recomputed from the full distance field.
 * 4. The buffers are encoded as PNG data URLs. (Uncompressed BMP was tried: it moves the
 *    same cost into the browser's decoder and measured no faster. See lab/field-perf.html.)
 */
export declare class GlassField {
    readonly el: HTMLElement;
    readonly layer: HTMLSpanElement;
    private params;
    private merge;
    private shapes;
    private frame;
    private filter?;
    private cpu?;
    private readonly id;
    private fit;
    private margin;
    private lastSet;
    private settle;
    private sprites;
    /** Which renderer is active: 'svg' (stable path) or 'webgl' (experimental, opt-in). */
    readonly renderer: 'svg' | 'webgl';
    private gl?;
    private tint;
    /** Timing of the last frame, for benchmarks: total, and the part spent on neck regions. */
    lastFrame: {
        ms: number;
        regionMs: number;
        regions: number;
    };
    /**
     * Options:
     * - `merge`: distance in px over which shapes melt together.
     * - `fit`: shapes are given in the coordinates of the element's offset parent, and the
     *   element resizes itself to just the shapes, which keeps the per-pixel work small.
     * - `margin`: extra room around fitted shapes, for the merge bridges and the rim.
     * - `renderer: 'webgl'` (experimental) with `backdrop: canvas`: render on the GPU from a
     *   canvas the page draws itself. The element then covers the area the shapes move in, and
     *   shapes are in its coordinates; `fit` is ignored. Falls back to the SVG path when WebGL2
     *   is unavailable. Check `field.renderer` to see which one runs.
     */
    constructor(el: HTMLElement, opts?: {
        variant?: GlassVariant;
        params?: Partial<GlassParams>;
        merge?: number;
        fit?: boolean;
        margin?: number;
        renderer?: 'svg' | 'webgl';
        backdrop?: HTMLCanvasElement;
    });
    /** The tint comes from CSS (--ag-tint), so the GPU path honours the same theming. */
    private readTint;
    setShapes(shapes: Box[]): void;
    setParams(params: Partial<GlassParams>): void;
    /** Cached maps for one shape, drawn with the field's shared rim width and scale. */
    private sprite;
    private render;
    private present;
    /** Frames actually put on screen, for benchmarks (renders can outpace presentation). */
    presented: number;
    destroy(): void;
}

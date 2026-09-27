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
     */
    constructor(el: HTMLElement, opts?: {
        variant?: GlassVariant;
        params?: Partial<GlassParams>;
        merge?: number;
        fit?: boolean;
        margin?: number;
    });
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

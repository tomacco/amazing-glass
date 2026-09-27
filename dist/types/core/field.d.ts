import { type GlassParams, type GlassVariant } from './params';
import { type Box } from './optics';
export type { Box };
/**
 * Several glass shapes that melt into each other when they get close, like SwiftUI's
 * GlassEffectContainer. Shapes are rounded boxes in the element's coordinates; their signed
 * distance fields are blended with a smooth minimum, and refraction, rim light and the
 * outline mask all come from the merged field. Recomputed on the CPU per update, so keep
 * the element small (a few hundred px square).
 *
 *   const field = new GlassField(el, { merge: 40 });
 *   field.setShapes([{ x: 80, y: 60, w: 120, h: 64, r: 32 }, { x: 200, y: 60, w: 64, h: 64, r: 32 }]);
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
    /**
     * Options:
     * - `merge`: distance in px over which shapes melt together.
     * - `fit`: shapes are given in the coordinates of the element's offset parent, and the
     *   element resizes itself to just the shapes. Use it when shapes roam a large area:
     *   the cost is per pixel of the element, so a small box stays fast.
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
    private render;
    destroy(): void;
}

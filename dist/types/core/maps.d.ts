import type { GlassParams } from './params';
import { type ShapeSample } from './optics';
/** Everything the renderer needs for one shape at one size. */
export interface GlassMaps {
    /** Displacement map as a data URL: R = x shift, G = y shift, 128 = none. */
    displacement: string;
    /** Rim highlight as a data URL, painted over the glass. */
    specular: string;
    /** Optional outline mask as a data URL (fields only). */
    mask?: string;
    /** Pixel shift represented by a full channel swing, for feDisplacementMap's `scale`. */
    scale: number;
    /** Raw offsets for the CPU fallback. */
    raw: RawOffsets;
}
export interface RawOffsets {
    id: string;
    width: number;
    height: number;
    /** Map pixels per CSS pixel. */
    q: number;
    dx: Float32Array;
    dy: Float32Array;
}
type Sampler = (px: number, py: number) => ShapeSample;
/**
 * Draws the displacement and specular maps for any shape described by a signed-distance
 * sampler in CSS pixels, with (0, 0) at the top-left of the element.
 */
export declare function drawMaps(id: string, w: number, h: number, sample: Sampler, p: GlassParams, bezelPx: number, opts?: {
    draft?: boolean;
    mask?: boolean;
}): GlassMaps;
/** Maps for a rounded rectangle, cached by size and parameters. */
export declare function roundedRectMaps(w: number, h: number, radius: number, p: GlassParams, draft?: boolean): GlassMaps;
export {};

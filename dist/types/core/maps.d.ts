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
export type Sampler = (px: number, py: number) => ShapeSample;
/** Raw map pixels before encoding. */
export interface MapPixels {
    displacement: ImageData;
    specular: ImageData;
    mask?: ImageData;
    /** Map pixels per CSS pixel for the displacement map, and for specular and mask. */
    q: number;
    dpr: number;
    scale: number;
}
export interface MapOptions {
    draft?: boolean;
    mask?: boolean;
    /** Mark displacement pixels outside the shape as transparent, so the map can be stamped. */
    sprite?: boolean;
    /** Override the displacement scale, so separately computed pieces share one encoding. */
    scale?: number;
    /** Override resolutions: displacement pixels and specular pixels per CSS pixel. */
    q?: number;
    dpr?: number;
}
/** Displacement scale for a rim width and material: the pixel shift of a full channel swing. */
export declare function displacementScale(w: number, h: number, p: GlassParams, bezelPx: number): number;
/**
 * The per-pixel shading of the material, shared by full renders and the partial updates of
 * GlassField. Positions are in CSS pixels; `d` is the signed distance (negative inside).
 */
export declare function shaders(p: GlassParams, bezelPx: number, scale: number, w: number, h: number): {
    /** Displacement as a packed little-endian RGBA word (R = x, G = y, 128 = none). */
    displacement(d: number, nx: number, ny: number, px: number, py: number, sprite?: boolean): number;
    /** Rim light and inner shade as a packed RGBA word, at `dpr` pixels per CSS pixel. */
    specular(d: number, nx: number, ny: number, dpr: number): number;
    /** Outline coverage as a packed RGBA word (alpha only). */
    mask(d: number, dpr: number): number;
};
/**
 * Computes the displacement, specular and (optionally) mask pixels for any shape given as a
 * signed-distance sampler in CSS pixels, with (0, 0) at the top-left of the area.
 */
export declare function computeMaps(w: number, h: number, sample: Sampler, p: GlassParams, bezelPx: number, opts?: MapOptions): MapPixels;
/** Raw offsets for the CPU fallback, decoded from a displacement map. */
export declare function rawOffsets(id: string, img: ImageData, q: number, scale: number): RawOffsets;
/** Encode pixels as a PNG data URL. data: URLs are usable at once; blob: URLs load async. */
export declare function pngUrl(img: ImageData): string;
/**
 * Computes and encodes the maps as data URLs. For shapes that are built once and cached:
 * a data URL never needs releasing.
 */
export declare function drawMaps(id: string, w: number, h: number, sample: Sampler, p: GlassParams, bezelPx: number, opts?: {
    draft?: boolean;
    mask?: boolean;
}): GlassMaps;
/** Maps for a rounded rectangle, cached by size and parameters. */
export declare function roundedRectMaps(w: number, h: number, radius: number, p: GlassParams, draft?: boolean): GlassMaps;

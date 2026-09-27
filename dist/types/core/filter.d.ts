import type { GlassParams } from './params';
/**
 * Only Chromium runs SVG filters inside `backdrop-filter`, which is what real refraction needs.
 * Add `?ag-fallback` to a URL to force the fallback path for testing.
 */
export declare const supportsRefraction: boolean;
/**
 * The filter chain: frost, then displace the backdrop once per colour channel (the three
 * strengths give dispersion), recombine, then saturation and luminosity.
 */
export declare function createFilter(id: string): SVGFilterElement;
export declare function updateFilter(f: SVGFilterElement, w: number, h: number, map: string, scale: number, p: GlassParams): void;
/** The CSS-only approximation for browsers without SVG backdrop filters. */
export declare const cssBackdrop: (p: GlassParams) => string;

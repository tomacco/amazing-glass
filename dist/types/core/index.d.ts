export { Glass, type GlassOptions, type GlassTone } from './glass';
export { GlassField, type Box } from './field';
export { webgl2Available } from './field-gl';
export { FEATURES, LEVELS, featureStatus, type Feature, type SupportLevel } from './support';
export { VARIANTS, resolveParams, type GlassParams, type GlassVariant } from './params';
export { supportsRefraction } from './filter';
export { registerBackdrop, backdropChanged, luminanceAt, refresh } from './backdrop';
export { refractOffset, rimProfile, roundedRect, smoothMin } from './optics';
import { Glass, type GlassOptions } from './glass';
/**
 * Svelte action and plain-JS helper in one: `use:glass={{ variant: 'clear' }}` or
 * `const g = glass(el)`. Returns `{ update, destroy }`.
 */
export declare function glass(node: HTMLElement, options?: GlassOptions): {
    glass: Glass;
    update(next?: GlassOptions): void;
    destroy(): void;
};

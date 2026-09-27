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
export function glass(node: HTMLElement, options: GlassOptions = {}) {
  const g = new Glass(node, options);
  return {
    glass: g,
    update(next: GlassOptions = {}) {
      if (next.variant) g.setVariant(next.variant);
      if (next.params) g.setParams(next.params);
      if (next.tone) g.setTone(next.tone);
    },
    destroy() { g.destroy(); },
  };
}

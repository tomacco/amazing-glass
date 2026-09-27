import { supportsRefraction } from './filter';
import { webgl2Available } from './field-gl';

/**
 * Support levels. Every feature carries one, in the code, the README, the API reference and
 * the guide (all generated from this list).
 *
 * - stable: works in every current browser. Where one lacks a capability, a documented reduced
 *   look takes over. The API will not break without a major version.
 * - limited: stable API, but the full effect only appears in the browsers listed; the others
 *   get the documented fallback.
 * - experimental: works, but the API or the look may change in a minor version. Opt-in only.
 */
export type SupportLevel = 'stable' | 'limited' | 'experimental';

export interface Feature {
  id: string;
  name: string;
  level: SupportLevel;
  /** What each engine gets. */
  chromium: string;
  safari: string;
  firefox: string;
  /** Where this was actually checked, as opposed to expected from the platform. */
  verified: string;
  notes?: string;
  /** Is the full effect available in the running browser? */
  available: () => boolean;
}

export const LEVELS: Record<SupportLevel, string> = {
  stable: 'Works in every current browser, with a documented fallback where a browser lacks something. API stable.',
  limited: 'API stable. The full effect only in the browsers listed; the others get the fallback.',
  experimental: 'Works, but the API or look may change in a minor version. Opt-in.',
};

export const FEATURES: Feature[] = [
  {
    id: 'material', name: 'Glass material: frost, tint, rim light, adaptive ink', level: 'stable',
    chromium: 'Full', safari: 'Full', firefox: 'Full',
    verified: 'Chrome; Safari and Firefox via the same CSS path in forced-fallback mode',
    available: () => true,
  },
  {
    id: 'components', name: 'All ag-* components, React and Vue bindings', level: 'stable',
    chromium: 'Full', safari: 'Full', firefox: 'Full',
    verified: 'Chrome desktop and mobile emulation, React 19, Vue 3.5',
    available: () => true,
  },
  {
    id: 'refraction-dom', name: 'Refraction over page content', level: 'limited',
    chromium: 'Full', safari: 'Fallback: frost, tint, rim', firefox: 'Fallback: frost, tint, rim',
    verified: 'Chrome, and measured against SwiftUI on macOS',
    notes: 'Needs SVG filters inside backdrop-filter, which only Chromium runs.',
    available: () => supportsRefraction,
  },
  {
    id: 'refraction-canvas', name: 'Refraction over canvases passed to registerBackdrop()', level: 'stable',
    chromium: 'Full (SVG filter)', safari: 'Full (CPU)', firefox: 'Full (CPU)',
    verified: 'Chrome; the CPU path by forcing it in Chrome, not yet in Safari or Firefox themselves',
    available: () => true,
  },
  {
    id: 'field', name: 'Liquid merging: GlassField', level: 'limited',
    chromium: 'Full', safari: 'Over registered canvases only (CPU)', firefox: 'Over registered canvases only (CPU)',
    verified: 'Chrome desktop and mobile emulation',
    notes: 'Costs CPU every frame while shapes move (about 8 ms per frame on a desktop for four shapes).',
    available: () => supportsRefraction,
  },
  {
    id: 'field-webgl', name: 'Liquid merging on the GPU: GlassField renderer "webgl"', level: 'experimental',
    chromium: 'Full', safari: 'Expected (WebGL2), untested', firefox: 'Expected (WebGL2), untested',
    verified: 'Chrome desktop and mobile emulation',
    notes: 'Bends only the backdrop canvas you pass, not page elements above it. Falls back to the SVG path without WebGL2.',
    available: () => webgl2Available(),
  },
];

/** Level and availability of one feature in the running browser. */
export function featureStatus(id: string): { level: SupportLevel; available: boolean } | undefined {
  const f = FEATURES.find(x => x.id === id);
  return f && { level: f.level, available: f.available() };
}

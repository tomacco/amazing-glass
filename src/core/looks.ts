import type { GlassParams, GlassVariant } from './params';

/**
 * Looks: a personal layer on top of the fitted material. The fitted presets stay the base;
 * a look nudges the optics per variant, and src/styles/looks.css changes the tokens (tint,
 * accent, radii, motion, type) under the same `data-ag-look` attribute.
 *
 * A look applies to everything inside the element that carries the attribute, so one page
 * can show several side by side.
 */
export type LookName = 'system' | 'light-space' | 'glass-chain' | 'lux-nova' | 'bauhaus';

export interface Look {
  name: string;
  /** One line on where the look comes from. */
  origin: string;
  params: Partial<Record<GlassVariant, Partial<GlassParams>>>;
}

export const LOOKS: Record<LookName, Look> = {
  system: { name: 'System', origin: 'The fitted material, as Apple draws it.', params: {} },
  'light-space': {
    name: 'Light and Space',
    origin: 'Southern California, 1960s. Coated glass, resin discs and rooms made of light.',
    // Thin, clear slabs with a coloured film at the edge, lit from above.
    params: {
      regular: { blur: 4, saturate: 1.6, contrast: 0.95, dispersion: 0.09, rim: 0.5, rimWidth: 0.6, light: -90 },
      clear: { blur: 1.2, saturate: 1.35, dispersion: 0.12, rim: 0.6, rimWidth: 0.6, light: -90 },
      lens: { dispersion: 0.2, rim: 1.4, light: -90 },
    },
  },
  'glass-chain': {
    name: 'Glass Chain',
    origin: 'Berlin, 1919. Bruno Taut and the crystal architecture letters.',
    // Thick, sharp-edged crystal: a narrow rim that bends hard and splits colour.
    params: {
      regular: { blur: 2, bezel: 0.18, depth: 2.2, dispersion: 0.22, rim: 1.1, rimWidth: 0.5, light: -60 },
      clear: { blur: 0, bezel: 0.18, depth: 2.2, dispersion: 0.26, rim: 1.1, rimWidth: 0.5, light: -60 },
      lens: { bezel: 0.2, depth: 1.8, dispersion: 0.3, light: -60 },
    },
  },
  'lux-nova': {
    name: 'Lux Nova',
    origin: 'Saint-Denis, 1140s. Abbot Suger fills the choir with coloured light.',
    // Stained panes: heavy colour in the material, soft frost, little bend.
    params: {
      regular: { blur: 6, saturate: 2.4, lum: 1.05, depth: 0.6, dispersion: 0, rim: 0.3, light: -100 },
      clear: { blur: 3, saturate: 2.2, depth: 0.6, dispersion: 0, rim: 0.3, light: -100 },
      lens: { dispersion: 0.04, light: -100 },
    },
  },
  bauhaus: {
    name: 'Bauhaus',
    origin: 'Dessau, 1920s. Albers and Moholy-Nagy: flat planes that overlap and stay readable.',
    // Flat transparent planes: no rim light, almost no bend.
    params: {
      regular: { blur: 0, saturate: 1, contrast: 1, depth: 0.15, dispersion: 0, rim: 0, shade: 0 },
      clear: { blur: 0, saturate: 1, contrast: 1, depth: 0.15, dispersion: 0, rim: 0, shade: 0 },
      lens: { depth: 0.4, dispersion: 0, rim: 0.4 },
    },
  },
};

/** The look in force for an element: the nearest `data-ag-look` above it, or none. */
export function lookFor(el: Element): Look | undefined {
  const name = el.closest<HTMLElement>('[data-ag-look]')?.dataset.agLook as LookName | undefined;
  return name ? LOOKS[name] : undefined;
}

const listeners = new Set<() => void>();
/** @internal Glass instances subscribe so a look change re-renders them. */
export function onLookChange(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * Apply a look to `root` and everything inside it (default: the whole page).
 *
 *   personalize('light-space');
 *   personalize('bauhaus', document.querySelector('#sidebar'));
 */
export function personalize(look: LookName, root: HTMLElement = document.documentElement) {
  if (look === 'system' && root === document.documentElement) delete root.dataset.agLook;
  else root.dataset.agLook = look;
  listeners.forEach(fn => fn());
}

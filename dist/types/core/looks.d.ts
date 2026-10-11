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
export declare const LOOKS: Record<LookName, Look>;
/** The look in force for an element: the nearest `data-ag-look` above it, or none. */
export declare function lookFor(el: Element): Look | undefined;
/** @internal Glass instances subscribe so a look change re-renders them. */
export declare function onLookChange(fn: () => void): () => void;
/**
 * Apply a look to `root` and everything inside it (default: the whole page).
 *
 *   personalize('light-space');
 *   personalize('bauhaus', document.querySelector('#sidebar'));
 */
export declare function personalize(look: LookName, root?: HTMLElement): void;

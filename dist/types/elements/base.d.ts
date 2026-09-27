import { Glass } from '../core';
export declare const SPRING = "linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017 19.4%, 1.061 22.2%, 1.078 25.3%, 1.066 29.2%, 1.018 38.3%, 0.996 45.2%, 0.993 52.3%, 1)";
export declare const reducedMotion: () => boolean;
export declare const clamp: (v: number, a: number, b: number) => number;
export declare const Base: typeof HTMLElement;
export declare function define(name: string, ctor: CustomElementConstructor): void;
export declare function parseJSON<T>(v: string | null, fallback: T): T;
/** Parse a list attribute: JSON array or comma-separated text. */
export declare function parseList(v: string | null): string[];
/**
 * Horizontal drag. Pointer capture starts only after 3 px of movement, so a plain tap
 * stays an ordinary click on whatever was tapped.
 */
export declare function onDrag(el: HTMLElement, h: {
    start?: (e: PointerEvent) => void | false;
    move?: (dx: number, e: PointerEvent) => void;
    end?: (moved: boolean, e: PointerEvent) => void;
}): void;
export declare const GLASS_ATTRS: string[];
/**
 * Applies the shared glass attributes to a Glass instance:
 *   variant="regular|clear|lens"   tint="#0088ff" (stained glass)
 *   tone="auto|light|dark"         params='{"blur":6}' (any GlassParams)
 */
export declare function applyGlassAttrs(host: HTMLElement, glass: Glass | undefined, target?: HTMLElement): void;
export declare const fire: (el: HTMLElement, type: string, detail?: unknown) => boolean;

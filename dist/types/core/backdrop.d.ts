interface Source {
    canvas: HTMLCanvasElement;
    version: number;
    pixels?: ImageData;
    pixelsVersion?: number;
}
/** Register a canvas whose pixels glass may read. Call `backdropChanged` after repainting it. */
export declare function registerBackdrop(canvas: HTMLCanvasElement): () => void;
/** Tell the engine a registered canvas was repainted. */
export declare function backdropChanged(canvas?: HTMLCanvasElement): void;
/** Luminance 0..1 behind a viewport point, or null when unknown. */
export declare function luminanceAt(x: number, y: number, self: Element): number | null;
/**
 * Light or dark ink for small glass, from the content behind it. Hysteresis keeps it
 * from flickering over mid-grey content.
 */
export declare function measureTone(el: HTMLElement): 'light' | 'dark' | null;
/** The source canvas fully behind an element, for the CPU refraction path. */
export declare function canvasBehind(el: HTMLElement): {
    source: Source;
    rect: DOMRect;
    canvasRect: DOMRect;
    pixels: ImageData;
} | null;
type Listener = () => void;
export declare function onRefresh(fn: Listener): () => void;
export declare function refresh(): void;
export {};

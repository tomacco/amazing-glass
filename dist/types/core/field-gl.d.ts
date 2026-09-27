import type { GlassParams } from './params';
import { type Box } from './optics';
export declare function webgl2Available(): boolean;
export declare class FieldGL {
    private host;
    private backdrop;
    readonly canvas: HTMLCanvasElement;
    private gl;
    private tex;
    private u;
    private lost;
    constructor(host: HTMLElement, backdrop: HTMLCanvasElement);
    /** Draw shapes given in the host's CSS pixel coordinates. */
    draw(shapes: Box[], p: GlassParams, merge: number, tint: [number, number, number, number]): void;
    destroy(): void;
}

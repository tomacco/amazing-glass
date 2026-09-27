import { type GlassParams, type GlassVariant } from './params';
export type GlassTone = 'auto' | 'light' | 'dark';
export interface GlassOptions {
    variant?: GlassVariant;
    /** Override any preset value. */
    params?: Partial<GlassParams>;
    /** Ink colour strategy. `auto` samples what is behind the glass. Default: auto, except lens. */
    tone?: GlassTone;
}
/**
 * Turns any element into Liquid Glass. The element keeps its children; the engine adds one
 * layer (`.ag-refract`) as its first child that carries the refraction, frost, tint and rim.
 *
 *   const glass = new Glass(el, { variant: 'clear', params: { blur: 4 } });
 *   glass.setParams({ dispersion: 0.2 });
 *   glass.destroy();
 */
export declare class Glass {
    readonly el: HTMLElement;
    readonly layer: HTMLSpanElement;
    private variant;
    private overrides;
    private tone;
    private params;
    private filter?;
    private cpu?;
    private maps?;
    private frame;
    private live;
    private ro;
    private stopRefresh;
    private readonly id;
    constructor(el: HTMLElement, opts?: GlassOptions);
    get currentParams(): Readonly<GlassParams>;
    setVariant(variant: GlassVariant): void;
    setParams(params: Partial<GlassParams>): void;
    setTone(tone: GlassTone): void;
    /**
     * While an element changes size every frame (a morph, a drag), maps are rebuilt at draft
     * quality each frame. Call with false when the motion ends for a full-quality rebuild.
     */
    morph(on: boolean): void;
    /** Rebuild on the next frame. */
    schedule(): void;
    private radius;
    private render;
    private onRefresh;
    destroy(): void;
}

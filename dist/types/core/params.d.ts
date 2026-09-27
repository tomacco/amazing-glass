/** Every knob the material has. All lengths are CSS pixels. */
export interface GlassParams {
    /** Frost radius of the backdrop blur. */
    blur: number;
    /** Colour saturation applied to the backdrop (1 = unchanged). */
    saturate: number;
    /** Brightness multiplier applied before contrast (1 = unchanged). */
    lum: number;
    /** Contrast around mid grey (1 = unchanged, lower flattens). */
    contrast: number;
    /** Width of the curved rim as a fraction of the shape's short side. */
    bezel: number;
    /** Upper limit for the rim width. */
    maxBezel: number;
    /** Glass thickness relative to the rim width. Thicker glass bends more. */
    depth: number;
    /** Index of refraction. 1.5 is window glass. */
    ior: number;
    /** Extra bend for red and less for blue, as a fraction. Makes the rainbow edge. */
    dispersion: number;
    /** Magnification of the flat middle (1 = none). Used by lens knobs. */
    zoom: number;
    /** Strength of the specular highlight on the rim. */
    rim: number;
    /** Width of the bright rim line. */
    rimWidth: number;
    /** Opacity of the thin dark line inside the rim. */
    shade: number;
    /** Direction the light comes from, in degrees. -135 is the top left. */
    light: number;
}
export type GlassVariant = 'regular' | 'clear' | 'lens';
/**
 * Presets. `regular` and `clear` were fitted pixel by pixel against SwiftUI's
 * `.glassEffect(.regular)` and `.glassEffect(.clear)` on macOS 27 (see lab/).
 * `lens` is hand-tuned for the transient glass knobs of switches and sliders.
 */
export declare const VARIANTS: Record<GlassVariant, GlassParams>;
export declare function resolveParams(variant: GlassVariant, overrides?: Partial<GlassParams>): GlassParams;

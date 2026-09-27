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
export const VARIANTS: Record<GlassVariant, GlassParams> = {
  regular: { blur: 10.351, saturate: 2.252, lum: 0.991, contrast: 0.813, bezel: 0.421, maxBezel: 30.629, depth: 1.188, ior: 1.5, dispersion: 0, zoom: 1, rim: 0.102, rimWidth: 0.3, shade: 0.03, light: -135 },
  clear: { blur: 16.018, saturate: 1.309, lum: 1, contrast: 0.901, bezel: 0.493, maxBezel: 34.835, depth: 1.196, ior: 1.5, dispersion: 0.017, zoom: 1, rim: 0.104, rimWidth: 0.3, shade: 0, light: -135 },
  lens: { blur: 0, saturate: 1.2, lum: 1, contrast: 1, bezel: 0.42, maxBezel: 34, depth: 1, ior: 1.5, dispersion: 0.14, zoom: 1.08, rim: 1.7, rimWidth: 1.25, shade: 0.16, light: -135 },
};

export function resolveParams(variant: GlassVariant, overrides?: Partial<GlassParams>): GlassParams {
  return { ...VARIANTS[variant], ...overrides };
}

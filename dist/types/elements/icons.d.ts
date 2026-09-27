/** SVG markup for a registered icon. */
export declare function icon(name: string | null | undefined, size?: number): string;
/** Add or replace an icon. `svgInner` is the markup inside a 24 x 24 viewBox, filled with currentColor. */
export declare function registerIcon(name: string, svgInner: string): void;
export declare const iconNames: () => string[];

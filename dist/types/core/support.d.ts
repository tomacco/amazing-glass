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
export declare const LEVELS: Record<SupportLevel, string>;
export declare const FEATURES: Feature[];
/** Level and availability of one feature in the running browser. */
export declare function featureStatus(id: string): {
    level: SupportLevel;
    available: boolean;
} | undefined;

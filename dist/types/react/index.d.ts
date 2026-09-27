import { type CSSProperties, type ReactNode, type RefObject } from 'react';
import '../elements';
import { Glass as GlassEngine, type GlassOptions, type GlassParams, type GlassTone, type GlassVariant } from '../core';
import type { AlertAction, Detent, MenuItem, TabItem } from '../elements';
interface Common {
    className?: string;
    style?: CSSProperties;
    id?: string;
    children?: ReactNode;
    'aria-label'?: string;
}
interface GlassLook {
    /** Material preset. */
    variant?: GlassVariant;
    /** Stained-glass colour, any CSS colour. */
    tint?: string;
    /** Ink strategy: sample the backdrop (auto) or force light or dark. */
    tone?: GlassTone;
    /** Fine-tune the material: blur, bezel, depth, dispersion, and the rest. */
    params?: Partial<GlassParams>;
}
export interface GlassProps extends GlassLook {
    dim?: boolean;
}
/** A glass surface for your own content. */
export declare const Glass: import("react").ForwardRefExoticComponent<GlassProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface ButtonProps extends Omit<GlassLook, 'variant'> {
    variant?: 'glass' | 'prominent' | 'clear' | 'plain';
    icon?: string;
    size?: 'small' | 'regular' | 'large';
    onClick?: (e: React.MouseEvent) => void;
}
export declare const Button: import("react").ForwardRefExoticComponent<ButtonProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface SwitchProps {
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean, e: Event) => void;
}
export declare const Switch: import("react").ForwardRefExoticComponent<SwitchProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface SliderProps {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    minIcon?: string;
    maxIcon?: string;
    onInput?: (value: number, e: Event) => void;
    onChange?: (value: number, e: Event) => void;
}
export declare const Slider: import("react").ForwardRefExoticComponent<SliderProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface SegmentedProps {
    options: string[];
    value?: string;
    onChange?: (value: string, e: Event) => void;
}
export declare const Segmented: import("react").ForwardRefExoticComponent<SegmentedProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface TabBarProps {
    items: TabItem[];
    value?: string;
    search?: boolean;
    /** CSS selector of the scroll container that minimizes the bar. */
    minimizeOnScroll?: string;
    onChange?: (value: string, e: Event) => void;
    onSearch?: (value: undefined, e: Event) => void;
}
export declare const TabBar: import("react").ForwardRefExoticComponent<TabBarProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface MenuProps {
    items: MenuItem[];
    icon?: string;
    label?: string;
    align?: 'start' | 'end';
    onSelect?: (value: string, e: Event) => void;
}
export declare const Menu: import("react").ForwardRefExoticComponent<MenuProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface SheetProps {
    detent?: Detent;
    onDetentChange?: (detent: Detent, e: Event) => void;
}
export declare const Sheet: import("react").ForwardRefExoticComponent<SheetProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface AlertProps {
    heading: string;
    message?: string;
    actions: AlertAction[];
    onAction?: (value: string, e: Event) => void;
}
export declare const Alert: import("react").ForwardRefExoticComponent<AlertProps & Common & import("react").RefAttributes<HTMLElement>>;
export interface SearchProps {
    placeholder?: string;
    value?: string;
    onInput?: (value: string, e: Event) => void;
    onChange?: (value: string, e: Event) => void;
}
export declare const Search: import("react").ForwardRefExoticComponent<SearchProps & Common & import("react").RefAttributes<HTMLElement>>;
export declare const Toolbar: import("react").ForwardRefExoticComponent<{
    spread?: boolean;
} & Common & import("react").RefAttributes<HTMLElement>>;
export declare const ToolbarGroup: import("react").ForwardRefExoticComponent<GlassLook & {
    dim?: boolean;
} & Common & import("react").RefAttributes<HTMLElement>>;
/**
 * Glass on any element you render yourself.
 *   const ref = useRef(null); useGlass(ref, { variant: 'clear' }); return <div ref={ref} />;
 */
export declare function useGlass(ref: RefObject<HTMLElement | null>, options?: GlassOptions): RefObject<GlassEngine | null>;
export type { AlertAction, Detent, MenuItem, TabItem, GlassParams, GlassVariant, GlassTone };

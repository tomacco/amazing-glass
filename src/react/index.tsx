'use client';
// React bindings. Each component renders the matching custom element and keeps its
// properties and events in sync, so the element does the work and React stays in charge
// of your tree. Handlers receive the new value first and the DOM event second.
import {
  createElement, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef,
  type CSSProperties, type ReactNode, type RefObject,
} from 'react';
import '../elements';
import {
  Glass as GlassEngine, type GlassOptions, type GlassParams, type GlassTone, type GlassVariant,
} from '../core';
import type { AlertAction, Detent, MenuItem, TabItem } from '../elements';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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

type Spec = {
  /** React prop -> attribute name, for strings, numbers and booleans. */
  attrs?: Record<string, string>;
  /** React props set as element properties (arrays, objects, controlled values). */
  props?: string[];
  /** React prop -> [DOM event, how to read the value]. */
  events?: Record<string, [string, (el: any, e: Event) => unknown]>;
};

const GLASS_ATTRS = { variant: 'variant', tint: 'tint', tone: 'tone' };

function wrap<P extends object, E extends HTMLElement = HTMLElement>(tag: string, name: string, spec: Spec) {
  const C = forwardRef<E, P & Common>((all, ref) => {
    const el = useRef<E>(null);
    useImperativeHandle(ref, () => el.current as E);
    const input = all as Record<string, unknown>;
    const attrs: Record<string, unknown> = { ref: el };
    for (const [k, v] of Object.entries(input)) {
      if (spec.props?.includes(k) || spec.events?.[k] || k === 'params') continue;
      const attr = spec.attrs?.[k];
      if (attr) { if (v === true) attrs[attr] = ''; else if (v !== false && v != null) attrs[attr] = String(v); }
      else if (k === 'className') attrs.class = v;
      else attrs[k] = v;
    }
    if (input.params) attrs.params = JSON.stringify(input.params);

    // Properties: set after render so the element is upgraded.
    useIsoLayoutEffect(() => {
      const node = el.current as unknown as Record<string, unknown> | null;
      if (!node) return;
      for (const p of spec.props ?? []) if (input[p] !== undefined && node[p] !== input[p]) node[p] = input[p];
    });
    // Events: the latest handler wins without re-subscribing on every render.
    const handlers = useRef(input);
    handlers.current = input;
    useEffect(() => {
      const node = el.current;
      if (!node) return;
      const offs = Object.entries(spec.events ?? {}).map(([prop, [type, read]]) => {
        const fn = (e: Event) => (handlers.current[prop] as ((v: unknown, e: Event) => void) | undefined)?.(read(node, e), e);
        node.addEventListener(type, fn);
        return () => node.removeEventListener(type, fn);
      });
      return () => offs.forEach(off => off());
    }, []);
    return createElement(tag, attrs, input.children as ReactNode);
  });
  C.displayName = name;
  return C;
}

const detail = (_: unknown, e: Event) => (e as CustomEvent).detail;

export interface GlassProps extends GlassLook { /** Dim clear glass for bright media (HIG: 35%). */ dim?: boolean }
/** A glass surface for your own content. */
export const Glass = wrap<GlassProps>('ag-glass', 'Glass', { attrs: { ...GLASS_ATTRS, dim: 'dim' } });

export interface ButtonProps extends Omit<GlassLook, 'variant'> {
  variant?: 'glass' | 'prominent' | 'clear' | 'plain';
  icon?: string;
  size?: 'small' | 'regular' | 'large';
  onClick?: (e: React.MouseEvent) => void;
}
export const Button = wrap<ButtonProps>('ag-button', 'Button', { attrs: { ...GLASS_ATTRS, icon: 'icon', size: 'size' } });

export interface SwitchProps { checked?: boolean; disabled?: boolean; onChange?: (checked: boolean, e: Event) => void }
export const Switch = wrap<SwitchProps>('ag-switch', 'Switch', {
  props: ['checked', 'disabled'],
  events: { onChange: ['change', el => el.checked] },
});

export interface SliderProps {
  value?: number; min?: number; max?: number; step?: number; disabled?: boolean;
  minIcon?: string; maxIcon?: string;
  onInput?: (value: number, e: Event) => void;
  onChange?: (value: number, e: Event) => void;
}
export const Slider = wrap<SliderProps>('ag-slider', 'Slider', {
  attrs: { min: 'min', max: 'max', step: 'step', minIcon: 'min-icon', maxIcon: 'max-icon', disabled: 'disabled' },
  props: ['value'],
  events: { onInput: ['input', el => el.value], onChange: ['change', el => el.value] },
});

export interface SegmentedProps { options: string[]; value?: string; onChange?: (value: string, e: Event) => void }
export const Segmented = wrap<SegmentedProps>('ag-segmented', 'Segmented', {
  props: ['options', 'value'],
  events: { onChange: ['change', el => el.value] },
});

export interface TabBarProps {
  items: TabItem[]; value?: string; search?: boolean;
  /** CSS selector of the scroll container that minimizes the bar. */
  minimizeOnScroll?: string;
  onChange?: (value: string, e: Event) => void;
  onSearch?: (value: undefined, e: Event) => void;
}
export const TabBar = wrap<TabBarProps>('ag-tab-bar', 'TabBar', {
  attrs: { search: 'search', minimizeOnScroll: 'minimize-on-scroll' },
  props: ['items', 'value'],
  events: { onChange: ['change', el => el.value], onSearch: ['search', () => undefined] },
});

export interface MenuProps { items: MenuItem[]; icon?: string; label?: string; align?: 'start' | 'end'; onSelect?: (value: string, e: Event) => void }
export const Menu = wrap<MenuProps>('ag-menu', 'Menu', {
  attrs: { icon: 'icon', label: 'label', align: 'align' },
  props: ['items'],
  events: { onSelect: ['select', detail] },
});

export interface SheetProps { detent?: Detent; onDetentChange?: (detent: Detent, e: Event) => void }
export const Sheet = wrap<SheetProps>('ag-sheet', 'Sheet', {
  attrs: { detent: 'detent' },
  events: { onDetentChange: ['detentchange', detail] },
});

export interface AlertProps { heading: string; message?: string; actions: AlertAction[]; onAction?: (value: string, e: Event) => void }
export const Alert = wrap<AlertProps>('ag-alert', 'Alert', {
  attrs: { heading: 'heading', message: 'message' },
  props: ['actions'],
  events: { onAction: ['action', detail] },
});

export interface SearchProps { placeholder?: string; value?: string; onInput?: (value: string, e: Event) => void; onChange?: (value: string, e: Event) => void }
export const Search = wrap<SearchProps>('ag-search', 'Search', {
  attrs: { placeholder: 'placeholder' },
  props: ['value'],
  events: { onInput: ['input', el => el.value], onChange: ['change', el => el.value] },
});

export const Toolbar = wrap<{ spread?: boolean }>('ag-toolbar', 'Toolbar', { attrs: { spread: 'spread' } });
export const ToolbarGroup = wrap<GlassLook & { dim?: boolean }>('ag-toolbar-group', 'ToolbarGroup', { attrs: { ...GLASS_ATTRS, dim: 'dim' } });

/**
 * Glass on any element you render yourself.
 *   const ref = useRef(null); useGlass(ref, { variant: 'clear' }); return <div ref={ref} />;
 */
export function useGlass(ref: RefObject<HTMLElement | null>, options: GlassOptions = {}) {
  const g = useRef<GlassEngine | null>(null);
  useIsoLayoutEffect(() => {
    if (!ref.current) return;
    g.current = new GlassEngine(ref.current, options);
    return () => { g.current?.destroy(); g.current = null; };
  }, [ref]);
  useEffect(() => {
    if (!g.current) return;
    if (options.variant) g.current.setVariant(options.variant);
    if (options.params) g.current.setParams(options.params);
    if (options.tone) g.current.setTone(options.tone);
  }, [options.variant, options.tone, JSON.stringify(options.params ?? {})]);
  return g;
}

export type { AlertAction, Detent, MenuItem, TabItem, GlassParams, GlassVariant, GlassTone };

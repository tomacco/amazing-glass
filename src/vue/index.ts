// Vue 3 bindings. Components render the matching custom element and support v-model where
// there is a value. The `vGlass` directive puts glass on any element you render.
import { defineComponent, h, onMounted, ref, watch, type Directive, type PropType } from 'vue';
import '../elements';
import { Glass as GlassEngine, type GlassOptions, type GlassParams, type GlassTone, type GlassVariant } from '../core';
import type { AlertAction, Detent, MenuItem, TabItem } from '../elements';

type Spec = {
  props: Record<string, unknown>;
  /** Prop -> attribute. */
  attrs?: Record<string, string>;
  /** Props written as element properties. */
  domProps?: string[];
  /** DOM event -> [emitted name, read value]. The model prop is updated through update:modelValue. */
  events?: Record<string, [string, (el: any, e: Event) => unknown]>;
  model?: { domProp: string; event: string };
};

function wrap(tag: string, name: string, spec: Spec) {
  const emits = [...new Set([...Object.values(spec.events ?? {}).map(([n]) => n), ...(spec.model ? ['update:modelValue'] : [])])];
  return defineComponent({
    name,
    props: { ...spec.props, ...(spec.model ? { modelValue: null } : {}) } as Record<string, any>,
    emits,
    setup(props: Record<string, any>, { emit, slots }) {
      const el = ref<HTMLElement & Record<string, any>>();
      const sync = () => {
        const node = el.value;
        if (!node) return;
        for (const p of spec.domProps ?? []) if (props[p] !== undefined && node[p] !== props[p]) node[p] = props[p];
        if (spec.model && props.modelValue !== undefined && node[spec.model.domProp] !== props.modelValue) node[spec.model.domProp] = props.modelValue;
      };
      onMounted(() => {
        sync();
        for (const [type, [out, read]] of Object.entries(spec.events ?? {})) {
          el.value!.addEventListener(type, e => {
            const v = read(el.value, e);
            emit(out, v, e);
            if (spec.model && type === spec.model.event) emit('update:modelValue', v);
          });
        }
      });
      watch(() => ({ ...props }), sync, { deep: true, flush: 'post' });
      return () => {
        const attrs: Record<string, unknown> = { ref: el };
        for (const [p, a] of Object.entries(spec.attrs ?? {})) {
          const v = props[p];
          if (v === true) attrs[a] = ''; else if (v !== false && v != null) attrs[a] = String(v);
        }
        if (props.params) attrs.params = JSON.stringify(props.params);
        return h(tag, attrs, slots.default?.());
      };
    },
  });
}

const look = {
  variant: String as PropType<GlassVariant>,
  tint: String,
  tone: String as PropType<GlassTone>,
  params: Object as PropType<Partial<GlassParams>>,
};
const lookAttrs = { variant: 'variant', tint: 'tint', tone: 'tone' };
const detail = (_: unknown, e: Event) => (e as CustomEvent).detail;

export const Glass = wrap('ag-glass', 'AgGlass', { props: { ...look, dim: Boolean }, attrs: { ...lookAttrs, dim: 'dim' } });

export const Button = wrap('ag-button', 'AgButton', {
  props: { ...look, variant: String as PropType<'glass' | 'prominent' | 'clear' | 'plain'>, icon: String, size: String },
  attrs: { ...lookAttrs, icon: 'icon', size: 'size' },
});

export const Switch = wrap('ag-switch', 'AgSwitch', {
  props: { disabled: Boolean },
  attrs: { disabled: 'disabled' },
  model: { domProp: 'checked', event: 'change' },
  events: { change: ['change', el => el.checked] },
});

export const Slider = wrap('ag-slider', 'AgSlider', {
  props: { min: Number, max: Number, step: Number, minIcon: String, maxIcon: String, disabled: Boolean },
  attrs: { min: 'min', max: 'max', step: 'step', minIcon: 'min-icon', maxIcon: 'max-icon', disabled: 'disabled' },
  model: { domProp: 'value', event: 'input' },
  events: { input: ['input', el => el.value], change: ['change', el => el.value] },
});

export const Segmented = wrap('ag-segmented', 'AgSegmented', {
  props: { options: { type: Array as PropType<string[]>, required: true } },
  domProps: ['options'],
  model: { domProp: 'value', event: 'change' },
  events: { change: ['change', el => el.value] },
});

export const TabBar = wrap('ag-tab-bar', 'AgTabBar', {
  props: { items: { type: Array as PropType<TabItem[]>, required: true }, search: Boolean, minimizeOnScroll: String },
  attrs: { search: 'search', minimizeOnScroll: 'minimize-on-scroll' },
  domProps: ['items'],
  model: { domProp: 'value', event: 'change' },
  events: { change: ['change', el => el.value], search: ['search', () => undefined] },
});

export const Menu = wrap('ag-menu', 'AgMenu', {
  props: { items: { type: Array as PropType<MenuItem[]>, required: true }, icon: String, label: String, align: String },
  attrs: { icon: 'icon', label: 'label', align: 'align' },
  domProps: ['items'],
  events: { select: ['select', detail] },
});

export const Sheet = wrap('ag-sheet', 'AgSheet', {
  props: {},
  model: { domProp: 'detent', event: 'detentchange' },
  events: { detentchange: ['detentchange', detail] },
});

export const Alert = wrap('ag-alert', 'AgAlert', {
  props: { heading: String, message: String, actions: { type: Array as PropType<AlertAction[]>, required: true } },
  attrs: { heading: 'heading', message: 'message' },
  domProps: ['actions'],
  events: { action: ['action', detail] },
});

export const Search = wrap('ag-search', 'AgSearch', {
  props: { placeholder: String },
  attrs: { placeholder: 'placeholder' },
  model: { domProp: 'value', event: 'input' },
  events: { input: ['input', el => el.value], change: ['change', el => el.value] },
});

export const Toolbar = wrap('ag-toolbar', 'AgToolbar', { props: { spread: Boolean }, attrs: { spread: 'spread' } });
export const ToolbarGroup = wrap('ag-toolbar-group', 'AgToolbarGroup', { props: { ...look, dim: Boolean }, attrs: { ...lookAttrs, dim: 'dim' } });

/** `<div v-glass="{ variant: 'clear' }">`: glass on any element. */
export const vGlass: Directive<HTMLElement & { __agGlass?: GlassEngine }, GlassOptions | undefined> = {
  mounted(el, { value }) { el.__agGlass = new GlassEngine(el, value ?? {}); },
  updated(el, { value, oldValue }) {
    if (!el.__agGlass || JSON.stringify(value) === JSON.stringify(oldValue)) return;
    if (value?.variant) el.__agGlass.setVariant(value.variant);
    if (value?.params) el.__agGlass.setParams(value.params);
    if (value?.tone) el.__agGlass.setTone(value.tone);
  },
  unmounted(el) { el.__agGlass?.destroy(); },
};

export type { AlertAction, Detent, MenuItem, TabItem, GlassParams, GlassVariant, GlassTone };
export type { Detent as SheetDetent };

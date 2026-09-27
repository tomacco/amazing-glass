import {
  Glass2
} from "./chunks/index-c4nfpczb.js";
import"./chunks/index-ms2yhdty.js";

// src/vue/index.ts
import { defineComponent, h, onMounted, ref, watch } from "vue";
function wrap(tag, name, spec) {
  const emits = [...new Set([...Object.values(spec.events ?? {}).map(([n]) => n), ...spec.model ? ["update:modelValue"] : []])];
  return defineComponent({
    name,
    props: { ...spec.props, ...spec.model ? { modelValue: null } : {} },
    emits,
    setup(props, { emit, slots }) {
      const el = ref();
      const sync = () => {
        const node = el.value;
        if (!node)
          return;
        for (const p of spec.domProps ?? [])
          if (props[p] !== undefined && node[p] !== props[p])
            node[p] = props[p];
        if (spec.model && props.modelValue !== undefined && node[spec.model.domProp] !== props.modelValue)
          node[spec.model.domProp] = props.modelValue;
      };
      onMounted(() => {
        sync();
        for (const [type, [out, read]] of Object.entries(spec.events ?? {})) {
          el.value.addEventListener(type, (e) => {
            const v = read(el.value, e);
            emit(out, v, e);
            if (spec.model && type === spec.model.event)
              emit("update:modelValue", v);
          });
        }
      });
      watch(() => ({ ...props }), sync, { deep: true, flush: "post" });
      return () => {
        const attrs = { ref: el };
        for (const [p, a] of Object.entries(spec.attrs ?? {})) {
          const v = props[p];
          if (v === true)
            attrs[a] = "";
          else if (v !== false && v != null)
            attrs[a] = String(v);
        }
        if (props.params)
          attrs.params = JSON.stringify(props.params);
        return h(tag, attrs, slots.default?.());
      };
    }
  });
}
var look = {
  variant: String,
  tint: String,
  tone: String,
  params: Object
};
var lookAttrs = { variant: "variant", tint: "tint", tone: "tone" };
var detail = (_, e) => e.detail;
var Glass = wrap("ag-glass", "AgGlass", { props: { ...look, dim: Boolean }, attrs: { ...lookAttrs, dim: "dim" } });
var Button = wrap("ag-button", "AgButton", {
  props: { ...look, variant: String, icon: String, size: String },
  attrs: { ...lookAttrs, icon: "icon", size: "size" }
});
var Switch = wrap("ag-switch", "AgSwitch", {
  props: { disabled: Boolean },
  attrs: { disabled: "disabled" },
  model: { domProp: "checked", event: "change" },
  events: { change: ["change", (el) => el.checked] }
});
var Slider = wrap("ag-slider", "AgSlider", {
  props: { min: Number, max: Number, step: Number, minIcon: String, maxIcon: String, disabled: Boolean },
  attrs: { min: "min", max: "max", step: "step", minIcon: "min-icon", maxIcon: "max-icon", disabled: "disabled" },
  model: { domProp: "value", event: "input" },
  events: { input: ["input", (el) => el.value], change: ["change", (el) => el.value] }
});
var Segmented = wrap("ag-segmented", "AgSegmented", {
  props: { options: { type: Array, required: true } },
  domProps: ["options"],
  model: { domProp: "value", event: "change" },
  events: { change: ["change", (el) => el.value] }
});
var TabBar = wrap("ag-tab-bar", "AgTabBar", {
  props: { items: { type: Array, required: true }, search: Boolean, minimizeOnScroll: String },
  attrs: { search: "search", minimizeOnScroll: "minimize-on-scroll" },
  domProps: ["items"],
  model: { domProp: "value", event: "change" },
  events: { change: ["change", (el) => el.value], search: ["search", () => {
    return;
  }] }
});
var Menu = wrap("ag-menu", "AgMenu", {
  props: { items: { type: Array, required: true }, icon: String, label: String, align: String },
  attrs: { icon: "icon", label: "label", align: "align" },
  domProps: ["items"],
  events: { select: ["select", detail] }
});
var Sheet = wrap("ag-sheet", "AgSheet", {
  props: {},
  model: { domProp: "detent", event: "detentchange" },
  events: { detentchange: ["detentchange", detail] }
});
var Alert = wrap("ag-alert", "AgAlert", {
  props: { heading: String, message: String, actions: { type: Array, required: true } },
  attrs: { heading: "heading", message: "message" },
  domProps: ["actions"],
  events: { action: ["action", detail] }
});
var Search = wrap("ag-search", "AgSearch", {
  props: { placeholder: String },
  attrs: { placeholder: "placeholder" },
  model: { domProp: "value", event: "input" },
  events: { input: ["input", (el) => el.value], change: ["change", (el) => el.value] }
});
var Toolbar = wrap("ag-toolbar", "AgToolbar", { props: { spread: Boolean }, attrs: { spread: "spread" } });
var ToolbarGroup = wrap("ag-toolbar-group", "AgToolbarGroup", { props: { ...look, dim: Boolean }, attrs: { ...lookAttrs, dim: "dim" } });
var vGlass = {
  mounted(el, { value }) {
    el.__agGlass = new Glass2(el, value ?? {});
  },
  updated(el, { value, oldValue }) {
    if (!el.__agGlass || JSON.stringify(value) === JSON.stringify(oldValue))
      return;
    if (value?.variant)
      el.__agGlass.setVariant(value.variant);
    if (value?.params)
      el.__agGlass.setParams(value.params);
    if (value?.tone)
      el.__agGlass.setTone(value.tone);
  },
  unmounted(el) {
    el.__agGlass?.destroy();
  }
};
export {
  Alert,
  Button,
  Glass,
  Menu,
  Search,
  Segmented,
  Sheet,
  Slider,
  Switch,
  TabBar,
  Toolbar,
  ToolbarGroup,
  vGlass
};

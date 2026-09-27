"use client";
import {
  Glass2
} from "./chunks/index-vfqpc6rm.js";
import"./chunks/index-z68f677r.js";

// src/react/index.tsx
import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef
} from "react";
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
var GLASS_ATTRS = { variant: "variant", tint: "tint", tone: "tone" };
function wrap(tag, name, spec) {
  const C = forwardRef((all, ref) => {
    const el = useRef(null);
    useImperativeHandle(ref, () => el.current);
    const input = all;
    const attrs = { ref: el };
    for (const [k, v] of Object.entries(input)) {
      if (spec.props?.includes(k) || spec.events?.[k] || k === "params")
        continue;
      const attr = spec.attrs?.[k];
      if (attr) {
        if (v === true)
          attrs[attr] = "";
        else if (v !== false && v != null)
          attrs[attr] = String(v);
      } else if (k === "className")
        attrs.class = v;
      else
        attrs[k] = v;
    }
    if (input.params)
      attrs.params = JSON.stringify(input.params);
    useIsoLayoutEffect(() => {
      const node = el.current;
      if (!node)
        return;
      for (const p of spec.props ?? [])
        if (input[p] !== undefined && node[p] !== input[p])
          node[p] = input[p];
    });
    const handlers = useRef(input);
    handlers.current = input;
    useEffect(() => {
      const node = el.current;
      if (!node)
        return;
      const offs = Object.entries(spec.events ?? {}).map(([prop, [type, read]]) => {
        const fn = (e) => handlers.current[prop]?.(read(node, e), e);
        node.addEventListener(type, fn);
        return () => node.removeEventListener(type, fn);
      });
      return () => offs.forEach((off) => off());
    }, []);
    return createElement(tag, attrs, input.children);
  });
  C.displayName = name;
  return C;
}
var detail = (_, e) => e.detail;
var Glass = wrap("ag-glass", "Glass", { attrs: { ...GLASS_ATTRS, dim: "dim" } });
var Button = wrap("ag-button", "Button", { attrs: { ...GLASS_ATTRS, icon: "icon", size: "size" } });
var Switch = wrap("ag-switch", "Switch", {
  props: ["checked", "disabled"],
  events: { onChange: ["change", (el) => el.checked] }
});
var Slider = wrap("ag-slider", "Slider", {
  attrs: { min: "min", max: "max", step: "step", minIcon: "min-icon", maxIcon: "max-icon", disabled: "disabled" },
  props: ["value"],
  events: { onInput: ["input", (el) => el.value], onChange: ["change", (el) => el.value] }
});
var Segmented = wrap("ag-segmented", "Segmented", {
  props: ["options", "value"],
  events: { onChange: ["change", (el) => el.value] }
});
var TabBar = wrap("ag-tab-bar", "TabBar", {
  attrs: { search: "search", minimizeOnScroll: "minimize-on-scroll" },
  props: ["items", "value"],
  events: { onChange: ["change", (el) => el.value], onSearch: ["search", () => {
    return;
  }] }
});
var Menu = wrap("ag-menu", "Menu", {
  attrs: { icon: "icon", label: "label", align: "align" },
  props: ["items"],
  events: { onSelect: ["select", detail] }
});
var Sheet = wrap("ag-sheet", "Sheet", {
  attrs: { detent: "detent" },
  events: { onDetentChange: ["detentchange", detail] }
});
var Alert = wrap("ag-alert", "Alert", {
  attrs: { heading: "heading", message: "message" },
  props: ["actions"],
  events: { onAction: ["action", detail] }
});
var Search = wrap("ag-search", "Search", {
  attrs: { placeholder: "placeholder" },
  props: ["value"],
  events: { onInput: ["input", (el) => el.value], onChange: ["change", (el) => el.value] }
});
var Toolbar = wrap("ag-toolbar", "Toolbar", { attrs: { spread: "spread" } });
var ToolbarGroup = wrap("ag-toolbar-group", "ToolbarGroup", { attrs: { ...GLASS_ATTRS, dim: "dim" } });
function useGlass(ref, options = {}) {
  const g = useRef(null);
  useIsoLayoutEffect(() => {
    if (!ref.current)
      return;
    g.current = new Glass2(ref.current, options);
    return () => {
      g.current?.destroy();
      g.current = null;
    };
  }, [ref]);
  useEffect(() => {
    if (!g.current)
      return;
    if (options.variant)
      g.current.setVariant(options.variant);
    if (options.params)
      g.current.setParams(options.params);
    if (options.tone)
      g.current.setTone(options.tone);
  }, [options.variant, options.tone, JSON.stringify(options.params ?? {})]);
  return g;
}
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
  useGlass
};

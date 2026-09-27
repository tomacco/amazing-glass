import {
  Glass2
} from "./index-z0bgpr8b.js";

// src/elements/base.ts
var SPRING = "linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017 19.4%, 1.061 22.2%, 1.078 25.3%, 1.066 29.2%, 1.018 38.3%, 0.996 45.2%, 0.993 52.3%, 1)";
var reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
var clamp = (v, a, b) => Math.min(b, Math.max(a, v));
var Base = typeof HTMLElement !== "undefined" ? HTMLElement : class {
};
function define(name, ctor) {
  if (typeof customElements !== "undefined" && !customElements.get(name))
    customElements.define(name, ctor);
}
function parseJSON(v, fallback) {
  if (!v)
    return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}
function parseList(v) {
  if (!v)
    return [];
  const t = v.trim();
  return t.startsWith("[") ? parseJSON(t, []) : t.split(",").map((s) => s.trim()).filter(Boolean);
}
function onDrag(el, h) {
  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || h.start?.(e) === false)
      return;
    const x0 = e.clientX;
    let moved = false;
    const move = (ev) => {
      if (!moved && Math.abs(ev.clientX - x0) > 3) {
        moved = true;
        el.setPointerCapture(e.pointerId);
      }
      h.move?.(ev.clientX - x0, ev);
    };
    const up = (ev) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      h.end?.(moved, ev);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
}
var GLASS_ATTRS = ["variant", "tint", "tone", "params"];
function applyGlassAttrs(host, glass, target = host) {
  if (!glass)
    return;
  const v = host.getAttribute("variant");
  if (v === "regular" || v === "clear" || v === "lens")
    glass.setVariant(v);
  const tint = host.getAttribute("tint");
  if (tint) {
    target.dataset.stained = "";
    target.style.setProperty("--ag-stain", tint);
  } else {
    delete target.dataset.stained;
    target.style.removeProperty("--ag-stain");
  }
  const tone = host.getAttribute("tone");
  if (tone)
    glass.setTone(tone);
  const params = parseJSON(host.getAttribute("params"), {});
  if (Object.keys(params).length)
    glass.setParams(params);
}
var fire = (el, type, detail) => el.dispatchEvent(detail === undefined ? new Event(type, { bubbles: true }) : new CustomEvent(type, { bubbles: true, detail }));

// src/elements/icons.ts
var P = {
  house: '<path d="M12 3.2 2.8 11a1 1 0 0 0 1.3 1.5l.9-.8V19a2 2 0 0 0 2 2h3.2v-5.2a1.8 1.8 0 0 1 3.6 0V21H17a2 2 0 0 0 2-2v-7.3l.9.8a1 1 0 0 0 1.3-1.5Z"/>',
  search: '<path d="M10.5 3a7.5 7.5 0 0 1 6 12l4.3 4.3a1.2 1.2 0 0 1-1.7 1.7L14.8 16.7A7.5 7.5 0 1 1 10.5 3Zm0 2.3a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Z"/>',
  note: '<path d="M19 3.3v11.9a3.3 3.3 0 1 1-2.2-3.1V7.6l-7.6 1.8v7.8A3.3 3.3 0 1 1 7 14.1V6.8c0-.6.4-1 .9-1.2l9.8-2.3a1 1 0 0 1 1.3 1Z"/>',
  grid: '<rect x="3" y="3" width="8" height="8" rx="2.2"/><rect x="13" y="3" width="8" height="8" rx="2.2"/><rect x="3" y="13" width="8" height="8" rx="2.2"/><rect x="13" y="13" width="8" height="8" rx="2.2"/>',
  person: '<circle cx="12" cy="7.5" r="4.2"/><path d="M3.8 20c.6-4.2 4-6.6 8.2-6.6s7.6 2.4 8.2 6.6c.1.6-.4 1-1 1H4.8c-.6 0-1.1-.4-1-1Z"/>',
  heart: '<path d="M12 20.6c-.3 0-.6-.1-.8-.3C6.3 16.4 2.8 13.3 2.8 9.1 2.8 6.2 5 4 7.8 4c1.7 0 3.2.8 4.2 2.2C13 4.8 14.5 4 16.2 4c2.8 0 5 2.2 5 5.1 0 4.2-3.5 7.3-8.4 11.2-.2.2-.5.3-.8.3Z"/>',
  plus: '<path d="M12 4.5c.7 0 1.2.5 1.2 1.2v5.1h5.1a1.2 1.2 0 0 1 0 2.4h-5.1v5.1a1.2 1.2 0 0 1-2.4 0v-5.1H5.7a1.2 1.2 0 0 1 0-2.4h5.1V5.7c0-.7.5-1.2 1.2-1.2Z"/>',
  ellipsis: '<circle cx="5.5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="18.5" cy="12" r="1.9"/>',
  share: '<path d="M12 2.8c.3 0 .6.1.8.3l3.4 3.4a1.1 1.1 0 0 1-1.6 1.6l-1.5-1.5v8.1a1.1 1.1 0 0 1-2.2 0V6.6L9.4 8.1a1.1 1.1 0 0 1-1.6-1.6l3.4-3.4c.2-.2.5-.3.8-.3ZM6.8 10.2h1.1a1.1 1.1 0 0 1 0 2.2h-1v7.1h10.2v-7.1h-1a1.1 1.1 0 0 1 0-2.2h1.1c1.2 0 2.1.9 2.1 2.1v7.3c0 1.2-.9 2.1-2.1 2.1H6.8c-1.2 0-2.1-.9-2.1-2.1v-7.3c0-1.2.9-2.1 2.1-2.1Z"/>',
  trash: '<path d="M9.6 2.8h4.8c.7 0 1.2.5 1.2 1.1v.9h4a1 1 0 0 1 0 2h-.9l-.8 12.3A2.2 2.2 0 0 1 15.7 21H8.3a2.2 2.2 0 0 1-2.2-1.9L5.3 6.8h-.9a1 1 0 0 1 0-2h4v-.9c0-.6.5-1.1 1.2-1.1Zm.4 7a.9.9 0 0 0-.9.9l.3 6.8a.9.9 0 0 0 1.8 0l-.3-6.8a.9.9 0 0 0-.9-.9Zm4 0a.9.9 0 0 0-.9.9l-.3 6.8a.9.9 0 0 0 1.8 0l.3-6.8a.9.9 0 0 0-.9-.9Z"/>',
  pencil: '<path d="M16.3 3.6a2 2 0 0 1 2.8 0l1.3 1.3a2 2 0 0 1 0 2.8L9.2 18.9l-4.6 1.3a.7.7 0 0 1-.8-.8l1.3-4.6Z"/>',
  copy: '<rect x="8" y="8" width="12.5" height="12.5" rx="2.6"/><path d="M6 15.6h-.4A2.1 2.1 0 0 1 3.5 13.5V5.6c0-1.2.9-2.1 2.1-2.1h7.9c1.2 0 2.1.9 2.1 2.1V6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mic: '<rect x="8.3" y="2.5" width="7.4" height="12.4" rx="3.7"/><path d="M5.5 11.3a6.5 6.5 0 0 0 13 0M12 17.8v3.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  chevronLeft: '<path d="M15.2 4.2a1.2 1.2 0 0 1 0 1.7L9.1 12l6.1 6.1a1.2 1.2 0 0 1-1.7 1.7l-7-7a1.2 1.2 0 0 1 0-1.7l7-7a1.2 1.2 0 0 1 1.7 0Z"/>',
  sun: '<circle cx="12" cy="12" r="4.4"/><path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  sunSmall: '<circle cx="12" cy="12" r="3.4"/><path d="M12 4.5v1.6M12 17.9v1.6M4.5 12h1.6M17.9 12h1.6M6.7 6.7l1.1 1.1M16.2 16.2l1.1 1.1M6.7 17.3l1.1-1.1M16.2 7.8l1.1-1.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  speaker: '<path d="M11.5 4.4v15.2c0 .8-.9 1.2-1.5.7L5.8 16.6H3.9A1.4 1.4 0 0 1 2.5 15.2V8.8c0-.8.6-1.4 1.4-1.4h1.9L10 3.7c.6-.5 1.5-.1 1.5.7Z"/><path d="M15 8.5a5 5 0 0 1 0 7M17.8 5.8a8.8 8.8 0 0 1 0 12.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  play: '<path d="M7 4.3v15.4c0 .9 1 1.4 1.7.9l11.4-7.7a1.1 1.1 0 0 0 0-1.8L8.7 3.4C8 2.9 7 3.4 7 4.3Z"/>',
  forward: '<path d="M2.5 6.2v11.6c0 .8.9 1.3 1.5.8l7.6-5.8a1 1 0 0 0 0-1.6L4 5.4c-.6-.5-1.5 0-1.5.8Zm10 0v11.6c0 .8.9 1.3 1.5.8l7.6-5.8a1 1 0 0 0 0-1.6L14 5.4c-.6-.5-1.5 0-1.5.8Z"/>',
  xmark: '<path d="M6.2 4.8 12 10.6l5.8-5.8a1 1 0 0 1 1.4 1.4L13.4 12l5.8 5.8a1 1 0 0 1-1.4 1.4L12 13.4l-5.8 5.8a1 1 0 0 1-1.4-1.4l5.8-5.8-5.8-5.8a1 1 0 0 1 1.4-1.4Z"/>',
  checkmark: '<path d="M20 5.7a1.2 1.2 0 0 1 .2 1.7L10.4 19a1.2 1.2 0 0 1-1.8.1L3.8 14.3a1.2 1.2 0 1 1 1.7-1.7l3.8 3.8 9-10.6a1.2 1.2 0 0 1 1.7-.1Z"/>',
  photo: '<path d="M5.5 3.5h13a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18V6a2.5 2.5 0 0 1 2.5-2.5Zm0 2A.5.5 0 0 0 5 6v9.6l3.6-3.8a1.3 1.3 0 0 1 1.9 0l2.3 2.4 1.3-1.3a1.3 1.3 0 0 1 1.8 0L19 16V6a.5.5 0 0 0-.5-.5Zm10.3 1.8a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Z"/>'
};
function icon2(name, size = 22) {
  if (!name || !P[name])
    return "";
  return `<svg class="ag-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${P[name]}</svg>`;
}
function registerIcon2(name, svgInner) {
  P[name] = svgInner;
}
var iconNames2 = () => Object.keys(P);

// src/elements/surface.ts
class AgGlass2 extends Base {
  static observedAttributes = GLASS_ATTRS;
  glass;
  connectedCallback() {
    this.glass ??= new Glass2(this, { variant: this.getAttribute("variant") ?? "regular" });
    applyGlassAttrs(this, this.glass);
  }
  attributeChangedCallback() {
    applyGlassAttrs(this, this.glass);
  }
  disconnectedCallback() {
    queueMicrotask(() => {
      if (!this.isConnected) {
        this.glass?.destroy();
        this.glass = undefined;
      }
    });
  }
}
define("ag-glass", AgGlass2);

class AgButton2 extends Base {
  static observedAttributes = [...GLASS_ATTRS, "icon"];
  glass;
  iconEl;
  connectedCallback() {
    if (!this.hasAttribute("role"))
      this.setAttribute("role", "button");
    if (!this.hasAttribute("tabindex"))
      this.tabIndex = 0;
    if (!this.iconEl) {
      this.iconEl = document.createElement("span");
      this.iconEl.className = "ag-button-icon";
      this.prepend(this.iconEl);
      this.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.click();
        }
      });
    }
    const kind = this.getAttribute("variant") ?? "glass";
    if (kind !== "plain")
      this.glass ??= new Glass2(this, { variant: kind === "clear" ? "clear" : "regular" });
    this.sync();
  }
  attributeChangedCallback() {
    if (this.iconEl)
      this.sync();
  }
  sync() {
    const kind = this.getAttribute("variant") ?? "glass";
    this.iconEl.innerHTML = icon2(this.getAttribute("icon"), this.hasAttribute("size") && this.getAttribute("size") === "large" ? 24 : 20);
    this.iconEl.hidden = !this.getAttribute("icon");
    const hasLabel = [...this.childNodes].some((n) => n !== this.iconEl && !n.classList?.contains("ag-refract") && n.textContent?.trim());
    this.toggleAttribute("data-icon-only", !hasLabel);
    if (!hasLabel && !this.hasAttribute("aria-label") && this.getAttribute("icon"))
      this.setAttribute("aria-label", this.getAttribute("icon"));
    if (!this.glass)
      return;
    this.glass.setVariant(kind === "clear" ? "clear" : "regular");
    if (kind === "prominent" || this.hasAttribute("tint")) {
      this.dataset.stained = "";
      const tint = this.getAttribute("tint");
      if (tint)
        this.style.setProperty("--ag-stain", tint);
      else
        this.style.removeProperty("--ag-stain");
    } else
      delete this.dataset.stained;
    const tone = this.getAttribute("tone");
    if (tone)
      this.glass.setTone(tone);
    const params = this.getAttribute("params");
    if (params)
      try {
        this.glass.setParams(JSON.parse(params));
      } catch {}
  }
  disconnectedCallback() {
    queueMicrotask(() => {
      if (!this.isConnected) {
        this.glass?.destroy();
        this.glass = undefined;
      }
    });
  }
}
define("ag-button", AgButton2);
// src/elements/switch.ts
var KNOB = 38;
var INSET = 2;

class AgSwitch2 extends Base {
  static observedAttributes = ["checked", "disabled"];
  knob;
  lens;
  get checked() {
    return this.hasAttribute("checked");
  }
  set checked(v) {
    this.toggleAttribute("checked", !!v);
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(v) {
    this.toggleAttribute("disabled", !!v);
  }
  attributeChangedCallback() {
    this.setAttribute("aria-checked", String(this.checked));
    this.setAttribute("aria-disabled", String(this.disabled));
  }
  connectedCallback() {
    if (this.knob)
      return;
    this.setAttribute("role", "switch");
    if (!this.hasAttribute("tabindex"))
      this.tabIndex = 0;
    this.attributeChangedCallback();
    const track = document.createElement("span");
    track.className = "ag-switch-track";
    this.knob = document.createElement("span");
    this.knob.className = "ag-switch-knob";
    track.append(this.knob);
    this.append(track);
    this.lens = new Glass2(this.knob, { variant: "lens" });
    this.knob.dataset.solid = "";
    const travel = () => this.offsetWidth - KNOB - INSET * 2;
    let startOn = false, x = 0;
    onDrag(this, {
      start: () => {
        if (this.disabled)
          return false;
        startOn = this.checked;
        x = startOn ? travel() : 0;
        this.classList.add("ag-active");
        this.classList.toggle("ag-drag-on", startOn);
        delete this.knob.dataset.solid;
      },
      move: (dx) => {
        x = Math.min(travel() + 6, Math.max(-6, (startOn ? travel() : 0) + dx));
        this.knob.style.setProperty("--x", `${x}px`);
        this.classList.toggle("ag-drag-on", x > travel() / 2);
      },
      end: (moved) => {
        this.classList.remove("ag-active", "ag-drag-on");
        this.knob.style.removeProperty("--x");
        this.set(moved ? x > travel() / 2 : !startOn);
        setTimeout(() => {
          if (this.knob)
            this.knob.dataset.solid = "";
        }, 180);
      }
    });
    this.addEventListener("keydown", (e) => {
      if ((e.key === " " || e.key === "Enter") && !this.disabled) {
        e.preventDefault();
        this.set(!this.checked);
      }
    });
  }
  set(v) {
    if (v === this.checked)
      return;
    this.checked = v;
    fire(this, "input");
    fire(this, "change");
  }
}
define("ag-switch", AgSwitch2);
// src/elements/slider.ts
class AgSlider2 extends Base {
  static observedAttributes = ["value", "min", "max", "step", "min-icon", "max-icon", "disabled"];
  rail;
  thumb;
  lens;
  get min() {
    return Number(this.getAttribute("min") ?? 0);
  }
  get max() {
    return Number(this.getAttribute("max") ?? 100);
  }
  get step() {
    return Number(this.getAttribute("step") ?? 0);
  }
  get value() {
    return clamp(Number(this.getAttribute("value") ?? (this.min + this.max) / 2), this.min, this.max);
  }
  set value(v) {
    const s = this.step;
    const q = s > 0 ? Math.round((v - this.min) / s) * s + this.min : v;
    this.setAttribute("value", String(+clamp(q, this.min, this.max).toFixed(6)));
  }
  attributeChangedCallback(name) {
    if (!this.rail)
      return;
    if (name === "min-icon" || name === "max-icon")
      return this.renderIcons();
    const f = (this.value - this.min) / (this.max - this.min || 1);
    this.style.setProperty("--ag-fraction", String(f));
    this.setAttribute("aria-valuenow", String(this.value));
    this.setAttribute("aria-valuemin", String(this.min));
    this.setAttribute("aria-valuemax", String(this.max));
  }
  renderIcons() {
    this.querySelectorAll(":scope > .ag-slider-icon").forEach((n) => n.remove());
    const lo = this.getAttribute("min-icon"), hi = this.getAttribute("max-icon");
    if (lo)
      this.rail.insertAdjacentHTML("beforebegin", `<span class="ag-slider-icon">${icon2(lo, 18)}</span>`);
    if (hi)
      this.rail.insertAdjacentHTML("afterend", `<span class="ag-slider-icon">${icon2(hi, 22)}</span>`);
  }
  connectedCallback() {
    if (this.rail)
      return;
    this.setAttribute("role", "slider");
    if (!this.hasAttribute("tabindex"))
      this.tabIndex = 0;
    this.rail = document.createElement("span");
    this.rail.className = "ag-slider-rail";
    this.rail.innerHTML = '<span class="ag-slider-fill"></span><span class="ag-slider-thumb"></span>';
    this.append(this.rail);
    this.thumb = this.rail.querySelector(".ag-slider-thumb");
    this.lens = new Glass2(this.thumb, { variant: "lens" });
    this.thumb.dataset.solid = "";
    this.renderIcons();
    this.attributeChangedCallback("value");
    let v0 = 0;
    const fromX = (x) => {
      const r = this.rail.getBoundingClientRect();
      return this.min + clamp((x - r.left) / r.width, 0, 1) * (this.max - this.min);
    };
    onDrag(this.rail, {
      start: (e) => {
        if (this.hasAttribute("disabled"))
          return false;
        this.classList.add("ag-active");
        delete this.thumb.dataset.solid;
        v0 = this.thumb.contains(e.target) ? this.value : fromX(e.clientX);
        this.value = v0;
        fire(this, "input");
      },
      move: (dx) => {
        const w = this.rail.getBoundingClientRect().width;
        this.value = v0 + dx / w * (this.max - this.min);
        fire(this, "input");
      },
      end: () => {
        this.classList.remove("ag-active");
        setTimeout(() => {
          if (this.thumb)
            this.thumb.dataset.solid = "";
        }, 180);
        fire(this, "change");
      }
    });
    this.addEventListener("keydown", (e) => {
      const unit = this.step || (this.max - this.min) / 20;
      const d = { ArrowRight: unit, ArrowUp: unit, ArrowLeft: -unit, ArrowDown: -unit }[e.key];
      if (d) {
        e.preventDefault();
        this.value = this.value + d;
        fire(this, "input");
        fire(this, "change");
      }
    });
  }
}
define("ag-slider", AgSlider2);
// src/elements/segmented.ts
class AgSegmented2 extends Base {
  static observedAttributes = ["options", "value"];
  pill;
  lens;
  items = [];
  opts = [];
  index = 0;
  dragged = false;
  get options() {
    return this.opts;
  }
  set options(v) {
    this.opts = v;
    this.renderItems();
  }
  get value() {
    return this.opts[this.index] ?? "";
  }
  set value(v) {
    this.setAttribute("value", v);
  }
  get selectedIndex() {
    return this.index;
  }
  set selectedIndex(i) {
    this.select(i, false);
  }
  attributeChangedCallback(name, _, next) {
    if (name === "options") {
      this.opts = parseList(next);
      this.renderItems();
    } else if (name === "value") {
      const i = this.opts.indexOf(next ?? "");
      if (i >= 0 && i !== this.index)
        this.select(i, false);
    }
  }
  connectedCallback() {
    if (this.pill)
      return;
    this.setAttribute("role", "tablist");
    this.pill = document.createElement("span");
    this.pill.className = "ag-segmented-pill";
    this.prepend(this.pill);
    this.lens = new Glass2(this.pill, { variant: "lens" });
    this.pill.dataset.solid = "";
    if (!this.opts.length)
      this.opts = parseList(this.getAttribute("options"));
    this.renderItems();
    new ResizeObserver(() => this.place(false)).observe(this);
    let x0 = null;
    onDrag(this, {
      start: (e) => {
        this.dragged = false;
        const hit = this.items.findIndex((b) => b.contains(e.target));
        if (hit !== this.index) {
          x0 = null;
          return;
        }
        x0 = this.pill.offsetLeft;
        this.classList.add("ag-active");
        delete this.pill.dataset.solid;
      },
      move: (dx) => {
        if (x0 == null)
          return;
        this.dragged = Math.abs(dx) > 3;
        this.pill.style.transition = "none";
        this.pill.style.left = `${clamp(x0 + dx, 2, this.offsetWidth - this.pill.offsetWidth - 2)}px`;
      },
      end: () => {
        if (x0 == null)
          return;
        this.pill.style.transition = "";
        this.classList.remove("ag-active");
        const w = this.items[0]?.offsetWidth || 1;
        this.select(clamp(Math.round((this.pill.offsetLeft - 2) / w), 0, this.items.length - 1), true);
        setTimeout(() => {
          if (this.pill)
            this.pill.dataset.solid = "";
          this.dragged = false;
        }, 180);
        x0 = null;
      }
    });
    this.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) {
        e.preventDefault();
        this.select(clamp(this.index + d, 0, this.items.length - 1), true);
        this.items[this.index]?.focus();
      }
    });
  }
  renderItems() {
    if (!this.pill)
      return;
    this.items.forEach((b) => b.remove());
    const want = this.getAttribute("value");
    this.index = Math.max(0, want ? this.opts.indexOf(want) : this.index);
    this.items = this.opts.map((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ag-segmented-item";
      b.setAttribute("role", "tab");
      b.textContent = label;
      b.addEventListener("click", () => {
        if (!this.dragged)
          this.select(i, true);
      });
      this.append(b);
      return b;
    });
    requestAnimationFrame(() => this.place(false));
  }
  place(animate = true) {
    const b = this.items[this.index];
    if (!b || !this.pill)
      return;
    if (!animate)
      this.pill.style.transition = "none";
    this.pill.style.left = `${b.offsetLeft}px`;
    this.pill.style.width = `${b.offsetWidth}px`;
    if (!animate) {
      this.pill.offsetWidth;
      this.pill.style.transition = "";
    }
    this.items.forEach((x, k) => {
      x.setAttribute("aria-selected", String(k === this.index));
      x.tabIndex = k === this.index ? 0 : -1;
    });
  }
  select(i, user) {
    const from = this.index;
    this.index = i;
    if (from !== i && user && !reducedMotion()) {
      this.pill?.animate([{ transform: "scale(1, 1)" }, { transform: "scale(1.18, 0.86)", offset: 0.35 }, { transform: "scale(1, 1)" }], { duration: 420, easing: "ease-out" });
    }
    this.place();
    if (from !== i && user)
      fire(this, "change");
  }
}
define("ag-segmented", AgSegmented2);
// src/elements/tab-bar.ts
class AgTabBar2 extends Base {
  static observedAttributes = ["items", "value", "search", "minimize-on-scroll"];
  bar;
  pill;
  glass;
  lens;
  searchBtn;
  tabs = [];
  list = [];
  index = 0;
  dragged = false;
  minimized = false;
  unbindScroll;
  get items() {
    return this.list;
  }
  set items(v) {
    this.list = v;
    this.renderTabs();
  }
  get value() {
    const t = this.list[this.index];
    return t?.value ?? String(this.index);
  }
  set value(v) {
    this.setAttribute("value", v);
  }
  attributeChangedCallback(name, _, next) {
    if (!this.bar)
      return;
    if (name === "items") {
      this.list = parseJSON(next, []);
      this.renderTabs();
    } else if (name === "value")
      this.selectValue(next);
    else if (name === "search")
      this.renderSearch();
    else if (name === "minimize-on-scroll")
      this.bindScroll();
  }
  connectedCallback() {
    if (this.bar)
      return;
    this.bar = document.createElement("div");
    this.bar.className = "ag-tab-bar-bar";
    this.bar.setAttribute("role", "tablist");
    this.pill = document.createElement("span");
    this.pill.className = "ag-tab-pill";
    this.bar.append(this.pill);
    this.append(this.bar);
    this.glass = new Glass2(this.bar, { variant: "regular" });
    this.lens = new Glass2(this.pill, { variant: "lens" });
    this.pill.dataset.solid = "";
    if (!this.list.length)
      this.list = parseJSON(this.getAttribute("items"), []);
    this.renderTabs();
    this.renderSearch();
    this.bindScroll();
    new ResizeObserver(() => this.place(false)).observe(this.bar);
    let x0 = null;
    onDrag(this.bar, {
      start: (e) => {
        this.dragged = false;
        if (this.minimized) {
          x0 = null;
          return;
        }
        x0 = e.clientX - this.bar.getBoundingClientRect().left - this.pill.offsetWidth / 2;
      },
      move: (dx) => {
        if (x0 == null || Math.abs(dx) < 4)
          return;
        if (!this.dragged) {
          this.dragged = true;
          this.classList.add("ag-active");
          delete this.pill.dataset.solid;
          this.pill.style.transition = "none";
        }
        this.pill.style.left = `${clamp(x0 + dx, 4, this.bar.offsetWidth - this.pill.offsetWidth - 4)}px`;
        const i = this.nearest();
        this.tabs.forEach((b, k) => b.classList.toggle("ag-under", k === i));
      },
      end: () => {
        this.pill.style.transition = "";
        if (x0 == null || !this.dragged)
          return;
        this.classList.remove("ag-active");
        this.tabs.forEach((b) => b.classList.remove("ag-under"));
        this.select(this.nearest(), true);
        setTimeout(() => {
          if (this.pill)
            this.pill.dataset.solid = "";
          this.dragged = false;
        }, 200);
      }
    });
  }
  disconnectedCallback() {
    this.unbindScroll?.();
  }
  renderTabs() {
    if (!this.bar)
      return;
    this.tabs.forEach((b) => b.remove());
    this.tabs = this.list.map((t, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ag-tab";
      b.setAttribute("role", "tab");
      b.innerHTML = `${icon2(t.icon, 24)}<span></span>`;
      b.querySelector("span").textContent = t.label;
      b.addEventListener("click", () => {
        if (!this.dragged)
          this.select(i, true);
      });
      this.bar.append(b);
      return b;
    });
    this.selectValue(this.getAttribute("value"));
    requestAnimationFrame(() => this.place(false));
  }
  renderSearch() {
    if (!this.bar)
      return;
    const want = this.hasAttribute("search");
    if (want && !this.searchBtn) {
      this.searchBtn = document.createElement("ag-button");
      this.searchBtn.setAttribute("icon", "search");
      this.searchBtn.setAttribute("size", "large");
      this.searchBtn.setAttribute("aria-label", "Search");
      this.searchBtn.className = "ag-tab-search";
      this.searchBtn.addEventListener("click", () => fire(this, "search"));
      this.append(this.searchBtn);
    } else if (!want && this.searchBtn) {
      this.searchBtn.remove();
      this.searchBtn = undefined;
    }
  }
  selectValue(v) {
    if (v == null)
      return;
    const i = this.list.findIndex((t, k) => (t.value ?? String(k)) === v);
    if (i >= 0 && i !== this.index) {
      this.index = i;
      this.place();
    }
  }
  nearest() {
    const c = this.pill.offsetLeft + this.pill.offsetWidth / 2;
    let best = 0, bd = Infinity;
    this.tabs.forEach((b, k) => {
      const d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - c);
      if (d < bd) {
        bd = d;
        best = k;
      }
    });
    return best;
  }
  place(animate = true) {
    const b = this.tabs[this.index];
    if (!b || !this.pill)
      return;
    if (!animate)
      this.pill.style.transition = "none";
    this.pill.style.left = `${b.offsetLeft}px`;
    this.pill.style.width = `${b.offsetWidth}px`;
    if (!animate) {
      this.pill.offsetWidth;
      this.pill.style.transition = "";
    }
    this.tabs.forEach((x, k) => x.setAttribute("aria-selected", String(k === this.index)));
  }
  select(i, user) {
    const changed = i !== this.index;
    this.index = i;
    if (this.minimized)
      this.minimize(false);
    this.place();
    if (changed && user)
      fire(this, "change");
  }
  minimize(on) {
    if (this.minimized === on || !this.bar)
      return;
    this.minimized = on;
    this.glass.morph(true);
    this.classList.toggle("ag-minimized", on);
    this.tabs.forEach((b, k) => {
      b.hidden = on && k !== this.index;
    });
    requestAnimationFrame(() => this.place(false));
    setTimeout(() => this.glass.morph(false), 520);
  }
  bindScroll() {
    this.unbindScroll?.();
    const sel = this.getAttribute("minimize-on-scroll");
    const scroller = sel ? document.querySelector(sel) : null;
    if (!scroller)
      return;
    let last = scroller.scrollTop;
    const onScroll = () => {
      const y = scroller.scrollTop, dy = y - last;
      if (Math.abs(dy) < 6)
        return;
      this.minimize(dy > 0 && y > 40);
      last = y;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    this.unbindScroll = () => scroller.removeEventListener("scroll", onScroll);
  }
}
define("ag-tab-bar", AgTabBar2);
// src/elements/menu.ts
class AgMenu2 extends Base {
  static observedAttributes = ["items", "icon", "label"];
  surface;
  trigger;
  listEl;
  glass;
  list = [];
  isOpen = false;
  get items() {
    return this.list;
  }
  set items(v) {
    this.list = v;
    this.renderItems();
  }
  get open() {
    return this.isOpen;
  }
  set open(v) {
    this.toggle(v);
  }
  attributeChangedCallback(name, _, next) {
    if (!this.surface)
      return;
    if (name === "items") {
      this.list = parseJSON(next, []);
      this.renderItems();
    } else
      this.renderTrigger();
  }
  connectedCallback() {
    if (this.surface)
      return;
    this.surface = document.createElement("div");
    this.surface.className = "ag-menu-surface";
    this.trigger = document.createElement("button");
    this.trigger.type = "button";
    this.trigger.className = "ag-menu-trigger";
    this.trigger.setAttribute("aria-haspopup", "menu");
    this.listEl = document.createElement("div");
    this.listEl.className = "ag-menu-list";
    this.listEl.setAttribute("role", "menu");
    this.surface.append(this.trigger, this.listEl);
    this.append(this.surface);
    this.glass = new Glass2(this.surface, { variant: "regular" });
    if (!this.list.length)
      this.list = parseJSON(this.getAttribute("items"), []);
    this.renderTrigger();
    this.renderItems();
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle(!this.isOpen);
    });
    document.addEventListener("pointerdown", (e) => {
      if (this.isOpen && !this.contains(e.target))
        this.toggle(false);
    });
    this.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.toggle(false);
        this.trigger?.focus();
      }
    });
  }
  renderTrigger() {
    this.trigger.innerHTML = icon2(this.getAttribute("icon") || "ellipsis", 22);
    this.trigger.setAttribute("aria-label", this.getAttribute("label") || "More");
    this.trigger.setAttribute("aria-expanded", String(this.isOpen));
  }
  renderItems() {
    if (!this.listEl)
      return;
    this.listEl.replaceChildren(...this.list.map((it) => {
      if ("separator" in it) {
        const hr = document.createElement("hr");
        hr.className = "ag-menu-separator";
        return hr;
      }
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ag-menu-item" + (it.destructive ? " ag-destructive" : "");
      b.setAttribute("role", "menuitem");
      b.innerHTML = `<span></span>${icon2(it.icon, 20)}`;
      b.querySelector("span").textContent = it.label;
      b.addEventListener("click", () => {
        fire(this, "select", it.value ?? it.label);
        this.toggle(false);
      });
      return b;
    }));
  }
  toggle(on) {
    if (on === this.isOpen || !this.surface)
      return;
    this.isOpen = on;
    this.trigger.setAttribute("aria-expanded", String(on));
    const s = this.surface;
    const from = { w: s.offsetWidth, h: s.offsetHeight };
    this.classList.toggle("ag-open", on);
    if (on && !this.hasAttribute("align")) {
      this.classList.remove("ag-flip");
      const r = s.getBoundingClientRect();
      if (r.left < 8)
        this.classList.add("ag-flip");
    }
    const to = { w: s.offsetWidth, h: s.offsetHeight };
    if (on)
      this.listEl.querySelector("button")?.focus({ preventScroll: true });
    fire(this, on ? "open" : "close");
    if (reducedMotion())
      return;
    this.glass.morph(true);
    s.animate([
      { width: `${from.w}px`, height: `${from.h}px`, borderRadius: on ? `${from.h / 2}px` : "28px" },
      { width: `${to.w}px`, height: `${to.h}px`, borderRadius: on ? "28px" : `${to.h / 2}px` }
    ], { duration: on ? 520 : 380, easing: on ? SPRING : "cubic-bezier(.32,.72,0,1)" }).finished.then(() => this.glass.morph(false));
    if (on)
      this.listEl.animate([{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "none" }], { duration: 280, delay: 90, easing: "ease-out", fill: "backwards" });
  }
}
define("ag-menu", AgMenu2);
// src/elements/sheet.ts
class AgSheet2 extends Base {
  static observedAttributes = ["detent"];
  grabber;
  glass;
  settle = 0;
  get detent() {
    return this.getAttribute("detent") || "closed";
  }
  set detent(d) {
    this.setAttribute("detent", d);
  }
  attributeChangedCallback() {
    if (!this.glass)
      return;
    this.glass.morph(true);
    clearTimeout(this.settle);
    this.settle = window.setTimeout(() => this.glass?.morph(false), 560);
    this.setAttribute("aria-hidden", String(this.detent === "closed"));
  }
  connectedCallback() {
    if (this.grabber)
      return;
    this.setAttribute("role", "dialog");
    this.grabber = document.createElement("button");
    this.grabber.type = "button";
    this.grabber.className = "ag-sheet-grabber";
    this.grabber.setAttribute("aria-label", "Resize sheet");
    this.prepend(this.grabber);
    this.glass = new Glass2(this, { variant: "regular" });
    this.attributeChangedCallback();
    let h0 = null, y0 = 0, moved = false;
    this.grabber.addEventListener("click", () => {
      if (!moved)
        this.change(this.detent === "large" ? "medium" : "large");
    });
    this.grabber.addEventListener("pointerdown", (e) => {
      h0 = this.offsetHeight;
      y0 = e.clientY;
      moved = false;
      this.grabber.setPointerCapture(e.pointerId);
      this.style.transition = "none";
      this.glass.morph(true);
    });
    this.grabber.addEventListener("pointermove", (e) => {
      if (h0 == null)
        return;
      const dy = e.clientY - y0;
      if (Math.abs(dy) > 4)
        moved = true;
      this.style.height = `${Math.max(80, h0 - dy)}px`;
    });
    this.grabber.addEventListener("pointerup", () => {
      if (h0 == null)
        return;
      const h = this.offsetHeight, H = this.offsetParent?.clientHeight || innerHeight;
      h0 = null;
      this.style.transition = "";
      this.style.height = "";
      if (moved)
        this.change(h > H * 0.72 ? "large" : h > H * 0.3 ? "medium" : "closed");
      else
        this.glass.morph(false);
    });
  }
  change(d) {
    if (d === this.detent)
      return;
    this.detent = d;
    fire(this, "detentchange", d);
  }
}
define("ag-sheet", AgSheet2);
// src/elements/alert.ts
class AgAlert2 extends Base {
  static observedAttributes = ["heading", "message", "actions"];
  list = [];
  glass;
  built = false;
  get actions() {
    return this.list;
  }
  set actions(v) {
    this.list = v;
    this.render();
  }
  attributeChangedCallback(name, _, next) {
    if (name === "actions")
      this.list = parseJSON(next, []);
    if (this.built)
      this.render();
  }
  connectedCallback() {
    if (this.built)
      return;
    this.built = true;
    this.setAttribute("role", "alertdialog");
    if (!this.list.length)
      this.list = parseJSON(this.getAttribute("actions"), []);
    this.render();
    this.glass = new Glass2(this, { variant: "regular" });
  }
  render() {
    const nodes = [];
    const title = document.createElement("div");
    title.className = "ag-alert-heading";
    title.textContent = this.getAttribute("heading") ?? "";
    const msg = document.createElement("div");
    msg.className = "ag-alert-message";
    msg.textContent = this.getAttribute("message") ?? "";
    const row = document.createElement("div");
    row.className = "ag-alert-actions";
    for (const a of this.list) {
      const b = document.createElement("ag-button");
      if (a.role === "destructive") {
        b.setAttribute("variant", "prominent");
        b.setAttribute("tint", "var(--ag-red)");
      } else if (a.role !== "cancel")
        b.setAttribute("variant", "prominent");
      else
        b.classList.add("ag-alert-cancel");
      b.textContent = a.label;
      b.addEventListener("click", () => fire(this, "action", a.value ?? a.label));
      row.append(b);
    }
    nodes.push(title, msg, row);
    const layer = this.querySelector(":scope > .ag-refract");
    this.replaceChildren(...layer ? [layer] : [], ...nodes);
    this.setAttribute("aria-label", title.textContent ?? "");
  }
}
define("ag-alert", AgAlert2);
// src/elements/search.ts
class AgSearch2 extends Base {
  static observedAttributes = ["placeholder", "value"];
  input;
  glass;
  get value() {
    return this.input?.value ?? this.getAttribute("value") ?? "";
  }
  set value(v) {
    if (this.input)
      this.input.value = v;
    else
      this.setAttribute("value", v);
  }
  attributeChangedCallback(name, _, next) {
    if (!this.input)
      return;
    if (name === "placeholder") {
      this.input.placeholder = next ?? "";
      this.input.setAttribute("aria-label", next || "Search");
    }
    if (name === "value" && next !== this.input.value)
      this.input.value = next ?? "";
  }
  connectedCallback() {
    if (this.input)
      return;
    this.insertAdjacentHTML("beforeend", `<span class="ag-search-icon">${icon2("search", 18)}</span><input type="search" enterkeyhint="search"><span class="ag-search-icon">${icon2("mic", 18)}</span>`);
    this.input = this.querySelector("input");
    const ph = this.getAttribute("placeholder") ?? "Search";
    this.input.placeholder = ph;
    this.input.setAttribute("aria-label", ph);
    this.input.value = this.getAttribute("value") ?? "";
    if (this.id)
      this.input.id = `${this.id}-input`;
    this.glass = new Glass2(this, { variant: "regular" });
  }
  focus(options) {
    this.input?.focus(options);
  }
}
define("ag-search", AgSearch2);
// src/elements/toolbar.ts
class AgToolbar2 extends Base {
  connectedCallback() {
    this.setAttribute("role", "toolbar");
  }
}
define("ag-toolbar", AgToolbar2);

class AgToolbarGroup2 extends Base {
  static observedAttributes = [...GLASS_ATTRS, "dim"];
  glass;
  connectedCallback() {
    this.glass ??= new Glass2(this, { variant: this.getAttribute("variant") ?? "regular" });
    applyGlassAttrs(this, this.glass);
  }
  attributeChangedCallback() {
    applyGlassAttrs(this, this.glass);
  }
}
define("ag-toolbar-group", AgToolbarGroup2);
export { icon2, registerIcon2, iconNames2, AgGlass2, AgButton2, AgSwitch2, AgSlider2, AgSegmented2, AgTabBar2, AgMenu2, AgSheet2, AgAlert2, AgSearch2, AgToolbar2, AgToolbarGroup2 };

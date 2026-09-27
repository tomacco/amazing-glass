// src/core/params.ts
var VARIANTS2 = {
  regular: { blur: 10.35, saturate: 2.25, lum: 0.99, contrast: 0.81, bezel: 0.42, maxBezel: 30.6, depth: 1.19, ior: 1.5, dispersion: 0, zoom: 1, rim: 0.66, rimWidth: 0.3, shade: 0.03, light: -135 },
  clear: { blur: 12.02, saturate: 1.31, lum: 1, contrast: 0.86, bezel: 0.49, maxBezel: 32.5, depth: 1.2, ior: 1.5, dispersion: 0.077, zoom: 1, rim: 1.01, rimWidth: 0.3, shade: 0.03, light: -135 },
  lens: { blur: 0, saturate: 1.2, lum: 1, contrast: 1, bezel: 0.42, maxBezel: 34, depth: 1, ior: 1.5, dispersion: 0.14, zoom: 1.08, rim: 1.7, rimWidth: 1.25, shade: 0.16, light: -135 }
};
function resolveParams2(variant, overrides) {
  return { ...VARIANTS2[variant], ...overrides };
}

// src/core/optics.ts
function roundedRect2(px, py, hw, hh, r) {
  const ax = Math.abs(px), ay = Math.abs(py);
  const qx = ax - (hw - r), qy = ay - (hh - r);
  let d, nx, ny;
  if (qx > 0 && qy > 0) {
    const n = 2.6;
    d = Math.pow(Math.pow(qx, n) + Math.pow(qy, n), 1 / n) - r;
    const gx = Math.pow(qx, n - 1), gy = Math.pow(qy, n - 1);
    const gl = Math.hypot(gx, gy) || 1;
    nx = gx / gl;
    ny = gy / gl;
  } else if (qx > qy) {
    d = qx - r;
    nx = 1;
    ny = 0;
  } else {
    d = qy - r;
    nx = 0;
    ny = 1;
  }
  return { d, nx: nx * Math.sign(px || 1), ny: ny * Math.sign(py || 1) };
}
function boxDistance(px, py, s) {
  const qx = Math.abs(px - s.x) - (s.w / 2 - s.r), qy = Math.abs(py - s.y) - (s.h / 2 - s.r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - s.r;
}
function smoothMin2(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
var rimHeight = (t) => Math.pow(1 - Math.pow(1 - t, 4), 0.25);
function refractOffset2(t, bezelPx, thickness, ior) {
  if (t >= 1)
    return 0;
  const e = 0.001;
  const t0 = Math.max(t, e), t1 = Math.min(t0 + e, 1);
  const slope = (rimHeight(t1) - rimHeight(t0)) / e * thickness / bezelPx;
  const incidence = Math.atan(slope);
  const refracted = Math.asin(Math.sin(incidence) / ior);
  return thickness * Math.tan(incidence - refracted);
}
function rimProfile2(bezelPx, thickness, ior, samples = 64) {
  const table = new Float32Array(samples + 1);
  let max = 0;
  for (let i = 0;i <= samples; i++) {
    table[i] = refractOffset2(i / samples, bezelPx, thickness, ior);
    max = Math.max(max, table[i]);
  }
  const at = (depth) => {
    if (depth <= 0)
      return 0;
    const f = Math.min(1, depth / bezelPx) * samples, i = Math.floor(f), fr = f - i;
    return i >= samples ? 0 : table[i] * (1 - fr) + table[i + 1] * fr;
  };
  return { at, max };
}
var bezelWidth = (w, h, bezel, maxBezel) => Math.max(4, Math.min(maxBezel, Math.min(w, h) * bezel));

// src/core/maps.ts
function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  return { c, ctx, img: ctx.createImageData(w, h) };
}
function drawMaps(id, w, h, sample, p, bezelPx, opts = {}) {
  const thickness = bezelPx * p.depth;
  const profile = rimProfile2(bezelPx, thickness, p.ior);
  const zoom = p.zoom || 1;
  const zoomMax = (1 - 1 / zoom) * Math.max(w, h) / 2;
  const scale = Math.max(1, (profile.max + zoomMax) * 2.1);
  const q = opts.draft ? 0.5 : 1;
  const dw = Math.max(1, Math.ceil(w * q)), dh = Math.max(1, Math.ceil(h * q));
  const D = canvas(dw, dh), dd = D.img.data;
  const dx = new Float32Array(dw * dh), dy = new Float32Array(dw * dh);
  for (let y = 0;y < dh; y++) {
    for (let x = 0;x < dw; x++) {
      const px = (x + 0.5) / q, py = (y + 0.5) / q;
      const { d, nx, ny } = sample(px, py);
      const off = profile.at(-d);
      let ox = -nx * off, oy = -ny * off;
      if (zoom !== 1 && d < 0) {
        ox -= (px - w / 2) * (1 - 1 / zoom);
        oy -= (py - h / 2) * (1 - 1 / zoom);
      }
      const i = y * dw + x, k = i * 4;
      dx[i] = ox;
      dy[i] = oy;
      dd[k] = 128 + ox / scale * 255;
      dd[k + 1] = 128 + oy / scale * 255;
      dd[k + 2] = 128;
      dd[k + 3] = 255;
    }
  }
  D.ctx.putImageData(D.img, 0, 0);
  const dpr = opts.draft ? 1 : Math.min(2, globalThis.devicePixelRatio || 1);
  const sw = Math.ceil(w * dpr), sh = Math.ceil(h * dpr);
  const S = canvas(sw, sh), sd = S.img.data;
  const M = opts.mask ? canvas(sw, sh) : null;
  const la = p.light * Math.PI / 180, lx = Math.cos(la), ly = Math.sin(la);
  const rim = p.rimWidth * dpr, glow = bezelPx * 0.55 * dpr;
  for (let y = 0;y < sh; y++) {
    for (let x = 0;x < sw; x++) {
      const { d, nx, ny } = sample((x + 0.5) / dpr, (y + 0.5) / dpr);
      const depth = -d * dpr, k = (y * sw + x) * 4;
      if (M)
        M.img.data[k + 3] = Math.min(1, Math.max(0, depth + 0.5)) * 255;
      if (depth <= -1)
        continue;
      const facing = nx * lx + ny * ly;
      const lit = Math.pow(Math.max(0, facing), 1.6);
      const back = Math.pow(Math.max(0, -facing), 2.2) * 0.55;
      const aa = Math.min(1, depth + 1);
      const line = Math.exp(-Math.pow(depth / rim, 2)) * (0.22 + 0.78 * (lit + back));
      const soft = Math.exp(-depth / glow) * 0.22 * (lit + back * 0.6);
      const a = Math.min(1, (line + soft) * aa * p.rim);
      const shade = Math.exp(-Math.pow((depth - rim * 1.6) / (rim * 0.9), 2)) * p.shade * aa * (1 - lit);
      const v = shade > a ? 0 : 255;
      sd[k] = sd[k + 1] = sd[k + 2] = v;
      sd[k + 3] = Math.max(a, shade) * 255;
    }
  }
  S.ctx.putImageData(S.img, 0, 0);
  if (M)
    M.ctx.putImageData(M.img, 0, 0);
  return {
    displacement: D.c.toDataURL(),
    specular: S.c.toDataURL(),
    mask: M?.c.toDataURL(),
    scale,
    raw: { id, width: dw, height: dh, q, dx, dy }
  };
}
var cache = new Map;
function roundedRectMaps(w, h, radius, p, draft = false) {
  const key = JSON.stringify([w, h, radius, draft, p.bezel, p.maxBezel, p.depth, p.ior, p.zoom, p.rim, p.rimWidth, p.shade, p.light]);
  const hit = cache.get(key);
  if (hit)
    return hit;
  const r = Math.min(radius, w / 2, h / 2);
  const maps = drawMaps(key, w, h, (px, py) => roundedRect2(px - w / 2, py - h / 2, w / 2, h / 2, r), p, bezelWidth(w, h, p.bezel, p.maxBezel), { draft });
  if (cache.size > 200)
    cache.clear();
  cache.set(key, maps);
  return maps;
}

// src/core/filter.ts
var SVG = "http://www.w3.org/2000/svg";
var supportsRefraction2 = (() => {
  if (typeof navigator === "undefined")
    return false;
  if (typeof location !== "undefined" && location.search.includes("ag-fallback"))
    return false;
  const brands = navigator.userAgentData?.brands ?? [];
  return brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand));
})();
var defs = null;
function root() {
  if (defs?.isConnected)
    return defs;
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  defs = document.createElementNS(SVG, "defs");
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return defs;
}
function createFilter(id) {
  const f = document.createElementNS(SVG, "filter");
  f.id = id;
  f.setAttribute("filterUnits", "userSpaceOnUse");
  f.setAttribute("primitiveUnits", "userSpaceOnUse");
  f.setAttribute("color-interpolation-filters", "sRGB");
  f.innerHTML = `
    <feGaussianBlur in="SourceGraphic" stdDeviation="0" result="frost"/>
    <feImage result="map" preserveAspectRatio="none"/>
    <feDisplacementMap in="frost" in2="map" xChannelSelector="R" yChannelSelector="G" result="dr"/>
    <feDisplacementMap in="frost" in2="map" xChannelSelector="R" yChannelSelector="G" result="dg"/>
    <feDisplacementMap in="frost" in2="map" xChannelSelector="R" yChannelSelector="G" result="db"/>
    <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
    <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
    <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
    <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg"/>
    <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" result="rgb"/>
    <feColorMatrix in="rgb" type="saturate" values="1" result="sat"/>
    <feComponentTransfer in="sat"><feFuncR type="linear"/><feFuncG type="linear"/><feFuncB type="linear"/></feComponentTransfer>`;
  root().appendChild(f);
  return f;
}
function updateFilter(f, w, h, map, scale, p) {
  const [blur, img, dr, dg, db, , , , , , sat, lumen] = Array.from(f.children);
  const box = { x: "0", y: "0", width: String(w), height: String(h) };
  for (const [k, v] of Object.entries(box)) {
    f.setAttribute(k, v);
    img.setAttribute(k, v);
  }
  blur.setAttribute("stdDeviation", String(p.blur));
  img.setAttribute("href", map);
  dr.setAttribute("scale", String(scale * (1 + p.dispersion)));
  dg.setAttribute("scale", String(scale));
  db.setAttribute("scale", String(scale * (1 - p.dispersion)));
  sat.setAttribute("values", String(p.saturate));
  for (const fn of Array.from(lumen.children)) {
    fn.setAttribute("slope", String(p.lum * p.contrast));
    fn.setAttribute("intercept", String(0.5 * (1 - p.contrast)));
  }
}
var cssBackdrop = (p) => `blur(${Math.max(p.blur * 1.2, 1)}px) saturate(${p.saturate}) brightness(${p.lum}) contrast(${p.contrast})`;

// src/core/backdrop.ts
var sources = new Map;
function registerBackdrop2(canvas) {
  if (!sources.has(canvas))
    sources.set(canvas, { canvas, version: 0 });
  backdropChanged2(canvas);
  return () => {
    sources.delete(canvas);
  };
}
function backdropChanged2(canvas) {
  if (canvas) {
    const s = sources.get(canvas);
    if (s)
      s.version++;
  }
  refresh2();
}
function pixelsOf(s) {
  if (!s.pixels || s.pixelsVersion !== s.version || s.pixels.width !== s.canvas.width || s.pixels.height !== s.canvas.height) {
    const ctx = s.canvas.getContext("2d", { willReadFrequently: true });
    s.pixels = ctx.getImageData(0, 0, s.canvas.width, s.canvas.height);
    s.pixelsVersion = s.version;
  }
  return s.pixels;
}
function parseRGB(c) {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m)
    return null;
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return a < 0.2 ? null : (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
var isGlass = (e) => !!e.closest(".ag-glass");
function canvasAt(x, y, self) {
  const stack = document.elementsFromPoint(x, y);
  let blocker = null;
  for (const e of stack) {
    if (self.contains(e) || isGlass(e))
      continue;
    if (e instanceof HTMLCanvasElement && sources.has(e))
      return sources.get(e);
    if (parseRGB(getComputedStyle(e).backgroundColor) != null) {
      blocker = e;
      break;
    }
  }
  for (const s of sources.values()) {
    const r = s.canvas.getBoundingClientRect();
    if (x >= r.left && x < r.right && y >= r.top && y < r.bottom && s.canvas.isConnected && (!blocker || blocker.contains(s.canvas)))
      return s;
  }
  return null;
}
function luminanceAt2(x, y, self) {
  const src = canvasAt(x, y, self);
  if (src) {
    const r = src.canvas.getBoundingClientRect(), px = pixelsOf(src);
    const cx = Math.floor((x - r.left) / r.width * px.width), cy = Math.floor((y - r.top) / r.height * px.height);
    const i = (Math.min(px.height - 1, Math.max(0, cy)) * px.width + Math.min(px.width - 1, Math.max(0, cx))) * 4;
    return (0.2126 * px.data[i] + 0.7152 * px.data[i + 1] + 0.0722 * px.data[i + 2]) / 255;
  }
  for (const e of document.elementsFromPoint(x, y)) {
    if (self.contains(e) || isGlass(e))
      continue;
    const l = parseRGB(getComputedStyle(e).backgroundColor);
    if (l != null)
      return l;
  }
  return null;
}
function measureTone(el) {
  const r = el.getBoundingClientRect();
  if (!r.width)
    return null;
  let sum = 0, n = 0;
  for (let i = 0;i < 5; i++) {
    const l = luminanceAt2(r.left + r.width * (i + 0.5) / 5, r.top + r.height / 2, el);
    if (l != null) {
      sum += l;
      n++;
    }
  }
  if (!n)
    return null;
  const lum = sum / n, cur = el.dataset.tone || "light";
  return cur === "light" ? lum < 0.47 ? "dark" : "light" : lum > 0.57 ? "light" : "dark";
}
function canvasBehind(el) {
  if (el.parentElement?.closest(".ag-glass"))
    return null;
  const r = el.getBoundingClientRect();
  for (const src of sources.values()) {
    if (!src.canvas.isConnected)
      continue;
    const c = src.canvas.getBoundingClientRect();
    const x0 = Math.max(r.left, c.left), x1 = Math.min(r.right, c.right);
    const y0 = Math.max(r.top, c.top), y1 = Math.min(r.bottom, c.bottom);
    if (x1 - x0 < 1 || y1 - y0 < 1)
      continue;
    if (canvasAt((x0 + x1) / 2, (y0 + y1) / 2, el) !== src)
      continue;
    return { source: src, rect: r, canvasRect: c, pixels: pixelsOf(src) };
  }
  return null;
}
var listeners = new Set;
var queued = false;
function onRefresh(fn) {
  listeners.add(fn);
  refresh2();
  return () => {
    listeners.delete(fn);
  };
}
function refresh2() {
  if (queued || typeof requestAnimationFrame === "undefined")
    return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    listeners.forEach((fn) => fn());
  });
}
if (typeof window !== "undefined") {
  addEventListener("scroll", refresh2, { passive: true, capture: true });
  addEventListener("resize", refresh2);
}

// src/core/fallback.ts
class CpuRefraction {
  host;
  out;
  memo = "";
  constructor(host) {
    this.host = host;
  }
  render(raw, w, h, dispersion, mask) {
    const src = canvasBehind(this.host);
    if (!src) {
      if (this.out)
        this.out.hidden = true;
      return;
    }
    if (!this.out) {
      this.out = document.createElement("canvas");
      this.out.className = "ag-cpu";
      this.out.setAttribute("aria-hidden", "true");
      this.host.prepend(this.out);
    }
    this.out.hidden = false;
    if (mask) {
      this.out.style.maskImage = this.out.style.webkitMaskImage = `url(${mask})`;
      this.out.style.maskSize = this.out.style.webkitMaskSize = "100% 100%";
    }
    const W = Math.round(w), H = Math.round(h);
    const ox = src.rect.left - src.canvasRect.left, oy = src.rect.top - src.canvasRect.top;
    const memo = `${W}|${H}|${Math.round(ox)}|${Math.round(oy)}|${src.source.version}|${raw.id}`;
    if (memo === this.memo)
      return;
    this.memo = memo;
    if (this.out.width !== W || this.out.height !== H) {
      this.out.width = W;
      this.out.height = H;
    }
    const img = src.pixels, { data: sd, width: SW, height: SH } = img;
    const sx = SW / src.canvasRect.width, sy = SH / src.canvasRect.height;
    const canvasW = src.canvasRect.width, canvasH = src.canvasRect.height;
    const ctx = this.out.getContext("2d");
    const out = ctx.createImageData(W, H), od = out.data;
    for (let y = 0;y < H; y++) {
      const my = Math.min(raw.height - 1, Math.floor(y * raw.q));
      for (let x = 0;x < W; x++) {
        const o = (y * W + x) * 4;
        if (ox + x < 0 || oy + y < 0 || ox + x >= canvasW || oy + y >= canvasH) {
          od[o + 3] = 0;
          continue;
        }
        const mi = my * raw.width + Math.min(raw.width - 1, Math.floor(x * raw.q));
        const dx = raw.dx[mi], dy = raw.dy[mi];
        for (let ch = 0;ch < 3; ch++) {
          const f = 1 + (1 - ch) * dispersion;
          const px = Math.min(SW - 1, Math.max(0, Math.round((ox + x + dx * f) * sx)));
          const py = Math.min(SH - 1, Math.max(0, Math.round((oy + y + dy * f) * sy)));
          od[o + ch] = sd[(py * SW + px) * 4 + ch];
        }
        od[o + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }
  destroy() {
    this.out?.remove();
  }
}

// src/core/glass.ts
var uid = 0;

class Glass2 {
  el;
  layer;
  variant;
  overrides;
  tone;
  params;
  filter;
  cpu;
  maps;
  frame = 0;
  live = false;
  ro;
  stopRefresh;
  id = `ag-${++uid}`;
  constructor(el, opts = {}) {
    this.el = el;
    this.variant = opts.variant ?? el.getAttribute("variant") ?? "regular";
    this.overrides = opts.params ?? {};
    this.tone = opts.tone ?? (this.variant === "lens" ? "light" : "auto");
    this.params = resolveParams2(this.variant, this.overrides);
    el.classList.add("ag-glass");
    el.dataset.variant = this.variant;
    if (this.tone !== "auto")
      el.dataset.tone = this.tone;
    this.layer = document.createElement("span");
    this.layer.className = "ag-refract";
    this.layer.setAttribute("aria-hidden", "true");
    el.prepend(this.layer);
    this.ro = new ResizeObserver(() => this.schedule());
    this.ro.observe(el);
    this.stopRefresh = onRefresh(() => this.onRefresh());
    this.schedule();
  }
  get currentParams() {
    return this.params;
  }
  setVariant(variant) {
    this.variant = variant;
    this.el.dataset.variant = variant;
    this.params = resolveParams2(variant, this.overrides);
    this.schedule();
  }
  setParams(params) {
    this.overrides = { ...this.overrides, ...params };
    this.params = resolveParams2(this.variant, this.overrides);
    this.schedule();
  }
  setTone(tone) {
    this.tone = tone;
    if (tone === "auto")
      this.onRefresh();
    else
      this.el.dataset.tone = tone;
  }
  morph(on) {
    this.live = on;
    this.schedule();
  }
  schedule() {
    if (this.frame || typeof requestAnimationFrame === "undefined")
      return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }
  radius(w, h) {
    const cs = getComputedStyle(this.el);
    const raw = cs.borderTopLeftRadius;
    let r = parseFloat(raw) || 0;
    if (raw.includes("%"))
      r = Math.min(w, h) * r / 100;
    return Math.min(r, w / 2, h / 2);
  }
  render() {
    const w = Math.round(this.el.offsetWidth), h = Math.round(this.el.offsetHeight);
    if (this.live)
      this.schedule();
    if (!w || !h)
      return;
    const p = this.params;
    this.maps = roundedRectMaps(w, h, this.radius(w, h), p, this.live);
    this.layer.style.backgroundImage = `url(${this.maps.specular})`;
    if (supportsRefraction2) {
      this.filter ??= createFilter(this.id);
      updateFilter(this.filter, w, h, this.maps.displacement, this.maps.scale, p);
      this.layer.style.backdropFilter = `url(#${this.id})`;
    } else {
      this.layer.style.backdropFilter = cssBackdrop(p);
      this.layer.style.setProperty("-webkit-backdrop-filter", cssBackdrop(p));
      this.cpu ??= new CpuRefraction(this.el);
      this.cpu.render(this.maps.raw, w, h, p.dispersion);
    }
    this.onRefresh();
  }
  onRefresh() {
    if (!this.el.isConnected)
      return;
    if (this.tone === "auto") {
      const t = measureTone(this.el);
      if (t && this.el.dataset.tone !== t)
        this.el.dataset.tone = t;
    }
    if (this.cpu && this.maps)
      this.cpu.render(this.maps.raw, this.el.offsetWidth, this.el.offsetHeight, this.params.dispersion);
  }
  destroy() {
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    this.stopRefresh();
    this.filter?.remove();
    this.cpu?.destroy();
    this.layer.remove();
    this.el.classList.remove("ag-glass");
  }
}
// src/core/field.ts
var uid2 = 0;

class GlassField2 {
  el;
  layer;
  params;
  merge;
  shapes = [];
  frame = 0;
  filter;
  cpu;
  id = `ag-field-${++uid2}`;
  constructor(el, opts = {}) {
    this.el = el;
    this.params = resolveParams2(opts.variant ?? "clear", opts.params);
    this.merge = opts.merge ?? 36;
    el.classList.add("ag-glass", "ag-field");
    el.dataset.variant = opts.variant ?? "clear";
    this.layer = document.createElement("span");
    this.layer.className = "ag-refract";
    this.layer.setAttribute("aria-hidden", "true");
    el.prepend(this.layer);
  }
  setShapes(shapes) {
    this.shapes = shapes;
    if (!this.frame)
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.render();
      });
  }
  setParams(params) {
    this.params = { ...this.params, ...params };
    this.setShapes(this.shapes);
  }
  render() {
    const w = this.el.offsetWidth, h = this.el.offsetHeight;
    if (!w || !h || !this.shapes.length)
      return;
    const p = this.params, k = this.merge;
    const minSide = Math.min(...this.shapes.map((s) => Math.min(s.w, s.h)));
    const bezel = bezelWidth(minSide, minSide, p.bezel, p.maxBezel);
    const sdf = new Float32Array(w * h);
    for (let y = 0;y < h; y++)
      for (let x = 0;x < w; x++) {
        let d = 1e9;
        for (const s of this.shapes)
          d = smoothMin2(d, boxDistance(x + 0.5, y + 0.5, s), k);
        sdf[y * w + x] = d;
      }
    const at = (x, y) => sdf[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
    const sample = (px, py) => {
      const x = Math.floor(px), y = Math.floor(py);
      const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1);
      const gl = Math.hypot(gx, gy) || 1;
      return { d: at(x, y), nx: gx / gl, ny: gy / gl };
    };
    const maps = drawMaps(this.id + performance.now(), w, h, sample, { ...p, zoom: 1 }, bezel, { mask: true });
    const mask = `url(${maps.mask})`;
    const ls = this.layer.style;
    ls.maskImage = ls.webkitMaskImage = mask;
    ls.maskSize = ls.webkitMaskSize = "100% 100%";
    ls.backgroundImage = `url(${maps.specular})`;
    if (supportsRefraction2) {
      this.filter ??= createFilter(this.id);
      updateFilter(this.filter, w, h, maps.displacement, maps.scale, p);
      ls.backdropFilter = `url(#${this.id})`;
    } else {
      ls.backdropFilter = cssBackdrop(p);
      ls.setProperty("-webkit-backdrop-filter", cssBackdrop(p));
      this.cpu ??= new CpuRefraction(this.el);
      this.cpu.render(maps.raw, w, h, p.dispersion, maps.mask);
    }
  }
  destroy() {
    cancelAnimationFrame(this.frame);
    this.filter?.remove();
    this.cpu?.destroy();
    this.layer.remove();
    this.el.classList.remove("ag-glass", "ag-field");
  }
}
// src/core/index.ts
function glass2(node, options = {}) {
  const g = new Glass2(node, options);
  return {
    glass: g,
    update(next = {}) {
      if (next.variant)
        g.setVariant(next.variant);
      if (next.params)
        g.setParams(next.params);
      if (next.tone)
        g.setTone(next.tone);
    },
    destroy() {
      g.destroy();
    }
  };
}

export { VARIANTS2, resolveParams2, roundedRect2, smoothMin2, refractOffset2, rimProfile2, supportsRefraction2, registerBackdrop2, backdropChanged2, luminanceAt2, refresh2, Glass2, GlassField2, glass2 };

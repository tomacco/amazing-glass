import type { GlassParams } from './params';
import { bezelWidth, rimProfile, roundedRect, type ShapeSample } from './optics';

/** Everything the renderer needs for one shape at one size. */
export interface GlassMaps {
  /** Displacement map as a data URL: R = x shift, G = y shift, 128 = none. */
  displacement: string;
  /** Rim highlight as a data URL, painted over the glass. */
  specular: string;
  /** Optional outline mask as a data URL (fields only). */
  mask?: string;
  /** Pixel shift represented by a full channel swing, for feDisplacementMap's `scale`. */
  scale: number;
  /** Raw offsets for the CPU fallback. */
  raw: RawOffsets;
}

export interface RawOffsets {
  id: string;
  width: number;
  height: number;
  /** Map pixels per CSS pixel. */
  q: number;
  dx: Float32Array;
  dy: Float32Array;
}

export type Sampler = (px: number, py: number) => ShapeSample;

/** Raw map pixels before encoding. */
export interface MapPixels {
  displacement: ImageData;
  specular: ImageData;
  mask?: ImageData;
  /** Map pixels per CSS pixel for the displacement map, and for specular and mask. */
  q: number;
  dpr: number;
  scale: number;
}

export interface MapOptions {
  draft?: boolean;
  mask?: boolean;
  /** Mark displacement pixels outside the shape as transparent, so the map can be stamped. */
  sprite?: boolean;
  /** Override the displacement scale, so separately computed pieces share one encoding. */
  scale?: number;
  /** Override resolutions: displacement pixels and specular pixels per CSS pixel. */
  q?: number;
  dpr?: number;
}

/** Displacement scale for a rim width and material: the pixel shift of a full channel swing. */
export function displacementScale(w: number, h: number, p: GlassParams, bezelPx: number) {
  const profile = rimProfile(bezelPx, bezelPx * p.depth, p.ior);
  const zoom = p.zoom || 1;
  return Math.max(1, (profile.max + (1 - 1 / zoom) * Math.max(w, h) / 2) * 2.1);
}

/**
 * The per-pixel shading of the material, shared by full renders and the partial updates of
 * GlassField. Positions are in CSS pixels; `d` is the signed distance (negative inside).
 */
export function shaders(p: GlassParams, bezelPx: number, scale: number, w: number, h: number) {
  const profile = rimProfile(bezelPx, bezelPx * p.depth, p.ior);
  const zoom = p.zoom || 1;
  const la = (p.light * Math.PI) / 180, lx = Math.cos(la), ly = Math.sin(la);
  return {
    /** Displacement as a packed little-endian RGBA word (R = x, G = y, 128 = none). */
    displacement(d: number, nx: number, ny: number, px: number, py: number, sprite = false): number {
      const off = profile.at(-d);
      let ox = -nx * off, oy = -ny * off;
      if (zoom !== 1 && d < 0) { ox -= (px - w / 2) * (1 - 1 / zoom); oy -= (py - h / 2) * (1 - 1 / zoom); }
      const r = clamp255(128 + (ox / scale) * 255), g = clamp255(128 + (oy / scale) * 255);
      return ((sprite && d > 0.5 ? 0 : 255) << 24 | 128 << 16 | g << 8 | r) >>> 0;
    },
    /** Rim light and inner shade as a packed RGBA word, at `dpr` pixels per CSS pixel. */
    specular(d: number, nx: number, ny: number, dpr: number): number {
      const depth = -d * dpr;
      if (depth <= -1) return 0;
      const rim = p.rimWidth * dpr, glow = bezelPx * 0.55 * dpr;
      const facing = nx * lx + ny * ly;
      const lit = Math.pow(Math.max(0, facing), 1.6);
      const back = Math.pow(Math.max(0, -facing), 2.2) * 0.55;
      const aa = Math.min(1, depth + 1);
      const line = Math.exp(-Math.pow(depth / rim, 2)) * (0.22 + 0.78 * (lit + back));
      const soft = Math.exp(-depth / glow) * 0.22 * (lit + back * 0.6);
      const a = Math.min(1, (line + soft) * aa * p.rim);
      const shade = Math.exp(-Math.pow((depth - rim * 1.6) / (rim * 0.9), 2)) * p.shade * aa * (1 - lit);
      const v = shade > a ? 0 : 255;
      return (clamp255(Math.max(a, shade) * 255) << 24 | v << 16 | v << 8 | v) >>> 0;
    },
    /** Outline coverage as a packed RGBA word (alpha only). */
    mask(d: number, dpr: number): number {
      return (clamp255(Math.min(1, Math.max(0, -d * dpr + 0.5)) * 255) << 24) >>> 0;
    },
  };
}

const clamp255 = (v: number) => (v <= 0 ? 0 : v >= 255 ? 255 : Math.round(v));

/**
 * Computes the displacement, specular and (optionally) mask pixels for any shape given as a
 * signed-distance sampler in CSS pixels, with (0, 0) at the top-left of the area.
 */
export function computeMaps(w: number, h: number, sample: Sampler, p: GlassParams, bezelPx: number, opts: MapOptions = {}): MapPixels {
  const scale = opts.scale ?? displacementScale(w, h, p, bezelPx);
  const sh = shaders(p, bezelPx, scale, w, h);
  // Displacement: smooth, so one sample per CSS pixel is plenty (half in draft).
  const q = opts.q ?? (opts.draft ? 0.5 : 1);
  const dw = Math.max(1, Math.ceil(w * q)), dh = Math.max(1, Math.ceil(h * q));
  const D = new ImageData(dw, dh), d32 = new Uint32Array(D.data.buffer);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const px = (x + 0.5) / q, py = (y + 0.5) / q;
    const s = sample(px, py);
    d32[y * dw + x] = sh.displacement(s.d, s.nx, s.ny, px, py, opts.sprite);
  }
  // Specular and mask: device resolution so the rim line stays crisp.
  const dpr = opts.dpr ?? (opts.draft ? 1 : Math.min(2, globalThis.devicePixelRatio || 1));
  const sw = Math.ceil(w * dpr), shh = Math.ceil(h * dpr);
  const S = new ImageData(sw, shh), s32 = new Uint32Array(S.data.buffer);
  const M = opts.mask ? new ImageData(sw, shh) : undefined, m32 = M && new Uint32Array(M.data.buffer);
  for (let y = 0; y < shh; y++) for (let x = 0; x < sw; x++) {
    const s = sample((x + 0.5) / dpr, (y + 0.5) / dpr), i = y * sw + x;
    s32[i] = sh.specular(s.d, s.nx, s.ny, dpr);
    if (m32) m32[i] = sh.mask(s.d, dpr);
  }
  return { displacement: D, specular: S, mask: M, q, dpr, scale };
}

/** Raw offsets for the CPU fallback, decoded from a displacement map. */
export function rawOffsets(id: string, img: ImageData, q: number, scale: number): RawOffsets {
  const n = img.width * img.height, dx = new Float32Array(n), dy = new Float32Array(n), d = img.data;
  for (let i = 0; i < n; i++) { dx[i] = ((d[i * 4] - 128) / 255) * scale; dy[i] = ((d[i * 4 + 1] - 128) / 255) * scale; }
  return { id, width: img.width, height: img.height, q, dx, dy };
}

/** Encode pixels as a PNG data URL. data: URLs are usable at once; blob: URLs load async. */
export function pngUrl(img: ImageData) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  c.getContext('2d')!.putImageData(img, 0, 0);
  return c.toDataURL();
}

/**
 * Computes and encodes the maps as data URLs. For shapes that are built once and cached:
 * a data URL never needs releasing.
 */
export function drawMaps(
  id: string, w: number, h: number, sample: Sampler, p: GlassParams, bezelPx: number,
  opts: { draft?: boolean; mask?: boolean } = {},
): GlassMaps {
  const m = computeMaps(w, h, sample, p, bezelPx, opts);
  return {
    displacement: pngUrl(m.displacement),
    specular: pngUrl(m.specular),
    mask: m.mask && pngUrl(m.mask),
    scale: m.scale,
    raw: rawOffsets(id, m.displacement, m.q, m.scale),
  };
}

const cache = new Map<string, GlassMaps>();

/** Maps for a rounded rectangle, cached by size and parameters. */
export function roundedRectMaps(w: number, h: number, radius: number, p: GlassParams, draft = false): GlassMaps {
  const key = JSON.stringify([w, h, radius, draft, p.bezel, p.maxBezel, p.depth, p.ior, p.zoom, p.rim, p.rimWidth, p.shade, p.light]);
  const hit = cache.get(key);
  if (hit) return hit;
  const r = Math.min(radius, w / 2, h / 2);
  const maps = drawMaps(key, w, h, (px, py) => roundedRect(px - w / 2, py - h / 2, w / 2, h / 2, r), p, bezelWidth(w, h, p.bezel, p.maxBezel), { draft });
  if (cache.size > 200) cache.clear();
  cache.set(key, maps);
  return maps;
}

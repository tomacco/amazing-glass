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

type Sampler = (px: number, py: number) => ShapeSample;

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  return { c, ctx, img: ctx.createImageData(w, h) };
}

/**
 * Draws the displacement and specular maps for any shape described by a signed-distance
 * sampler in CSS pixels, with (0, 0) at the top-left of the element.
 */
export function drawMaps(
  id: string, w: number, h: number, sample: Sampler, p: GlassParams, bezelPx: number,
  opts: { draft?: boolean; mask?: boolean } = {},
): GlassMaps {
  const thickness = bezelPx * p.depth;
  const profile = rimProfile(bezelPx, thickness, p.ior);
  const zoom = p.zoom || 1;
  const zoomMax = (1 - 1 / zoom) * Math.max(w, h) / 2;
  const scale = Math.max(1, (profile.max + zoomMax) * 2.1);

  // Displacement: smooth, so one sample per CSS pixel is plenty (half in draft).
  const q = opts.draft ? 0.5 : 1;
  const dw = Math.max(1, Math.ceil(w * q)), dh = Math.max(1, Math.ceil(h * q));
  const D = canvas(dw, dh), dd = D.img.data;
  const dx = new Float32Array(dw * dh), dy = new Float32Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const px = (x + 0.5) / q, py = (y + 0.5) / q;
      const { d, nx, ny } = sample(px, py);
      const off = profile.at(-d);
      let ox = -nx * off, oy = -ny * off;
      if (zoom !== 1 && d < 0) { ox -= (px - w / 2) * (1 - 1 / zoom); oy -= (py - h / 2) * (1 - 1 / zoom); }
      const i = y * dw + x, k = i * 4;
      dx[i] = ox; dy[i] = oy;
      dd[k] = 128 + (ox / scale) * 255;
      dd[k + 1] = 128 + (oy / scale) * 255;
      dd[k + 2] = 128;
      dd[k + 3] = 255;
    }
  }
  D.ctx.putImageData(D.img, 0, 0);

  // Specular: device resolution so the rim line stays crisp. Light hits the rim facing it,
  // and weaker on the far side where it leaves the slab.
  const dpr = opts.draft ? 1 : Math.min(2, globalThis.devicePixelRatio || 1);
  const sw = Math.ceil(w * dpr), sh = Math.ceil(h * dpr);
  const S = canvas(sw, sh), sd = S.img.data;
  const M = opts.mask ? canvas(sw, sh) : null;
  const la = (p.light * Math.PI) / 180, lx = Math.cos(la), ly = Math.sin(la);
  const rim = p.rimWidth * dpr, glow = bezelPx * 0.55 * dpr;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const { d, nx, ny } = sample((x + 0.5) / dpr, (y + 0.5) / dpr);
      const depth = -d * dpr, k = (y * sw + x) * 4;
      if (M) M.img.data[k + 3] = Math.min(1, Math.max(0, depth + 0.5)) * 255;
      if (depth <= -1) continue;
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
  if (M) M.ctx.putImageData(M.img, 0, 0);

  return {
    displacement: D.c.toDataURL(),
    specular: S.c.toDataURL(),
    mask: M?.c.toDataURL(),
    scale,
    raw: { id, width: dw, height: dh, q, dx, dy },
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

import type { GlassParams } from './params';

const SVG = 'http://www.w3.org/2000/svg';

/**
 * Only Chromium runs SVG filters inside `backdrop-filter`, which is what real refraction needs.
 * Add `?ag-fallback` to a URL to force the fallback path for testing.
 */
export const supportsRefraction: boolean = (() => {
  if (typeof navigator === 'undefined') return false;
  if (typeof location !== 'undefined' && location.search.includes('ag-fallback')) return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands ?? [];
  return brands.some(b => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand));
})();

let defs: SVGDefsElement | null = null;
function root(): SVGDefsElement {
  if (defs?.isConnected) return defs;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  defs = document.createElementNS(SVG, 'defs');
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return defs;
}

/**
 * The filter chain: frost, then displace the backdrop once per colour channel (the three
 * strengths give dispersion), recombine, then saturation and luminosity.
 */
export function createFilter(id: string): SVGFilterElement {
  const f = document.createElementNS(SVG, 'filter');
  f.id = id;
  f.setAttribute('filterUnits', 'userSpaceOnUse');
  f.setAttribute('primitiveUnits', 'userSpaceOnUse');
  f.setAttribute('color-interpolation-filters', 'sRGB');
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

export function updateFilter(f: SVGFilterElement, w: number, h: number, map: string, scale: number, p: GlassParams) {
  const [blur, img, dr, dg, db, , , , , , sat, lumen] = Array.from(f.children);
  const box = { x: '0', y: '0', width: String(w), height: String(h) };
  for (const [k, v] of Object.entries(box)) { f.setAttribute(k, v); img.setAttribute(k, v); }
  blur.setAttribute('stdDeviation', String(p.blur));
  img.setAttribute('href', map);
  dr.setAttribute('scale', String(scale * (1 + p.dispersion)));
  dg.setAttribute('scale', String(scale));
  db.setAttribute('scale', String(scale * (1 - p.dispersion)));
  sat.setAttribute('values', String(p.saturate));
  // Brightness, then contrast around mid grey, with the same meaning as the CSS functions.
  for (const fn of Array.from(lumen.children)) {
    fn.setAttribute('slope', String(p.lum * p.contrast));
    fn.setAttribute('intercept', String(0.5 * (1 - p.contrast)));
  }
}

/** The CSS-only approximation for browsers without SVG backdrop filters. */
export const cssBackdrop = (p: GlassParams) =>
  `blur(${Math.max(p.blur * 1.2, 1)}px) saturate(${p.saturate}) brightness(${p.lum}) contrast(${p.contrast})`;

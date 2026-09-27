import type { RawOffsets } from './maps';
import { canvasBehind } from './backdrop';

// CPU refraction for browsers without SVG backdrop filters. Works only where the pixels
// are readable: glass over a registered canvas. The result is drawn into a canvas behind
// the frost layer, so the browser's own backdrop blur still adds the frost on top.

export class CpuRefraction {
  private out?: HTMLCanvasElement;
  private memo = '';

  constructor(private host: HTMLElement) {}

  render(raw: RawOffsets, w: number, h: number, dispersion: number, mask?: string) {
    const src = canvasBehind(this.host);
    if (!src) { if (this.out) this.out.hidden = true; return; }
    if (!this.out) {
      this.out = document.createElement('canvas');
      this.out.className = 'ag-cpu';
      this.out.setAttribute('aria-hidden', 'true');
      this.host.prepend(this.out);
    }
    this.out.hidden = false;
    if (mask) {
      this.out.style.maskImage = this.out.style.webkitMaskImage = `url(${mask})`;
      this.out.style.maskSize = this.out.style.webkitMaskSize = '100% 100%';
    }
    const W = Math.round(w), H = Math.round(h);
    const ox = src.rect.left - src.canvasRect.left, oy = src.rect.top - src.canvasRect.top;
    const memo = `${W}|${H}|${Math.round(ox)}|${Math.round(oy)}|${src.source.version}|${raw.id}`;
    if (memo === this.memo) return;
    this.memo = memo;
    if (this.out.width !== W || this.out.height !== H) { this.out.width = W; this.out.height = H; }

    const img = src.pixels, sd = img.data, SW = img.width, SH = img.height;
    const sx = SW / src.canvasRect.width, sy = SH / src.canvasRect.height;
    const canvasW = src.canvasRect.width, canvasH = src.canvasRect.height;
    const ctx = this.out.getContext('2d')!;
    const out = ctx.createImageData(W, H), od = out.data;
    for (let y = 0; y < H; y++) {
      const my = Math.min(raw.height - 1, Math.floor(y * raw.q));
      for (let x = 0; x < W; x++) {
        const o = (y * W + x) * 4;
        // Parts of the glass beyond the canvas stay transparent: the page shows through there.
        if (ox + x < 0 || oy + y < 0 || ox + x >= canvasW || oy + y >= canvasH) { od[o + 3] = 0; continue; }
        const mi = my * raw.width + Math.min(raw.width - 1, Math.floor(x * raw.q));
        const dx = raw.dx[mi], dy = raw.dy[mi];
        for (let ch = 0; ch < 3; ch++) {
          const f = 1 + (1 - ch) * dispersion; // red bends most, blue least
          const px = Math.min(SW - 1, Math.max(0, Math.round((ox + x + dx * f) * sx)));
          const py = Math.min(SH - 1, Math.max(0, Math.round((oy + y + dy * f) * sy)));
          od[o + ch] = sd[(py * SW + px) * 4 + ch];
        }
        od[o + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  destroy() { this.out?.remove(); }
}

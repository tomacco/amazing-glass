import type { GlassParams } from './params';
import { bezelWidth, type Box } from './optics';

// Experimental GPU renderer for GlassField.
//
// The SVG filter path can bend any page content but has to rebuild and re-encode images on
// the CPU every time the shapes move. When the content behind the glass is a canvas the page
// draws itself, a single WebGL2 fragment shader can do everything on the GPU: merge the
// shapes, refract the canvas, add dispersion, frost, tint and rim light. In the lab benchmark
// (lab/gpu-bench.html) that took main-thread time from ~15 ms to ~0.05 ms per frame.
//
// Limits: it only sees the backdrop canvas, not DOM content above it. Draw into the canvas
// whatever should bend (the demo draws its headline there).

const MAX_SHAPES = 16;

const VERT = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D backdrop;
uniform vec2 size;          // overlay size, CSS px
uniform float dpr;
uniform vec4 bd;            // backdrop rect relative to overlay: x, y, w, h (CSS px)
uniform vec4 boxes[${MAX_SHAPES}];   // x, y, w, h
uniform float radii[${MAX_SHAPES}];
uniform int count;
uniform float k, bezelW, thick, ior, disp, frost, sat, lum, contrast, rimK, rimW, shadeK, light;
uniform vec4 tint;          // rgb + alpha
out vec4 o;

float box(vec2 q, vec4 b, float r) {
  vec2 d = abs(q - b.xy) - (b.zw * 0.5 - r);
  return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - r;
}
float field(vec2 q) {
  float d = 1e9;
  for (int i = 0; i < ${MAX_SHAPES}; i++) {
    if (i >= count) break;
    float b = box(q, boxes[i], radii[i]);
    float h = max(k - abs(d - b), 0.) / k;
    d = min(d, b) - h * h * k * 0.25;
  }
  return d;
}
float rimH(float t) { return pow(1. - pow(1. - t, 4.), 0.25); }
float refr(float t) {
  if (t >= 1.) return 0.;
  float e = 0.001, t0 = max(t, e), t1 = min(t0 + e, 1.);
  float slope = (rimH(t1) - rimH(t0)) / e * thick / bezelW;
  float inc = atan(slope), rf = asin(sin(inc) / ior);
  return thick * tan(inc - rf);
}
vec3 look(vec2 q) {
  vec2 uv = (q - bd.xy) / bd.zw;
  return textureLod(backdrop, vec2(uv.x, 1. - uv.y), frost).rgb;
}
vec3 grade(vec3 c) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, sat) * lum;
  return (c - 0.5) * contrast + 0.5;
}
void main() {
  vec2 q = vec2(gl_FragCoord.x, size.y * dpr - gl_FragCoord.y) / dpr;
  float d = field(q);
  if (d > 1.5) { o = vec4(0.); return; }
  vec2 g = vec2(field(q + vec2(.5, 0.)) - field(q - vec2(.5, 0.)), field(q + vec2(0., .5)) - field(q - vec2(0., .5)));
  vec2 n = g / max(length(g), 1e-6);
  float depth = -d;
  vec2 sh = -n * refr(clamp(depth / bezelW, 0., 1.));
  vec3 c = vec3(look(q + sh * (1. + disp)).r, look(q + sh).g, look(q + sh * (1. - disp)).b);
  c = grade(c);
  c = mix(c, tint.rgb, tint.a);
  vec2 L = vec2(cos(radians(light)), sin(radians(light)));
  float facing = dot(n, L), lit = pow(max(0., facing), 1.6), back = pow(max(0., -facing), 2.2) * 0.55;
  float dd = depth * dpr, rw = rimW * dpr, glow = bezelW * 0.55 * dpr, aa = clamp(dd + 1., 0., 1.);
  float line = exp(-pow(dd / rw, 2.)) * (0.22 + 0.78 * (lit + back));
  float soft = exp(-dd / glow) * 0.22 * (lit + back * 0.6);
  float a = min(1., (line + soft) * aa * rimK);
  float shade = exp(-pow((dd - rw * 1.6) / (rw * 0.9), 2.)) * shadeK * aa * (1. - lit);
  c = mix(c, vec3(1.), a);
  c = mix(c, vec3(0.), shade);
  float cover = clamp(depth * dpr + 0.5, 0., 1.);
  o = vec4(c * cover, cover);   // premultiplied
}`;

export function webgl2Available(): boolean {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export class FieldGL {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private tex: WebGLTexture;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private lost = false;

  constructor(private host: HTMLElement, private backdrop: HTMLCanvasElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ag-gl';
    this.canvas.setAttribute('aria-hidden', 'true');
    host.prepend(this.canvas);
    const gl = this.canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['backdrop', 'size', 'dpr', 'bd', 'boxes', 'radii', 'count', 'k', 'bezelW', 'thick', 'ior', 'disp', 'frost', 'sat', 'lum', 'contrast', 'rimK', 'rimW', 'shadeK', 'light', 'tint']) this.u[n] = gl.getUniformLocation(prog, n);
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; });
  }

  /** Draw shapes given in the host's CSS pixel coordinates. */
  draw(shapes: Box[], p: GlassParams, merge: number, tint: [number, number, number, number]) {
    if (this.lost) return;
    const gl = this.gl, host = this.host;
    const w = host.clientWidth, h = host.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (!w || !h) return;
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (this.canvas.width !== cw || this.canvas.height !== ch) { this.canvas.width = cw; this.canvas.height = ch; }
    const hr = host.getBoundingClientRect(), br = this.backdrop.getBoundingClientRect();
    // Backdrop pixels, re-uploaded each frame: the page may have repainted it.
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.backdrop);
    // Mipmaps only when there is frost to sample from; otherwise plain linear filtering.
    // (A mipmap filter without mipmaps leaves the texture incomplete and it samples black.)
    if (p.blur > 0.5) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const n = Math.min(MAX_SHAPES, shapes.length);
    const boxes = new Float32Array(MAX_SHAPES * 4), radii = new Float32Array(MAX_SHAPES);
    for (let i = 0; i < n; i++) { const s = shapes[i]; boxes.set([s.x, s.y, s.w, s.h], i * 4); radii[i] = Math.min(s.r, s.w / 2, s.h / 2); }
    const minSide = Math.min(...shapes.slice(0, n).map(s => Math.min(s.w, s.h)));
    const bz = bezelWidth(minSide, minSide, p.bezel, p.maxBezel);
    const texelPerCss = this.backdrop.width / Math.max(1, br.width);
    const U = this.u;
    gl.uniform1i(U.backdrop, 0);
    gl.uniform2f(U.size, w, h);
    gl.uniform1f(U.dpr, dpr);
    gl.uniform4f(U.bd, br.left - hr.left, br.top - hr.top, br.width, br.height);
    gl.uniform4fv(U.boxes, boxes);
    gl.uniform1fv(U.radii, radii);
    gl.uniform1i(U.count, n);
    gl.uniform1f(U.k, Math.max(0.001, merge));
    gl.uniform1f(U.bezelW, bz);
    gl.uniform1f(U.thick, bz * p.depth);
    gl.uniform1f(U.ior, p.ior);
    gl.uniform1f(U.disp, p.dispersion);
    // Frost: a mip level whose texel size roughly matches the blur radius.
    gl.uniform1f(U.frost, p.blur > 0.5 ? Math.max(0, Math.log2(p.blur * texelPerCss)) : 0);
    gl.uniform1f(U.sat, p.saturate);
    gl.uniform1f(U.lum, p.lum);
    gl.uniform1f(U.contrast, p.contrast);
    gl.uniform1f(U.rimK, p.rim);
    gl.uniform1f(U.rimW, p.rimWidth);
    gl.uniform1f(U.shadeK, p.shade);
    gl.uniform1f(U.light, p.light);
    gl.uniform4f(U.tint, tint[0], tint[1], tint[2], tint[3]);
    gl.viewport(0, 0, cw, ch);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.canvas.remove();
  }
}

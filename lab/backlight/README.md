# Backlight

Research preview. Not approved for production.

Glass lit from behind, after the Light and Space artists: Larry Bell's coated glass, James
Turrell's light rooms. One diffused light sits under every glass shape on the page. The cursor
or a finger suggests a direction; the light takes 60 % of the offset from the centre and gets
there on a critically damped spring (omega 1.0 rad/s, about 4 s to settle within 10 %).

Run it:

```
bun run build lib
bun tools/serve.ts 5191
open http://localhost:5191/lab/backlight/
```

Query parameters: `?mode=both|backdrop|rim|param`, `?light=0.3,0.5` parks the light at viewport
fractions (for screenshots), `?omega=1.5` changes the spring, `?ag-fallback` forces the CPU path.
`blStats()` in the console returns frame cost. `blAudioBench(30)` times the sound graph.

## What was tried

| Mode | How | Result |
|---|---|---|
| `backdrop` | The light is a radial gradient painted into a canvas registered with `registerBackdrop()`. The existing refraction bends it at the rim. | The rim does not glow. Refraction moves pixels; it cannot make them brighter than the brightest pixel nearby. Next to the light, the rim peaks at 225 on a 0 to 255 scale against 213 just inside, and most of that 12 is the library's own rim highlight. |
| `rim` | A canvas above the page draws each shape's outline. Brightness per point comes from the distance to the light and the angle between the rim normal and the light path. A blurred copy below the glass gives a halo. | The edge reads as lit. Same spot, measured in `both`: 238 at the rim, 199 in the halo just outside against 157 with the backdrop alone. Shapes far from the light stay dim, which is what sells it. |
| `both` | `backdrop` plus `rim`. | The best of the four. The pool under the glass gives the room; the rim gives the edge. This is the default. |
| `param` | Per instance, `glass.setParams({ light, rim })` aims the existing specular highlight at the light, quantised to 10 degrees and 0.2 rim steps so maps get reused. | The crispest line, since it is the real rim profile. No halo, no distance falloff along an edge, and every new angle rebuilds the maps: 11.1 ms p95 and 24.9 ms worst frame. Only works on elements that expose `.glass`. |

The WebGL GlassField renderer was not tried. Its shader takes one global `light` angle; a point
light would be a uniform and four lines there, but only for fields over a canvas the page draws.

## Can real components be backlit?

Yes, in `rim` and `both`. The overlay only needs a box and a border radius, so it lights
`ag-glass`, `ag-button`, the `ag-switch` track and knob, and the `ag-slider` thumb. The switch
track is not glass: there it is painted light on an opaque pill, and it looks it.
`param` reaches only `ag-glass` and `ag-button`. Switch and slider keep their lens private.

## Cost per frame

Chrome headless shell 1223 (Playwright build) on an Apple Silicon Mac, macOS 27, 1280 by 800 at
2x, `--use-angle=metal`, light moving under a scripted cursor, 240 frames. JavaScript time
inside the animation frame, including Glass map rebuilds where they happen:

| Mode | Mean | p95 | Worst |
|---|---|---|---|
| `backdrop` | 0.06 ms | 0.2 ms | 0.2 ms |
| `rim` | 0.44 ms | 0.6 ms | 0.8 ms |
| `both` | 0.41 ms | 0.6 ms | 0.7 ms |
| `param` | 1.23 ms | 11.1 ms | 24.9 ms |
| `both`, `?ag-fallback` | 0.52 ms | 0.7 ms | 2.7 ms |

All five held 118 to 120 frames per second, but that is a headless rate. The GPU cost of rerunning
every SVG backdrop filter each frame is not in these numbers. Desktop Chrome with its compositor
was not measured: this Mac's managed Chrome blocks the DevTools protocol.

## Browsers

- Chromium: everything, refraction through the SVG filter.
- Safari and Firefox: not tested. The backdrop is a registered canvas, so the CPU fallback
  refracts it; the page re-reads the canvas 4 times a second to keep that cheap, so the light
  under the glass steps while the overlay moves smoothly. `?ag-fallback` in Chrome stands in
  for it above. The rim overlay is plain 2D canvas and CSS blur, so it should run there.
- Touch: a finger suggests the direction, same as the cursor. Checked with emulated touch at
  390 by 844.
- `prefers-reduced-motion: reduce` parks the light at (0.38, 0.42) and ignores the pointer.

## Sound

Web Audio only, generated in code: no files, no samples. Off by default, behind the "Sound off"
button, because browsers block audio before a gesture. It stays off under reduced motion too.

- Pad: open fifths on A (55, 82, 110, 165 Hz) plus an added ninth, each a sine and a triangle
  detuned by 11 cents, each breathing on its own LFO between 0.03 and 0.11 Hz.
- Lowpass: the cutoff follows the eased light from left (240 Hz) to right (2,200 Hz). Two upper
  voices fade in as the light rises. The light is slow, so the sound is slow.
- Room: two cross-fed delays (0.41 s and 0.67 s, feedback 0.46 and 0.42) with a 2,200 Hz
  lowpass in the loop. A faint band of noise rides in the room as air.
- Pings: three sine partials at the ratios of a free glass bar (1, 2.756, 5.404), 3.6 s decay,
  A major pentatonic. They play when the light crosses a glass edge, the switch toggles or the
  slider moves.
- Level: master gain 0.12, faded in with a 1.2 s time constant and out with 0.7 s.

Cost: rendering 30 s of the graph offline, with a ping every 2 s, took 391 and 395 ms in two runs.
That is 1.3 % of one core, on the audio thread. The light only touches the graph 10 times a second.

## What production would need

1. A per-instance point light in `shaders().specular()` in `src/core/maps.ts`: a light position
   and height in place of the single angle, with distance falloff. About 10 lines, gated behind a
   new optional param so the fitted presets stay valid.
2. Make the rim line a separate layer, so a moving light repaints one small image or a CSS
   gradient and the displacement map stays cached. Today `light` sits in the map cache key,
   which is why `param` costs 11 ms at p95.
3. A shared light source object (`setBacklight({ x, y })`) that every Glass reads, so lens
   knobs inside switch and slider take part.
4. An entry in `FEATURES` as experimental, with what was checked.

None of these are in this branch. The lab touches nothing under `src/`.

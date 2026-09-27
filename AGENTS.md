# AGENTS.md

Instructions for AI coding agents using or changing amazing-glass. Humans are welcome too.

## Using the library in someone's app

- Load `amazing-glass/styles.css` once. Without it the elements render unstyled.
- Plain HTML or any framework: `import 'amazing-glass'` defines every `<ag-*>` element.
- React: `import { Switch } from 'amazing-glass/react'`. Handlers are `(value, event) => void`.
- Vue: `import { Switch } from 'amazing-glass/vue'`. Stateful components support `v-model`.
- Glass on an arbitrary element: `new Glass(el, { variant })` from `amazing-glass/core`,
  `useGlass(ref)` in React, `v-glass` in Vue.
- Full reference: `docs/API.md`. It is generated; trust it over memory.

## Rules that break glass if you ignore them

1. Glass needs something behind it. Over a flat colour it looks like a plain tinted box.
   Put it over imagery, gradients or content.
2. No ancestor of a glass element may have `opacity < 1`, `filter`, `mask`, `clip-path`,
   `mix-blend-mode` or `backdrop-filter`. Any of those hides the backdrop from the glass.
   Animate `transform` instead of `opacity` on containers.
3. Refraction over DOM needs Chromium. Safari and Firefox fall back to frost, tint and rim.
   Do not promise refraction in those browsers unless the backdrop is a canvas registered
   with `registerBackdrop(canvas)`.
4. Icon-only buttons need `aria-label`.
5. `<ag-sheet>` positions itself inside its nearest positioned ancestor. Give that ancestor
   `position: relative` and `overflow: hidden`.

## Changing the library

- Stack: TypeScript, Bun for build and tests, no runtime dependencies.
- `bun run build` builds `dist/`, `site/` and `docs/API.md`. `bun test` runs the optics tests.
  `bun run typecheck` must pass.
- The physics lives in `src/core/optics.ts` and has tests. Change it and the fitted presets
  in `src/core/params.ts` are no longer valid: rerun the lab (see `lab/README.md`) and put the
  new numbers in both places.
- Component reference text lives in `apps/guide/api.ts`. Edit there, never in `docs/API.md`.
- Visual changes need a screenshot check. `node tools/shoot.mjs <url> <out.png> [w] [h]`
  drives headless Chrome, including real pointer input.
- Base glass CSS uses `:where()` for zero specificity. Keep it that way, or component layout
  rules (for example the sheet's `position: absolute`) start losing.
- Writing any text for this repo: follow `docs/VOICE.md`. No em dashes.

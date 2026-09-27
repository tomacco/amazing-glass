# API reference

Generated from `apps/guide/api.ts` by `bun run build`. Do not edit by hand.

Every element is also available as a React component (`amazing-glass/react`) and a Vue component (`amazing-glass/vue`) with the same props. In React, handlers receive the new value first: `onChange={(value, event) => …}`. In Vue, stateful components support `v-model`.

## Material parameters

Pass as `params` (JSON attribute or prop) or call `glass.setParams({...})`.

| Name | Unit |  | What it does |
|---|---|---|---|
| `blur` | px |  | Frost radius. |
| `saturate` | factor |  | Backdrop saturation, 1 = unchanged. |
| `lum` | factor |  | Brightness before contrast. |
| `contrast` | factor |  | Contrast around mid grey; below 1 flattens. |
| `bezel` | 0 to 1 |  | Rim width as a fraction of the short side. |
| `maxBezel` | px |  | Upper limit for the rim width. |
| `depth` | factor |  | Thickness relative to the rim. Thicker glass bends more. |
| `ior` | index |  | Index of refraction. 1.5 is window glass. |
| `dispersion` | 0 to 0.4 |  | Rainbow at the edge: red bends more, blue less. |
| `zoom` | factor |  | Magnifies the flat middle. Lens knobs use 1.08. |
| `rim / rimWidth` | factor / px |  | Strength and width of the specular rim. |
| `shade` | 0 to 1 |  | Thin dark line inside the rim. |
| `light` | degrees |  | Where the light comes from. -135 is top left. |

## `<ag-glass>`

React / Vue: `Glass`

A glass surface for your own content. Children are left alone; the element adds one refraction layer.

```html
<ag-glass variant="clear" style="padding:24px;border-radius:32px">Anything</ag-glass>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | "regular" \| "clear" \| "lens" | `"regular"` | Material preset. Regular frosts for legibility; clear shows more of the content; lens is the magnifying knob glass. |
| `tint` | CSS colour |  | Stained glass: the colour lives in the material. |
| `tone` | "auto" \| "light" \| "dark" | `"auto"` | Ink colour. Auto samples the brightness behind the glass. |
| `params` | JSON of GlassParams |  | Fine-tune any material value, for example {"blur":6,"dispersion":0.2}. |
| `dim` | boolean |  | Adds the 35% dark dimming layer the HIG asks for over bright media (clear only). |

### CSS custom properties

| Name | Type | Default | Description |
|---|---|---|---|
| `--ag-radius` | length | `28px` | Corner radius. Any border-radius works too. |

## `<ag-button>`

React / Vue: `Button`

Capsule button that swells and brightens when pressed. Prominent is stained in the accent colour.

```html
<ag-button>Cancel</ag-button>
<ag-button variant="prominent">Done</ag-button>
<ag-button icon="plus" aria-label="Add"></ag-button>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | "glass" \| "prominent" \| "clear" \| "plain" | `"glass"` | Plain has no glass of its own, for use inside a toolbar group. |
| `icon` | icon name |  | Built-in symbol shown before the label. Icon-only buttons need aria-label. |
| `size` | "small" \| "regular" \| "large" | `"regular"` | 36, 48 or 56 px tall. |
| `tint` | CSS colour |  | Stain colour for prominent buttons. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `click` | MouseEvent |  | Also fired by Enter and Space. |

## `<ag-switch>`

React / Vue: `Switch`

The knob is solid at rest and lifts off the track as a glass lens while touched. Tap or drag.

```html
<ag-switch checked></ag-switch>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `checked` | boolean |  | On state. |
| `disabled` | boolean |  | Ignores input. |

### Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `checked` | boolean |  | Read or set the state. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `change` | Event |  | After the state flips. Read event.target.checked. |

### CSS custom properties

| Name | Type | Default | Description |
|---|---|---|---|
| `--ag-switch-on` | colour | `var(--ag-green)` | Track colour when on. |

## `<ag-slider>`

React / Vue: `Slider`

The thumb swells into a lens while dragged so the fill stays visible through it.

```html
<ag-slider value="60" min-icon="sunSmall" max-icon="sun"></ag-slider>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `value` | number | `middle` | Current value. |
| `min / max` | number | `0 / 100` | Range. |
| `step` | number | `0 (continuous)` | Snap interval. |
| `min-icon / max-icon` | icon name |  | Symbols at each end. |
| `disabled` | boolean |  | Ignores input. |

### Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `value` | number |  | Read or set; clamped and snapped. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `input` | Event |  | While moving. |
| `change` | Event |  | On release. |

### CSS custom properties

| Name | Type | Default | Description |
|---|---|---|---|
| `--ag-slider-fill` | colour | `var(--ag-accent)` | Filled part of the track. |

## `<ag-segmented>`

React / Vue: `Segmented`

Tap a segment to jump there with a small liquid stretch, or grab the selection and slide it as a lens.

```html
<ag-segmented options="Day,Week,Month" value="Week"></ag-segmented>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `options` | comma list or JSON array |  | Segment labels. |
| `value` | string |  | Selected label. |

### Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `options` | string[] |  | Set from JS. |
| `value` | string |  | Selected label. |
| `selectedIndex` | number |  | Selected position. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `change` | Event |  | When the user picks a segment. |

## `<ag-tab-bar>`

React / Vue: `TabBar`

Floating tab bar. Drag across it and the selection follows as a lens. Can shrink while content scrolls.

```html
<ag-tab-bar search minimize-on-scroll="#feed"
  items='[{"label":"Home","icon":"house"},{"label":"Library","icon":"note"}]'></ag-tab-bar>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `items` | JSON TabItem[] |  | { label, icon?, value? } per tab. |
| `value` | string | `"0"` | Selected tab value (or index). |
| `search` | boolean |  | Adds the separate search button at the trailing end. |
| `minimize-on-scroll` | CSS selector |  | Scroll container that shrinks the bar on the way down. |

### Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `items` | TabItem[] |  | Set from JS. |
| `value` | string |  | Selected value. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `change` | Event |  | Selected tab changed. |
| `search` | Event |  | Search button pressed. |

## `<ag-menu>`

React / Vue: `Menu`

A button that becomes its menu: one glass surface grows out of the button's corner and shrinks back.

```html
<ag-menu label="More" items='[{"label":"Copy","icon":"copy"},{"separator":true},{"label":"Delete","icon":"trash","destructive":true}]'></ag-menu>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `items` | JSON MenuItem[] |  | { label, icon?, value?, destructive? } or { separator: true }. |
| `icon` | icon name | `"ellipsis"` | Trigger symbol. |
| `label` | string | `"More"` | Accessible name of the trigger. |
| `align` | "end" \| "start" | `"end"` | Grow toward the left (end) or right (start). |

### Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `items` | MenuItem[] |  | Set from JS. |
| `open` | boolean |  | Open or close. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `select` | CustomEvent<string> |  | Item value or label in detail. |
| `open / close` | Event |  | Menu opened or closed. |

### CSS custom properties

| Name | Type | Default | Description |
|---|---|---|---|
| `--ag-menu-width` | length | `250px` | Open width. |

## `<ag-sheet>`

React / Vue: `Sheet`

Bottom sheet inside its positioned parent. Medium floats inset; large goes flush and more opaque.

```html
<ag-sheet detent="medium">Your content</ag-sheet>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `detent` | "closed" \| "medium" \| "large" | `"closed"` | Resting height. |

### Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `detent` | Detent |  | Read or set. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `detentchange` | CustomEvent<Detent> |  | After the user drags or taps the grabber. |

### CSS custom properties

| Name | Type | Default | Description |
|---|---|---|---|
| `--ag-sheet-medium` | length | `46%` | Medium height. |
| `--ag-sheet-radius` | length | `47px` | Corner radius. Make it concentric with the container. |

## `<ag-alert>`

React / Vue: `Alert`

Leading-aligned text and capsule actions side by side. Place it inside your own dialog or overlay.

```html
<ag-alert heading="Delete 3 photos?" message="You can restore them for 30 days."
  actions='[{"label":"Cancel","role":"cancel"},{"label":"Delete","role":"destructive"}]'></ag-alert>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `heading` | string |  | Title. |
| `message` | string |  | Body text. |
| `actions` | JSON AlertAction[] |  | { label, role?: "default" \| "cancel" \| "destructive", value? }. |

### Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `actions` | AlertAction[] |  | Set from JS. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `action` | CustomEvent<string> |  | Pressed action value or label. |

## `<ag-search>`

React / Vue: `Search`

Search field on a glass capsule with the dictation symbol trailing.

```html
<ag-search placeholder="Search"></ag-search>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `placeholder` | string | `"Search"` | Also the accessible name. |
| `value` | string |  | Initial text. |

### Properties

| Name | Type | Default | Description |
|---|---|---|---|
| `value` | string |  | Current text. |

### Events

| Event | Type |  | When |
|---|---|---|---|
| `input / change` | Event |  | From the inner input; they bubble. |

## `<ag-toolbar>`

React / Vue: `Toolbar, ToolbarGroup`

Actions that affect the same thing share one capsule; groups float apart.

```html
<ag-toolbar>
  <ag-toolbar-group><ag-button variant="plain" icon="share" aria-label="Share"></ag-button></ag-toolbar-group>
</ag-toolbar>
```

### Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `spread (toolbar)` | boolean |  | Push groups to the ends. |
| `variant (group)` | "regular" \| "clear" \| "lens" | `"regular"` | Material preset. Regular frosts for legibility; clear shows more of the content; lens is the magnifying knob glass. |
| `tint (group)` | CSS colour |  | Stained glass: the colour lives in the material. |
| `tone (group)` | "auto" \| "light" \| "dark" | `"auto"` | Ink colour. Auto samples the brightness behind the glass. |
| `params (group)` | JSON of GlassParams |  | Fine-tune any material value, for example {"blur":6,"dispersion":0.2}. |
| `dim (group)` | boolean |  | Dimming layer for clear groups over media. |


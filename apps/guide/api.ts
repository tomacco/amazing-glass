// Single source of truth for the component reference. Rendered by the guide and turned into
// docs/API.md by tools/build.ts, so humans and agents read the same thing.

export interface Row { name: string; type: string; default?: string; description: string }
export interface ComponentDoc {
  tag: string;
  react: string;
  summary: string;
  example: string;
  attributes: Row[];
  properties?: Row[];
  events: Row[];
  css?: Row[];
}

const glassAttrs: Row[] = [
  { name: 'variant', type: '"regular" | "clear" | "lens"', default: '"regular"', description: 'Material preset. Regular frosts for legibility; clear shows more of the content; lens is the magnifying knob glass.' },
  { name: 'tint', type: 'CSS colour', description: 'Stained glass: the colour lives in the material.' },
  { name: 'tone', type: '"auto" | "light" | "dark"', default: '"auto"', description: 'Ink colour. Auto samples the brightness behind the glass.' },
  { name: 'params', type: 'JSON of GlassParams', description: 'Fine-tune any material value, for example {"blur":6,"dispersion":0.2}.' },
];

export const COMPONENTS: ComponentDoc[] = [
  {
    tag: 'ag-glass', react: 'Glass',
    summary: 'A glass surface for your own content. Children are left alone; the element adds one refraction layer.',
    example: `<ag-glass variant="clear" style="padding:24px;border-radius:32px">Anything</ag-glass>`,
    attributes: [...glassAttrs, { name: 'dim', type: 'boolean', description: 'Adds the 35% dark dimming layer the HIG asks for over bright media (clear only).' }],
    events: [],
    css: [{ name: '--ag-radius', type: 'length', default: '28px', description: 'Corner radius. Any border-radius works too.' }],
  },
  {
    tag: 'ag-button', react: 'Button',
    summary: 'Capsule button that swells and brightens when pressed. Prominent is stained in the accent colour.',
    example: `<ag-button>Cancel</ag-button>\n<ag-button variant="prominent">Done</ag-button>\n<ag-button icon="plus" aria-label="Add"></ag-button>`,
    attributes: [
      { name: 'variant', type: '"glass" | "prominent" | "clear" | "plain"', default: '"glass"', description: 'Plain has no glass of its own, for use inside a toolbar group.' },
      { name: 'icon', type: 'icon name', description: 'Built-in symbol shown before the label. Icon-only buttons need aria-label.' },
      { name: 'size', type: '"small" | "regular" | "large"', default: '"regular"', description: '36, 48 or 56 px tall.' },
      { name: 'tint', type: 'CSS colour', description: 'Stain colour for prominent buttons.' },
    ],
    events: [{ name: 'click', type: 'MouseEvent', description: 'Also fired by Enter and Space.' }],
  },
  {
    tag: 'ag-switch', react: 'Switch',
    summary: 'The knob is solid at rest and lifts off the track as a glass lens while touched. Tap or drag.',
    example: `<ag-switch checked></ag-switch>`,
    attributes: [{ name: 'checked', type: 'boolean', description: 'On state.' }, { name: 'disabled', type: 'boolean', description: 'Ignores input.' }],
    properties: [{ name: 'checked', type: 'boolean', description: 'Read or set the state.' }],
    events: [{ name: 'change', type: 'Event', description: 'After the state flips. Read event.target.checked.' }],
    css: [{ name: '--ag-switch-on', type: 'colour', default: 'var(--ag-green)', description: 'Track colour when on.' }],
  },
  {
    tag: 'ag-slider', react: 'Slider',
    summary: 'The thumb swells into a lens while dragged so the fill stays visible through it.',
    example: `<ag-slider value="60" min-icon="sunSmall" max-icon="sun"></ag-slider>`,
    attributes: [
      { name: 'value', type: 'number', default: 'middle', description: 'Current value.' },
      { name: 'min / max', type: 'number', default: '0 / 100', description: 'Range.' },
      { name: 'step', type: 'number', default: '0 (continuous)', description: 'Snap interval.' },
      { name: 'min-icon / max-icon', type: 'icon name', description: 'Symbols at each end.' },
      { name: 'disabled', type: 'boolean', description: 'Ignores input.' },
    ],
    properties: [{ name: 'value', type: 'number', description: 'Read or set; clamped and snapped.' }],
    events: [{ name: 'input', type: 'Event', description: 'While moving.' }, { name: 'change', type: 'Event', description: 'On release.' }],
    css: [{ name: '--ag-slider-fill', type: 'colour', default: 'var(--ag-accent)', description: 'Filled part of the track.' }],
  },
  {
    tag: 'ag-segmented', react: 'Segmented',
    summary: 'Tap a segment to jump there with a small liquid stretch, or grab the selection and slide it as a lens.',
    example: `<ag-segmented options="Day,Week,Month" value="Week"></ag-segmented>`,
    attributes: [{ name: 'options', type: 'comma list or JSON array', description: 'Segment labels.' }, { name: 'value', type: 'string', description: 'Selected label.' }],
    properties: [{ name: 'options', type: 'string[]', description: 'Set from JS.' }, { name: 'value', type: 'string', description: 'Selected label.' }, { name: 'selectedIndex', type: 'number', description: 'Selected position.' }],
    events: [{ name: 'change', type: 'Event', description: 'When the user picks a segment.' }],
  },
  {
    tag: 'ag-tab-bar', react: 'TabBar',
    summary: 'Floating tab bar. Drag across it and the selection follows as a lens. Can shrink while content scrolls.',
    example: `<ag-tab-bar search minimize-on-scroll="#feed"\n  items='[{"label":"Home","icon":"house"},{"label":"Library","icon":"note"}]'></ag-tab-bar>`,
    attributes: [
      { name: 'items', type: 'JSON TabItem[]', description: '{ label, icon?, value? } per tab.' },
      { name: 'value', type: 'string', default: '"0"', description: 'Selected tab value (or index).' },
      { name: 'search', type: 'boolean', description: 'Adds the separate search button at the trailing end.' },
      { name: 'minimize-on-scroll', type: 'CSS selector', description: 'Scroll container that shrinks the bar on the way down.' },
    ],
    properties: [{ name: 'items', type: 'TabItem[]', description: 'Set from JS.' }, { name: 'value', type: 'string', description: 'Selected value.' }],
    events: [{ name: 'change', type: 'Event', description: 'Selected tab changed.' }, { name: 'search', type: 'Event', description: 'Search button pressed.' }],
  },
  {
    tag: 'ag-menu', react: 'Menu',
    summary: 'A button that becomes its menu: one glass surface grows out of the button\'s corner and shrinks back.',
    example: `<ag-menu label="More" items='[{"label":"Copy","icon":"copy"},{"separator":true},{"label":"Delete","icon":"trash","destructive":true}]'></ag-menu>`,
    attributes: [
      { name: 'items', type: 'JSON MenuItem[]', description: '{ label, icon?, value?, destructive? } or { separator: true }.' },
      { name: 'icon', type: 'icon name', default: '"ellipsis"', description: 'Trigger symbol.' },
      { name: 'label', type: 'string', default: '"More"', description: 'Accessible name of the trigger.' },
      { name: 'align', type: '"end" | "start"', default: '"end"', description: 'Grow toward the left (end) or right (start).' },
    ],
    properties: [{ name: 'items', type: 'MenuItem[]', description: 'Set from JS.' }, { name: 'open', type: 'boolean', description: 'Open or close.' }],
    events: [{ name: 'select', type: 'CustomEvent<string>', description: 'Item value or label in detail.' }, { name: 'open / close', type: 'Event', description: 'Menu opened or closed.' }],
    css: [{ name: '--ag-menu-width', type: 'length', default: '250px', description: 'Open width.' }],
  },
  {
    tag: 'ag-sheet', react: 'Sheet',
    summary: 'Bottom sheet inside its positioned parent. Medium floats inset; large goes flush and more opaque.',
    example: `<ag-sheet detent="medium">Your content</ag-sheet>`,
    attributes: [{ name: 'detent', type: '"closed" | "medium" | "large"', default: '"closed"', description: 'Resting height.' }],
    properties: [{ name: 'detent', type: 'Detent', description: 'Read or set.' }],
    events: [{ name: 'detentchange', type: 'CustomEvent<Detent>', description: 'After the user drags or taps the grabber.' }],
    css: [{ name: '--ag-sheet-medium', type: 'length', default: '46%', description: 'Medium height.' }, { name: '--ag-sheet-radius', type: 'length', default: '47px', description: 'Corner radius. Make it concentric with the container.' }],
  },
  {
    tag: 'ag-alert', react: 'Alert',
    summary: 'Leading-aligned text and capsule actions side by side. Place it inside your own dialog or overlay.',
    example: `<ag-alert heading="Delete 3 photos?" message="You can restore them for 30 days."\n  actions='[{"label":"Cancel","role":"cancel"},{"label":"Delete","role":"destructive"}]'></ag-alert>`,
    attributes: [
      { name: 'heading', type: 'string', description: 'Title.' },
      { name: 'message', type: 'string', description: 'Body text.' },
      { name: 'actions', type: 'JSON AlertAction[]', description: '{ label, role?: "default" | "cancel" | "destructive", value? }.' },
    ],
    properties: [{ name: 'actions', type: 'AlertAction[]', description: 'Set from JS.' }],
    events: [{ name: 'action', type: 'CustomEvent<string>', description: 'Pressed action value or label.' }],
  },
  {
    tag: 'ag-search', react: 'Search',
    summary: 'Search field on a glass capsule with the dictation symbol trailing.',
    example: `<ag-search placeholder="Search"></ag-search>`,
    attributes: [{ name: 'placeholder', type: 'string', default: '"Search"', description: 'Also the accessible name.' }, { name: 'value', type: 'string', description: 'Initial text.' }],
    properties: [{ name: 'value', type: 'string', description: 'Current text.' }],
    events: [{ name: 'input / change', type: 'Event', description: 'From the inner input; they bubble.' }],
  },
  {
    tag: 'ag-toolbar', react: 'Toolbar, ToolbarGroup',
    summary: 'Actions that affect the same thing share one capsule; groups float apart.',
    example: `<ag-toolbar>\n  <ag-toolbar-group><ag-button variant="plain" icon="share" aria-label="Share"></ag-button></ag-toolbar-group>\n</ag-toolbar>`,
    attributes: [{ name: 'spread (toolbar)', type: 'boolean', description: 'Push groups to the ends.' }, ...glassAttrs.map(r => ({ ...r, name: `${r.name} (group)` })), { name: 'dim (group)', type: 'boolean', description: 'Dimming layer for clear groups over media.' }],
    events: [],
  },
];

export const PARAMS: Row[] = [
  { name: 'blur', type: 'px', description: 'Frost radius.' },
  { name: 'saturate', type: 'factor', description: 'Backdrop saturation, 1 = unchanged.' },
  { name: 'lum', type: 'factor', description: 'Brightness before contrast.' },
  { name: 'contrast', type: 'factor', description: 'Contrast around mid grey; below 1 flattens.' },
  { name: 'bezel', type: '0 to 1', description: 'Rim width as a fraction of the short side.' },
  { name: 'maxBezel', type: 'px', description: 'Upper limit for the rim width.' },
  { name: 'depth', type: 'factor', description: 'Thickness relative to the rim. Thicker glass bends more.' },
  { name: 'ior', type: 'index', description: 'Index of refraction. 1.5 is window glass.' },
  { name: 'dispersion', type: '0 to 0.4', description: 'Rainbow at the edge: red bends more, blue less.' },
  { name: 'zoom', type: 'factor', description: 'Magnifies the flat middle. Lens knobs use 1.08.' },
  { name: 'rim / rimWidth', type: 'factor / px', description: 'Strength and width of the specular rim.' },
  { name: 'shade', type: '0 to 1', description: 'Thin dark line inside the rim.' },
  { name: 'light', type: 'degrees', description: 'Where the light comes from. -135 is top left.' },
];

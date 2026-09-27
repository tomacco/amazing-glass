import '../../src/elements';
import { Glass, supportsRefraction, FEATURES, LEVELS, type GlassVariant } from '../../src/core';
import type { AgSegmented, AgSwitch } from '../../src/elements';
import { paint, type SceneName } from '../shared/scenes';
import { COMPONENTS, PARAMS, type Row } from './api';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

if (!supportsRefraction) $('#engine-notice').hidden = false;

const table = (rows: Row[], head = ['Name', 'Type', 'Default', 'Description']) =>
  `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r =>
    `<tr><td><code>${esc(r.name)}</code></td><td>${esc(r.type)}</td><td>${r.default ? `<code>${esc(r.default)}</code>` : ''}</td><td>${esc(r.description)}</td></tr>`).join('')}</tbody></table>`;

$('#params-table').innerHTML = table(PARAMS, ['Name', 'Unit', '', 'What it does']);

// Components: live example on a scene, the markup, then the reference tables.
const scenesFor: Record<string, SceneName | 'plain'> = {
  'ag-glass': 'bloom', 'ag-button': 'bloom', 'ag-switch': 'plain', 'ag-slider': 'plain', 'ag-segmented': 'plain',
  'ag-tab-bar': 'dusk', 'ag-menu': 'citrus', 'ag-sheet': 'dusk', 'ag-alert': 'dusk', 'ag-search': 'dusk', 'ag-toolbar': 'citrus',
};
$('#component-list').innerHTML = COMPONENTS.map(c => {
  const scene = scenesFor[c.tag] ?? 'plain';
  const tall = c.tag === 'ag-menu' || c.tag === 'ag-sheet' ? ' tall' : '';
  return `<article class="component" id="${c.tag}">
    <div class="component-head"><h3><code>&lt;${c.tag}&gt;</code></h3><span class="react-name">React / Vue: <code>${c.react}</code></span></div>
    <p>${esc(c.summary)}</p>
    <div class="stage${scene === 'plain' ? ' plain' : ''}${tall}">${scene === 'plain' ? '' : `<canvas class="scene" data-scene="${scene}"></canvas>`}<div class="live">${c.example}</div></div>
    <pre><code>${esc(c.example)}</code></pre>
    <h4>Attributes</h4><div class="table">${table(c.attributes)}</div>
    ${c.properties?.length ? `<h4>Properties</h4><div class="table">${table(c.properties)}</div>` : ''}
    ${c.events.length ? `<h4>Events</h4><div class="table">${table(c.events, ['Event', 'Type', '', 'When'])}</div>` : ''}
    ${c.css?.length ? `<h4>CSS custom properties</h4><div class="table">${table(c.css)}</div>` : ''}
  </article>`;
}).join('');
// The sheet example needs room and should start open.
const sheetStage = document.querySelector('#ag-sheet .stage') as HTMLElement | null;
if (sheetStage) sheetStage.style.height = '340px';

// Table of contents.
const sections = [...document.querySelectorAll<HTMLElement>('main section, main article.component')];
$('#toc').innerHTML = sections.map(s => {
  const label = s.tagName === 'ARTICLE' ? `&lt;${s.id}&gt;` : s.querySelector('h2')?.textContent ?? s.id;
  return `<a href="#${s.id}" class="${s.tagName === 'ARTICLE' ? 'sub' : ''}">${label}</a>`;
}).join('');

// Material lab.
const hero = $('#hero'), heroCanvas = hero.querySelector('canvas')!, probe = $('#probe');
let scene: SceneName = 'dusk';
const probeGlass = new Glass(probe, { variant: 'clear' });
$<AgSegmented>('#variant').addEventListener('change', e => {
  const v = (e.target as AgSegmented).value.toLowerCase() as GlassVariant;
  probeGlass.setVariant(v);
  Object.assign(probe.style, v === 'lens' ? { width: '170px', height: '170px', borderRadius: '50%' } : { width: '240px', height: '132px', borderRadius: '66px' });
});
$<AgSegmented>('#scene-pick').addEventListener('change', e => {
  scene = (['dusk', 'bloom', 'citrus', 'chart'] as SceneName[])[(e.target as AgSegmented).selectedIndex];
  paint(heroCanvas, scene);
});
$<AgSwitch>('#dim').addEventListener('change', e => probe.toggleAttribute('dim', (e.target as AgSwitch).checked));
let px = 0.5, py = 0.5;
const placeProbe = () => {
  const r = hero.getBoundingClientRect();
  probe.style.left = `${px * r.width - probe.offsetWidth / 2}px`;
  probe.style.top = `${py * r.height - probe.offsetHeight / 2}px`;
};
probe.addEventListener('pointerdown', e => {
  probe.setPointerCapture(e.pointerId);
  const r = hero.getBoundingClientRect(), ox = e.clientX - (r.left + px * r.width), oy = e.clientY - (r.top + py * r.height);
  const move = (ev: PointerEvent) => {
    px = Math.min(0.95, Math.max(0.05, (ev.clientX - ox - r.left) / r.width));
    py = Math.min(0.92, Math.max(0.08, (ev.clientY - oy - r.top) / r.height));
    placeProbe();
  };
  const up = () => { probe.removeEventListener('pointermove', move); probe.removeEventListener('pointerup', up); };
  probe.addEventListener('pointermove', move);
  probe.addEventListener('pointerup', up);
});

// Tokens.
const colours = ['red', 'orange', 'yellow', 'green', 'mint', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'pink', 'brown', 'gray'];
const swatches = () => {
  const cs = getComputedStyle(document.documentElement);
  $('#swatches').innerHTML = colours.map(c => `<div class="sw"><i style="background:var(--ag-${c})"></i><div><b>--ag-${c}</b><code>${cs.getPropertyValue(`--ag-${c}`).trim()}</code></div></div>`).join('');
};
swatches();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', swatches);
const styles: [string, string, string][] = [
  ['Large Title', 'ag-large-title', '34 / 41'], ['Title 1', 'ag-title-1', '28 / 34'], ['Title 2', 'ag-title-2', '22 / 28'],
  ['Title 3', 'ag-title-3', '20 / 25'], ['Headline', 'ag-headline', '17 / 22'], ['Body', 'ag-body', '17 / 22'],
  ['Callout', 'ag-callout', '16 / 21'], ['Subheadline', 'ag-subhead', '15 / 20'], ['Footnote', 'ag-footnote', '13 / 18'],
  ['Caption 1', 'ag-caption-1', '12 / 16'], ['Caption 2', 'ag-caption-2', '11 / 13'],
];
$('#type-scale').innerHTML = styles.map(([n, c, m]) => `<div><small>.${c}</small><span class="${c}">${n}: the glass floats above content</span><code>${m}</code></div>`).join('');

const paintAll = () => {
  document.querySelectorAll<HTMLCanvasElement>('canvas.scene[data-scene]').forEach(c => paint(c, c.dataset.scene as SceneName));
  paint(heroCanvas, scene);
  placeProbe();
};
requestAnimationFrame(paintAll);
let t = 0;
addEventListener('resize', () => { clearTimeout(t); t = window.setTimeout(paintAll, 150); });

// Support levels, from the same data as the README and API reference.
const levelName = { stable: 'Stable', limited: 'Limited', experimental: 'Experimental' } as const;
$('#support-table').innerHTML = `<table><thead><tr><th>Feature</th><th>Level</th><th>Chrome, Edge, Arc</th><th>Safari</th><th>Firefox</th><th>This browser</th></tr></thead><tbody>${FEATURES.map(f =>
  `<tr><td>${esc(f.name)}${f.notes ? `<br><small class="muted">${esc(f.notes)}</small>` : ''}</td><td><span class="level ${f.level}">${levelName[f.level]}</span></td><td>${esc(f.chromium)}</td><td>${esc(f.safari)}</td><td>${esc(f.firefox)}</td><td>${f.available() ? 'Full effect' : 'Fallback'}</td></tr>`).join('')}</tbody></table>`;
$('#levels').innerHTML = `<ul class="levels">${Object.entries(LEVELS).map(([k, v]) => `<li><span class="level ${k}">${levelName[k as keyof typeof levelName]}</span> ${esc(v)}</li>`).join('')}</ul>`;

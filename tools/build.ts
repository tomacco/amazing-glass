// Builds the library into dist/ and the two sites into site/.
//   bun tools/build.ts          library + sites
//   bun tools/build.ts lib      library only
import { $ } from 'bun';
import { readFileSync, rmSync, mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const only = process.argv[2];
const fail = (r: Awaited<ReturnType<typeof Bun.build>>) => { if (!r.success) { console.error(r.logs); process.exit(1); } };

// ---- library
rmSync(root + 'dist', { recursive: true, force: true });
const external = ['react', 'react/jsx-runtime', 'react-dom', 'vue'];
fail(await Bun.build({
  entrypoints: ['core/index.ts', 'elements/index.ts', 'react/index.tsx', 'vue/index.ts'].map(e => root + 'src/' + e),
  outdir: root + 'dist', root: root + 'src', splitting: true, format: 'esm', target: 'browser', external,
  naming: { entry: '[dir].[ext]', chunk: 'chunks/[name]-[hash].[ext]' },
}));
// One self-contained file for <script type="module"> from a CDN.
fail(await Bun.build({
  entrypoints: [root + 'src/elements/index.ts'], outdir: root + 'dist', format: 'esm', target: 'browser', minify: true,
  naming: 'amazing-glass.min.js',
}));
// "use client" must be the first statement for React Server Components bundlers.
const reactOut = root + 'dist/react.js';
writeFileSync(reactOut, '"use client";\n' + readFileSync(reactOut, 'utf8').replace(/^"use client";\n/m, ''));
const css = ['tokens', 'glass', 'components'].map(n => readFileSync(root + `src/styles/${n}.css`, 'utf8')).join('\n');
writeFileSync(root + 'dist/amazing-glass.css', css);
await $`${root}node_modules/.bin/tsc -p ${root}tsconfig.json`.quiet();
console.log('dist ok');

// ---- docs/API.md from the same data the guide renders
const { COMPONENTS, PARAMS } = await import(root + 'apps/guide/api.ts');
const cell = (s = '') => String(s).replace(/\|/g, '\\|');
const tbl = (rows: any[], head = ['Name', 'Type', 'Default', 'Description']) =>
  `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n` +
  rows.map(r => `| \`${cell(r.name)}\` | ${cell(r.type)} | ${r.default ? '`' + cell(r.default) + '`' : ''} | ${cell(r.description)} |`).join('\n');
let md = `# API reference\n\nGenerated from \`apps/guide/api.ts\` by \`bun run build\`. Do not edit by hand.\n\n`;
md += `Every element is also available as a React component (\`amazing-glass/react\`) and a Vue component (\`amazing-glass/vue\`) with the same props. In React, handlers receive the new value first: \`onChange={(value, event) => …}\`. In Vue, stateful components support \`v-model\`.\n\n`;
md += `## Material parameters\n\nPass as \`params\` (JSON attribute or prop) or call \`glass.setParams({...})\`.\n\n${tbl(PARAMS, ['Name', 'Unit', '', 'What it does'])}\n\n`;
for (const c of COMPONENTS) {
  md += `## \`<${c.tag}>\`\n\nReact / Vue: \`${c.react}\`\n\n${c.summary}\n\n\`\`\`html\n${c.example}\n\`\`\`\n\n### Attributes\n\n${tbl(c.attributes)}\n\n`;
  if (c.properties?.length) md += `### Properties\n\n${tbl(c.properties)}\n\n`;
  if (c.events.length) md += `### Events\n\n${tbl(c.events, ['Event', 'Type', '', 'When'])}\n\n`;
  if (c.css?.length) md += `### CSS custom properties\n\n${tbl(c.css)}\n\n`;
}
// Support levels, from src/core/support.ts, into API.md and the README (between markers).
const { FEATURES: F, LEVELS: L } = await import(root + 'src/core/support.ts');
const badge = (l: string) => ({ stable: 'Stable', limited: 'Limited', experimental: 'Experimental' } as Record<string, string>)[l];
const supportMd = `| Feature | Level | Chrome, Edge, Arc | Safari | Firefox |\n|---|---|---|---|---|\n` +
  F.map((f: any) => `| ${cell(f.name)}${f.notes ? `<br><sub>${cell(f.notes)}</sub>` : ''} | **${badge(f.level)}** | ${cell(f.chromium)} | ${cell(f.safari)} | ${cell(f.firefox)} |`).join('\n') +
  `\n\n` + Object.entries(L).map(([k, v]) => `- **${badge(k)}:** ${v}`).join('\n') +
  `\n\nWhere each was actually checked:\n\n` + F.map((f: any) => `- ${f.name.split(':')[0]}: ${f.verified}.`).join('\n');
md = md.replace('## Material parameters', `## Support levels\n\nQuery at runtime with \`featureStatus(id)\` from \`amazing-glass/core\`.\n\n${supportMd}\n\n## Material parameters`);
writeFileSync(root + 'docs/API.md', md);
const readme = readFileSync(root + 'README.md', 'utf8');
const marked = readme.replace(/<!-- support:start -->[\s\S]*?<!-- support:end -->/, `<!-- support:start -->\n${supportMd}\n<!-- support:end -->`);
if (marked !== readme) writeFileSync(root + 'README.md', marked);
console.log('docs ok');
if (only === 'lib') process.exit(0);

// ---- sites: apps/<name>/index.html + main.ts -> site/<name>/
rmSync(root + 'site', { recursive: true, force: true });
for (const app of ['demo', 'guide']) {
  const dir = root + `apps/${app}/`;
  const out = root + (app === 'demo' ? 'site/' : `site/${app}/`);
  mkdirSync(out, { recursive: true });
  fail(await Bun.build({ entrypoints: [dir + 'main.ts'], outdir: out, format: 'esm', target: 'browser', minify: true, naming: 'main.js' }));
  let html = readFileSync(dir + 'index.html', 'utf8');
  writeFileSync(out + 'index.html', html);
  if (existsSync(dir + 'assets')) cpSync(dir + 'assets', out + 'assets', { recursive: true });
  cpSync(root + 'dist/amazing-glass.css', out + 'amazing-glass.css');
  for (const f of ['app.css']) if (existsSync(dir + f)) cpSync(dir + f, out + f);
  if (existsSync(root + 'apps/shared/site.css')) cpSync(root + 'apps/shared/site.css', out + 'site.css');
}
writeFileSync(root + 'site/.nojekyll', '');
console.log('site ok');

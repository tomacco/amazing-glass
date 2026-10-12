// bun lab/feel/menu.ts [port]: opens the menu at the bottom of the controls section, which
// clips its overflow, and exits nonzero if any part of the open menu is cut off.
import { chromium } from 'playwright-core';
const port = process.argv[2] ?? '5182';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
await p.goto(`http://localhost:${port}/site/`); await p.waitForTimeout(1200);
await p.evaluate(() => document.querySelector('.control-stage')!.scrollIntoView({ block: 'center' })); await p.waitForTimeout(800);
await p.locator('#demo-menu button').first().click(); await p.waitForTimeout(800);
const r = await p.evaluate(() => {
  const s = document.querySelector('#demo-menu .ag-menu-surface')!.getBoundingClientRect();
  const st = document.querySelector('.control-stage')!.getBoundingClientRect();
  return { cutBelow: Math.max(0, Math.round(s.bottom - st.bottom)), cutAbove: Math.max(0, Math.round(st.top - s.top)) };
});
await b.close();
console.log(r.cutBelow || r.cutAbove ? `menu cut off: ${r.cutBelow} px below, ${r.cutAbove} px above` : 'menu fully visible');
process.exit(r.cutBelow || r.cutAbove ? 1 : 0);

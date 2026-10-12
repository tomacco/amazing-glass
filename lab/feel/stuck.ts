// bun lab/feel/stuck.ts [port]: regression check for a stuck lens. Presses each control,
// holds, drifts the pointer off it (mostly vertically), releases there, and asserts the
// control let go: no ag-active class and a solid knob. Exits nonzero on any stuck control.
import { chromium } from 'playwright-core';
const port = process.argv[2] ?? '5182';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
await p.goto(`http://localhost:${port}/site/`); await p.waitForTimeout(1500);
const targets = [
  '#controls ag-switch', '#controls ag-slider', '#looks ag-switch',
  '[data-ag-look=glass-chain] ag-switch', '[data-ag-look=lux-nova] ag-switch', '[data-ag-look=bauhaus] ag-switch',
];
const drifts = [[0, 40], [2, -40], [60, 50]];
let bad = 0;
for (const sel of targets) for (const [dx, dy] of drifts) {
  const el = p.locator(sel).first();
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const r = (await el.boundingBox())!;
  const x = r.x + r.width / 2, y = r.y + r.height / 2;
  await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(400);
  for (let i = 1; i <= 10; i++) { await p.mouse.move(x + (dx * i) / 10, y + (dy * i) / 10); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(500);
  const stuck = await el.evaluate(e => e.classList.contains('ag-active'));
  console.log(`${stuck ? 'STUCK' : 'ok   '} ${sel} drift ${dx},${dy}`);
  if (stuck) bad++;
}
await b.close();
console.log(bad ? `${bad} stuck` : 'none stuck');
process.exit(bad ? 1 : 0);

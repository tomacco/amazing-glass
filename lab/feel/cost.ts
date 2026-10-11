// bun lab/switch/cost.ts [port]: main-thread cost of one held press on our switch, from
// Chromium's own counters (CDP Performance.getMetrics), and how many glass map rebuilds ran.
import { chromium } from 'playwright-core';
const port = process.argv[2] ?? '5182', query = process.argv[3] ?? '';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 400, height: 160 }, deviceScaleFactor: 2 });
await p.goto(`http://localhost:${port}/lab/switch/${query}`); await p.waitForTimeout(800);
const cdp = await p.context().newCDPSession(p);
await cdp.send('Performance.enable');
const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
// Count backdrop-filter swaps on the knob's refract layer: one per map rebuild.
await p.evaluate(() => {
  const layer = document.querySelector('#a .ag-refract') as HTMLElement;
  (window as any).rebuilds = 0;
  new MutationObserver(r => { (window as any).rebuilds += r.length; }).observe(layer, { attributes: true, attributeFilter: ['style'] });
});
const box = (await p.locator('#a').boundingBox())!;
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
const a = await m();
await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(800);
const z = await m();
const d = (k: string) => ((z[k] - a[k]) * 1000).toFixed(0);
console.log(`${query || 'system'}: 1.4 s window: task ${d('TaskDuration')} ms, script ${d('ScriptDuration')} ms, layout ${d('LayoutDuration')} ms, style ${d('RecalcStyleDuration')} ms; knob map rebuilds ${await p.evaluate(() => (window as any).rebuilds)}`);
await b.close();

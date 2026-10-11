// bun lab/switch/web.ts <outDir> [port]: drives our switch with tap, hold and drag in Playwright's
// Chromium, and saves a filmstrip (frames with timestamps) plus the per-frame knob trace.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const [out = 'lab/switch/out/web', port = '5182'] = process.argv.slice(2);
const b = await chromium.launch({ headless: true });
for (const mode of ['tap', 'hold', 'drag'] as const) {
  const dir = `${out}/${mode}`; mkdirSync(dir, { recursive: true });
  const p = await b.newPage({ viewport: { width: 400, height: 160 }, deviceScaleFactor: 2 });
  await p.goto(`http://localhost:${port}/lab/switch/`); await p.waitForTimeout(800);
  const box = (await p.locator('#a').boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await p.mouse.move(cx, cy);
  await p.evaluate(() => { (window as any).trace.length = 0; (window as any).mark = performance.now(); });
  const t0 = Date.now(); let n = 0, done = false;
  const shots = (async () => {
    while (!done || Date.now() - t0 < 1400) {
      const t = Date.now() - t0;
      await p.screenshot({ path: `${dir}/${String(n++).padStart(3, '0')}-${t}ms.png` });
      if (t > 1600) break;
    }
  })();
  await p.mouse.down();
  if (mode === 'tap') await p.waitForTimeout(60);
  else if (mode === 'hold') await p.waitForTimeout(900);
  else { for (let i = 1; i <= 20; i++) { await p.mouse.move(cx + i * 1.5, cy); await p.waitForTimeout(16); } await p.waitForTimeout(200); }
  await p.mouse.up(); done = true; await shots;
  const trace = await p.evaluate(() => (window as any).trace.filter((r: any) => r.id === 'a'));
  writeFileSync(`${dir}/trace.json`, JSON.stringify(trace));
  console.log(mode, 'frames', n, 'trace rows', trace.length);
  await p.close();
}
await b.close();

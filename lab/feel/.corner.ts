import { chromium } from 'playwright-core';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5182/site/'); await p.waitForTimeout(1200);
await p.locator('#physics').scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
await p.locator('#play-variant button', { hasText: 'Regular' }).click(); await p.waitForTimeout(400);
const st = (await p.locator('.play-stage').boundingBox())!, g = (await p.locator('#play-glass').boundingBox())!;
const out = process.argv[2];
for (const [name, fx, fy] of [['corner', 0.98, 0.02], ['right', 0.98, 0.5], ['top', 0.5, 0.02], ['inside', 0.75, 0.25]] as const) {
  await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await p.mouse.down();
  await p.mouse.move(st.x + st.width * fx, st.y + st.height * fy, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(600);
  const info = await p.evaluate(() => { const e = document.querySelector('#play-glass') as HTMLElement; const l = e.querySelector('.ag-refract') as HTMLElement; return { tone: e.dataset.tone, bf: getComputedStyle(l).backdropFilter.slice(0, 40), left: e.style.left, top: e.style.top }; });
  console.log(name, JSON.stringify(info));
  await p.screenshot({ path: `${out}/corner-${name}.png`, clip: { x: st.x - 10, y: st.y - 10, width: st.width + 20, height: st.height + 20 } });
  // back to the middle for the next run
  const g2 = (await p.locator('#play-glass').boundingBox())!;
  await p.mouse.move(g2.x + g2.width / 2, g2.y + g2.height / 2); await p.mouse.down(); await p.mouse.move(st.x + st.width / 2, st.y + st.height / 2, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
  Object.assign(g, (await p.locator('#play-glass').boundingBox())!);
}
await b.close();

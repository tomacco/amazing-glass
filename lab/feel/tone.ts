// bun lab/feel/tone.ts [port]: drags the playground lens from top to bottom and back, in each
// variant, and logs the glass tone it picks on the way. The picture behind is light, so the
// tone must stay light. Exits nonzero if any step reads dark.
import { chromium } from 'playwright-core';
const port = process.argv[2] ?? '5182';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(`http://localhost:${port}/site/`); await p.waitForTimeout(1200);
await p.locator('#physics').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
let dark = 0;
for (const variant of ['Lens', 'Clear', 'Regular']) {
  await p.locator('#play-variant button', { hasText: variant }).click(); await p.waitForTimeout(400);
  const stage = (await p.locator('.play-stage').boundingBox())!;
  const g = (await p.locator('#play-glass').boundingBox())!;
  let x = g.x + g.width / 2, y = g.y + g.height / 2;
  await p.mouse.move(x, y); await p.mouse.down();
  const path: string[] = [];
  const steps = [...Array(24).keys()].map(i => stage.y + (stage.height + 40) * (i / 23));
  for (const ty of [...steps, ...steps.reverse()]) {
    await p.mouse.move(x, ty); await p.waitForTimeout(40);
    const t = await p.evaluate(() => (document.querySelector('#play-glass') as HTMLElement).dataset.tone ?? '?');
    path.push(t[0]); if (t === 'dark') dark++;
  }
  await p.mouse.up();
  console.log(`${variant.padEnd(8)} ${path.join('')}`);
}
await b.close();
console.log(dark ? `${dark} dark readings over a light picture` : 'tone stayed light');
process.exit(dark ? 1 : 0);

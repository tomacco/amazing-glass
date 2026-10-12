// bun lab/switch/frames.ts <url> <selector>... : headed Chromium with the GPU compositor.
// Holds each control for 600 ms (TAP=1: a 60 ms tap; TOUCH=1: a finger) and reports frame
// times (rAF deltas) over 1.2 s from the press.
import { chromium } from 'playwright-core';
const [url, ...sels] = process.argv.slice(2);
const b = await chromium.launch({ headless: false, args: ['--window-size=1280,900'] });
const touch = !!process.env.TOUCH, tap = !!process.env.TAP;
const p = await b.newPage({ viewport: { width: 1280, height: 860 }, hasTouch: touch });
const cdp = await p.context().newCDPSession(p);
await p.goto(url); await p.waitForTimeout(1500);
for (const sel of sels) {
  const el = p.locator(sel).first();
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
  const box = (await el.boundingBox())!;
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.evaluate(() => { const w = window as any; w.dts = []; let last = performance.now(); w.go = true;
    (function f(t: number) { w.dts.push(t - last); last = t; if (w.go) requestAnimationFrame(f); })(last); });
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); else await p.mouse.down();
  await p.waitForTimeout(tap ? 60 : 600);
  if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); else await p.mouse.up();
  await p.waitForTimeout(tap ? 1140 : 600);
  const d: number[] = await p.evaluate(() => { const w = window as any; w.go = false; return w.dts.slice(1); });
  const s = [...d].sort((a, b) => a - b), pct = (k: number) => s[Math.floor(k * (s.length - 1))].toFixed(1);
  console.log(`${sel}: ${d.length} frames in 1.2 s, median ${pct(0.5)} ms, p95 ${pct(0.95)} ms, worst ${s[s.length - 1].toFixed(1)} ms, over 25 ms: ${d.filter(x => x > 25).length}`);
}
await b.close();

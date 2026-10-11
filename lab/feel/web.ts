// bun lab/feel/web.ts <scene> <tap|hold|drag> <dx> <dy> <holdMs> <dragPx> <outDir> [port]
// Drives our control in Playwright's Chromium at (dx, dy) px from the centre of the 400 x 160
// stage, the same gesture native/drive.swift sends to SwiftUI, and saves frames named by ms.
import { chromium } from 'playwright-core';
import { mkdirSync, rmSync } from 'node:fs';
const [scene, mode, dx, dy, holdMs, dragPx, out, port = '5182'] = process.argv.slice(2);
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 400, height: 160 }, deviceScaleFactor: 2 });
await p.goto(`http://localhost:${port}/lab/feel/?scene=${scene}`); await p.waitForTimeout(800);
const cx = 200 + +dx, cy = 80 + +dy;
await p.mouse.move(cx, cy); await p.waitForTimeout(300);
const t0 = Date.now(); let n = 0, done = false;
// Frames from 100 ms before the press, like the native sheet.
const shots = (async () => {
  while (true) {
    const t = Date.now() - t0;
    await p.screenshot({ path: `${out}/${String(t).padStart(6, '0')}.png` }); n++;
    if (done && t > (mode === 'hold' ? 2000 : 1300)) break;
  }
})();
await p.waitForTimeout(100);
await p.mouse.down();
if (mode === 'tap') await p.waitForTimeout(60);
else if (mode === 'hold') await p.waitForTimeout(+holdMs);
else { for (let i = 1; i <= 20; i++) { await p.mouse.move(cx + (+dragPx * i) / 20, cy); await p.waitForTimeout(16); } await p.waitForTimeout(200); }
await p.mouse.up(); done = true; await shots;
console.log(`${scene} ${mode}: ${n} frames`);
await b.close();

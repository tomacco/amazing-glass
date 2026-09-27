// Fits the web glass to Apple's rendering: renders match/index.html, screenshots it,
// diffs each glass region against a native capture and runs coordinate descent.
// node tools/fit.mjs <scene[,scene]> <variant> [rounds]   (several scenes are scored jointly)
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const [scene = 'chart', variant = 'regular', rounds = 5] = process.argv.slice(2);
const root = new URL("..", import.meta.url).pathname;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(tmpdir() + '/lgfit-')}`,
  '--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=2', 'about:blank'], { stdio: 'ignore' });

// One CDP connection per scene, each on its own tab.
async function openPage(scene) {
  let ws, id = 0;
  const pending = new Map();
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed');
    return r.result.result.value;
  };
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 800, height: 400, deviceScaleFactor: 2, mobile: false });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Page.enable');
  await send('Page.navigate', { url: `http://localhost:5180/lab/index.html?bg=${scene}` });
  for (let i = 0; i < 50 && !(await ev('!!window.ready').catch(() => false)); i++) await sleep(100);
  const refPath = `${root}lab/ref/ref-${scene}.png`;
  const b64 = readFileSync(refPath).toString('base64');
  const refH = readFileSync(refPath).readUInt32BE(20);
  await ev(`loadRef('data:image/png;base64,${b64}', ${refH - 800})`);
  return { scene, send, ev, close: () => ws.close() };
}

let pages = [];
try {
  for (let i = 0; i < 60; i++) { await sleep(150); try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch {} }
  pages = await Promise.all(scene.split(',').map(openPage));

  const regionsOf = { regular: ['regCap', 'regRect'], clear: ['clrCap', 'clrCirc', 'clrRect'] }[variant];
  const start = {
    regular: { blur: 12, saturate: 1.8, bezel: 0.26, maxBezel: 20, depth: 0.7, dispersion: 0.06, rim: 1, shade: 0.16, rimWidth: 1.25, tr: 250, tg: 250, tb: 252, ta: 0.48, sa: 0.14, lum: 1, contrast: 1 },
    clear: { blur: 1.6, saturate: 1.35, bezel: 0.3, maxBezel: 26, depth: 0.85, dispersion: 0.1, rim: 1, shade: 0.16, rimWidth: 1.25, tr: 255, tg: 255, tb: 255, ta: 0.04, sa: 0.14, lum: 1, contrast: 1 },
  }[variant];
  const bestFile = `${root}lab/fit-${variant}.json`;
  let p = existsSync(bestFile) ? { ...start, ...JSON.parse(readFileSync(bestFile, 'utf8')).params } : { ...start };
  const bounds = {
    blur: [0, 40], saturate: [0.5, 3], bezel: [0.05, 0.6], maxBezel: [4, 40], depth: [0, 2], dispersion: [0, 0.4],
    rim: [0, 3], shade: [0, 0.6], rimWidth: [0.3, 4], tr: [0, 255], tg: [0, 255], tb: [0, 255], ta: [0, 1], sa: [0, 0.5],
    lum: [0.5, 1.8], contrast: [0.3, 1.5],
  };
  const steps = { blur: 4, saturate: 0.3, bezel: 0.08, maxBezel: 6, depth: 0.3, dispersion: 0.06, rim: 0.4, shade: 0.08, rimWidth: 0.5, tr: 24, tg: 24, tb: 24, ta: 0.12, sa: 0.06, lum: 0.1, contrast: 0.1 };

  async function lossOn(pg, params) {
    await pg.ev(`apply(${JSON.stringify({ [variant]: params })})`);
    const shot = await pg.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 800, height: 400, scale: 1 } });
    const s = await pg.ev(`score('data:image/png;base64,${shot.result.data}')`);
    return { v: regionsOf.reduce((a, k) => a + s[k], 0) / regionsOf.length, s, shot: shot.result.data };
  }
  async function loss(params) {
    const rs = await Promise.all(pages.map(pg => lossOn(pg, params)));
    const s = Object.fromEntries(rs.map((r, i) => [pages[i].scene, Object.fromEntries(regionsOf.map(k => [k, r.s[k]]))]));
    return { v: rs.reduce((a, r) => a + r.v, 0) / rs.length, s, shots: rs.map(r => r.shot) };
  }

  if (process.env.REPEAT) {
    for (let i = 0; i < +process.env.REPEAT; i++) { const r = await loss(p); console.log('repeat', r.v.toFixed(3)); }
    process.exit(0);
  }
  let best = await loss(p);
  console.log('start', best.v.toFixed(3), JSON.stringify(best.s));
  for (let round = 0; round < rounds; round++) {
    for (const k of Object.keys(steps)) {
      for (const dir of [1, -1]) {
        const q = { ...p, [k]: Math.min(bounds[k][1], Math.max(bounds[k][0], +(p[k] + dir * steps[k]).toFixed(4))) };
        if (q[k] === p[k]) continue;
        const r = await loss(q);
        if (r.v < best.v - 0.005) { p = q; best = r; break; }
      }
    }
    for (const k in steps) steps[k] /= 1.6;
    console.log(`round ${round + 1}`, best.v.toFixed(3), JSON.stringify(best.s));
  }
  const fin = await loss(p);
  fin.shots.forEach((b, i) => writeFileSync(`${root}lab/ref/web-${pages[i].scene}-${variant}.png`, Buffer.from(b, 'base64')));
  writeFileSync(bestFile, JSON.stringify({ scene, variant, loss: fin.v, regions: fin.s, params: p }, null, 2));
  console.log('final', fin.v.toFixed(3), JSON.stringify(fin.s));
  console.log('best', JSON.stringify(p));
} finally { pages.forEach(pg => pg.close()); chrome.kill('SIGKILL'); }

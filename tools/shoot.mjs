// Screenshot harness over the DevTools protocol, with real pointer input.
// node tools/shoot.mjs <url> <out.png> [w] [h] [js-before-shot] [light|dark] [actions-json]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [url, out, w = 1280, h = 900, pre = '', scheme = 'light', actionsJson = '[]'] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
// HEADFUL=1 runs a real windowed Chrome with the GPU compositor (headless renders on the CPU).
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  ...(process.env.HEADFUL ? ['--window-position=0,0', `--window-size=${w},${Number(h) + 90}`] : ['--headless=new']), `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(tmpdir() + '/lgc-')}`,
  '--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=2', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(150);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {}
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 500 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }, { name: 'prefers-color-scheme', value: scheme }] });
  await send('Page.enable');
  await send('Page.navigate', { url });
  await sleep(1500);
  if (pre) { const r = await send('Runtime.evaluate', { expression: pre, awaitPromise: true, returnByValue: true }); if (r.result?.result?.value !== undefined) console.log('eval:', JSON.stringify(r.result.result.value)); if (r.result?.exceptionDetails) errors.push(r.result.exceptionDetails.exception?.description); }
  await sleep(600);
  // Actions: [{sel, dx, dy, type: down|move|up, wait}] dispatched as real mouse input.
  for (const a of JSON.parse(actionsJson)) {
    let x = a.x ?? 0, y = a.y ?? 0;
    if (a.sel) {
      const r = await send('Runtime.evaluate', { expression: `(()=>{const b=document.querySelector(${JSON.stringify(a.sel)}).getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2]})()`, returnByValue: true });
      [x, y] = r.result.result.value; x += a.dx || 0; y += a.dy || 0;
    }
    const type = { down: 'mousePressed', up: 'mouseReleased', move: 'mouseMoved' }[a.type];
    await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: a.type === 'up' ? 0 : 1, clickCount: 1 });
    await sleep(a.wait ?? 60);
  }
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  if (errors.length) console.log('ERRORS:', errors.join('\n'));
  console.log('saved', out);
} finally { ws?.close(); chrome.kill('SIGKILL'); }

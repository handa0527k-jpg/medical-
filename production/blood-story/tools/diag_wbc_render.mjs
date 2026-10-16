#!/usr/bin/env node
/**
 * D2 previews: contact sheet + MP4s for web/diag_wbc.js.
 *   node tools/diag_wbc_render.mjs sheet                 -> out/diag_wbc_sheet.png
 *   node tools/diag_wbc_render.mjs anim <name> [...]     -> out/diag_wbc_<name>.mp4 (1920x1080 30fps)
 *   node tools/diag_wbc_render.mjs still <name> <t> ...  -> scratch JPEGs in out/frames/diag_wbc_<name>_<t>.jpg
 *   node tools/diag_wbc_render.mjs timing                -> ms/frame of every preview scene
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || '/tmp/claude-0/-home-user-medical-/cabe129b-da88-56c0-b315-974d7937f506/scratchpad/pw/node_modules/playwright');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png' };
const server = createServer((req, res) => { const p = join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p)); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/web/diag_wbc_sheet.html`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: false, args: ['--headless=new', '--force-color-profile=srgb'] });
async function open(qs) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(base + qs);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  return page;
}
const [mode, ...args] = process.argv.slice(2);
mkdirSync(join(ROOT, 'out/frames'), { recursive: true });
const ALL = ['bacterium', 'phagocytosis', 'engulf', 'lineup', 'neutrophil', 'allies', 'clot', 'pullback', 'victory'];
if (mode === 'sheet') {
  const page = await open('');
  const u = await page.evaluate(() => window.sheetURL);
  writeFileSync(join(ROOT, 'out/diag_wbc_sheet.png'), Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'));
  console.log('wrote out/diag_wbc_sheet.png');
} else if (mode === 'still') {
  const [name, ...ts] = args; const page = await open('?anim=' + name);
  for (const t of ts) { const u = await page.evaluate((tt) => window.renderFrame(+tt), t); const f = join(ROOT, `out/frames/diag_wbc_${name}_${t}.jpg`); writeFileSync(f, Buffer.from(u.slice(u.indexOf(',') + 1), 'base64')); console.log(f); }
} else if (mode === 'timing') {
  const page = await open('?anim=lineup');
  for (const n of ALL) console.log(n, JSON.stringify(await page.evaluate((nn) => window.timing(nn, 24), n)));
} else if (mode === 'anim') {
  for (const name of (args.length ? args : ALL)) {
    const pages = await Promise.all([0, 1, 2].map(() => open('?anim=' + name)));
    const dur = await pages[0].evaluate(() => window.cutDuration), n = Math.round(dur * 30);
    const out = join(ROOT, `out/diag_wbc_${name}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const results = new Map(); let next = 0, written = 0; const t0 = Date.now();
    await Promise.all(pages.map(async (page) => {
      while (true) {
        const i = next; next += 6; if (i >= n) return;
        const times = Array.from({ length: Math.min(6, n - i) }, (_, k) => (i + k) / 30);
        const urls = await page.evaluate((tt) => tt.map((t) => window.renderFrame(t)), times);
        urls.forEach((u, k) => results.set(i + k, Buffer.from(u.slice(u.indexOf(',') + 1), 'base64')));
        while (results.has(written)) { const b = results.get(written); results.delete(written); written++; if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r)); }
      }
    }));
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    await Promise.all(pages.map((p) => p.close()));
    console.log(`wrote ${out} (${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
}
await browser.close(); server.close();

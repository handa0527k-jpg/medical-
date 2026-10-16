#!/usr/bin/env node
/**
 * Render BS.diag (diag_rbc.js) previews.
 *   node tools/diag_rbc_render.mjs sheet                         → out/diag_rbc_sheet.png
 *   node tools/diag_rbc_render.mjs stills <name> <out.png> p1 p2 …  → montage of frames (3 per row)
 *   node tools/diag_rbc_render.mjs clip <name> [dur]              → out/diag_rbc_<name>.mp4 (1920×1080, 30 fps)
 *   node tools/diag_rbc_render.mjs clips                          → every diagram's mp4
 *   node tools/diag_rbc_render.mjs time                           → ms per draw for every diagram
 * In clips p = min(1, t / (dur − 0.6)) so the final state holds ~0.6 s.
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || '/tmp/claude-0/-home-user-medical-/cabe129b-da88-56c0-b315-974d7937f506/scratchpad/pw/node_modules/playwright');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png' };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/web/diag_rbc_sheet.html`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: false, args: ['--headless=new', '--force-color-profile=srgb'] });
async function open(q = '') {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(base + q); await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  return page;
}
const dec = (u) => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');
const [mode, ...args] = process.argv.slice(2);
mkdirSync(join(ROOT, 'out'), { recursive: true });
async function clip(page, name, dur) {
  dur = dur || (await page.evaluate((n) => window.DIAG_DUR[n], name));
  const out = join(ROOT, 'out', `diag_rbc_${name}.mp4`), fps = 30, n = Math.round(dur * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i += 10) {
    const ts = Array.from({ length: Math.min(10, n - i) }, (_, k) => (i + k) / fps);
    const urls = await page.evaluate(([nm, tt, d]) => tt.map((t) => window.renderFrame(nm, Math.min(1, t / (d - 0.6)), t)), [name, ts, dur]);
    for (const u of urls) if (!ff.stdin.write(dec(u))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`${out}  ${n} frames, ${((Date.now() - t0) / n).toFixed(0)} ms/frame incl. encode`);
}
if (mode === 'sheet') {
  const page = await open();
  const u = await page.evaluate(() => document.getElementById('sheet').toDataURL('image/png'));
  writeFileSync(join(ROOT, 'out/diag_rbc_sheet.png'), dec(u)); console.log('out/diag_rbc_sheet.png');
} else if (mode === 'stills') {
  const [name, out, ...ps] = args; const page = await open(); const files = [];
  for (const p of ps) { const f = `${out}.${name}_${p}.jpg`; writeFileSync(f, dec(await page.evaluate(([n, pp]) => window.renderFrame(n, +pp, 2), [name, p]))); files.push(f); }
  execFileSync('montage', [...files, '-tile', '3x', '-geometry', '960x540+3+3', '-background', '#222', out]); console.log(out);
} else if (mode === 'clip') {
  await clip(await open(), args[0], args[1] ? +args[1] : 0);
} else if (mode === 'clips') {
  const page = await open(); const names = Object.keys(await page.evaluate(() => window.DIAG_DUR));
  for (const n of names) await clip(page, n, 0);
} else if (mode === 'time') {
  const page = await open(); const names = Object.keys(await page.evaluate(() => window.DIAG_DUR));
  await page.evaluate((ns) => ns.forEach((n) => window.timeDiag(n, 5)), names); // warm-up
  for (const n of names) console.log(n.padEnd(18), JSON.stringify(await page.evaluate((nm) => window.timeDiag(nm, 40), n)));
}
await browser.close(); server.close();

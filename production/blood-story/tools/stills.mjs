#!/usr/bin/env node
// Render stills of a cut at given times into a contact sheet: node tools/stills.mjs <cut> <out.jpg> t1 t2 ...
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || '/tmp/claude-0/-home-user-medical-/cabe129b-da88-56c0-b315-974d7937f506/scratchpad/pw/node_modules/playwright');
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [cut, out, ...times] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = createServer((req, res) => { const p = join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!existsSync(p)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p)); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: false, args: ['--headless=new'] });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/web/film.html?cut=${cut}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const dir = join(ROOT, 'out/frames'); mkdirSync(dir, { recursive: true });
const files = [];
for (const t of times) {
  const t0 = Date.now(); const u = await page.evaluate((tt) => window.renderFrame(+tt), t);
  const f = join(dir, `${cut}_${t}.jpg`); writeFileSync(f, Buffer.from(u.slice(u.indexOf(',') + 1), 'base64')); files.push(f);
  console.log(t, Date.now() - t0, 'ms');
}
await b.close(); server.close();
execFileSync('montage', [...files, '-tile', '3x', '-geometry', '960x540+4+4', '-background', '#222', '-pointsize', '28', resolve(out)]);

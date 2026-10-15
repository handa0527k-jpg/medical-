#!/usr/bin/env node
/**
 * Render a BLOOD STORY cut to MP4.
 *   node tools/render.mjs <cut> <out.mp4> [--audio audio/mix_intro.wav] [--from S] [--to S] [--fps 30] [--workers 3] [--scale 1]
 * Frames come from web/film.html?cut=<cut> (window.renderFrame(t) -> JPEG data URL), served by a tiny
 * static server rooted at production/blood-story. Workers render interleaved chunks in parallel.
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const PW = process.env.PW_MODULE || '/tmp/claude-0/-home-user-medical-/cabe129b-da88-56c0-b315-974d7937f506/scratchpad/pw/node_modules/playwright';
const { chromium } = require(PW);
const CHROME = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const [cut, outArg, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const fps = +opt('--fps', 30), workers = +opt('--workers', 3), scale = +opt('--scale', 1);
const out = resolve(outArg);
const audio = opt('--audio', null);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav' };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('console:', m.text()); });
  await page.goto(`${base}/web/film.html?cut=${cut}&scale=${scale}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  return page;
}
const pages = await Promise.all(Array.from({ length: workers }, openPage));
const dur = await pages[0].evaluate(() => window.cutDuration);
const a = +opt('--from', 0), b = +opt('--to', dur);
const n = Math.round((b - a) * fps);
mkdirSync(dirname(out), { recursive: true });

const vidOnly = out.replace(/\.mp4$/, '.video.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(fps), vidOnly], { stdio: ['pipe', 'inherit', 'inherit'] });

const chunk = 6; const results = new Map(); let next = 0, written = 0; const t0 = Date.now();
async function worker(page) {
  while (true) {
    const i = next; next += chunk; if (i >= n) return;
    const times = Array.from({ length: Math.min(chunk, n - i) }, (_, k) => a + (i + k) / fps);
    const urls = await page.evaluate((tt) => tt.map((t) => window.renderFrame(t)), times);
    urls.forEach((u, k) => results.set(i + k, Buffer.from(u.slice(u.indexOf(',') + 1), 'base64')));
    while (results.has(written)) {
      const buf = results.get(written); results.delete(written); written++;
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    if (i % (chunk * 20) === 0) process.stdout.write(`\r${cut}: ${written}/${n} frames (${(written / ((Date.now() - t0) / 1000)).toFixed(1)} fps)   `);
  }
}
await Promise.all(pages.map(worker));
ff.stdin.end(); await new Promise((r) => ff.on('close', r));
await browser.close(); server.close();
console.log(`\nvideo: ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

// subtitles as a soft track too (the burned-in ones are drawn by the film itself)
const cuesPath = join(ROOT, 'audio', `cues_${cut}.json`);
const cues = existsSync(cuesPath) ? JSON.parse(readFileSync(cuesPath, 'utf8')) : existsSync(join(ROOT, 'audio/cues.json')) ? JSON.parse(readFileSync(join(ROOT, 'audio/cues.json'), 'utf8')) : null;
const ts = (x) => { const ms = Math.max(0, Math.round(x * 1000)); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const args = ['-y', '-loglevel', 'error', '-i', vidOnly];
if (audio) args.push('-ss', String(a), '-t', String(b - a), '-i', resolve(ROOT, audio));
let srt = null;
if (cues) {
  srt = out.replace(/\.mp4$/, '.srt');
  const lines = cues.lines.filter((l) => l.end > a && l.start < b);
  writeFileSync(srt, lines.map((l, i) => `${i + 1}\n${ts(l.start - a)} --> ${ts(Math.min(b, l.end + 0.25) - a)}\n${l.who === 'N' ? '（ナレーション）' : l.who + '：'}${l.text}\n`).join('\n'));
  args.push('-i', srt);
}
args.push('-map', '0:v'); if (audio) args.push('-map', '1:a'); if (srt) args.push('-map', `${audio ? 2 : 1}:s`);
args.push('-c:v', 'copy'); if (audio) args.push('-c:a', 'aac', '-b:a', '256k', '-ar', '48000'); if (srt) args.push('-c:s', 'mov_text', '-metadata:s:s:0', 'language=jpn');
args.push('-movflags', '+faststart', '-shortest', out);
await new Promise((r, j) => spawn('ffmpeg', args, { stdio: 'inherit' }).on('close', (c) => (c ? j(new Error('mux failed')) : r())));
rmSync(vidOnly);
console.log('wrote', out);

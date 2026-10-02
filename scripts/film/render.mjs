#!/usr/bin/env node
/**
 * Render a story film (or a part) to MP4: frames from production/render.html piped into ffmpeg, the
 * soundtrack from scripts/film/mix.py, soft subtitles from the line timings.
 *
 *   node scripts/film/render.mjs <course> <production dir> <out.mp4> [--from S] [--to S] [--scene ID] [--fps 30] [--base URL]
 * Needs a dev server (npx vite --port 5199). PW_CHROMIUM may point at a Chromium binary.
 */
import { chromium } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [course, prod, out, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const fps = +opt('--fps', 30), base = opt('--base', 'http://localhost:5199');
const FF = execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const tl = JSON.parse(readFileSync(join(prod, 'timeline.json'), 'utf8'));
let a = +opt('--from', 0), b = +opt('--to', tl.total);
const sc = opt('--scene', null);
if (sc) { const s = tl.scenes.find((x) => x.id === sc); a = s.start; b = s.end; }
mkdirSync(dirname(out), { recursive: true });
const tmp = out.replace(/\.mp4$/, '');

// 1) soundtrack
execFileSync('python3', ['scripts/film/mix.py', prod, `${tmp}.wav`, '--from', String(a), '--to', String(b)], { stdio: 'inherit' });
// 2) subtitles (SRT, relative to the part)
const ts = (x) => { const ms = Math.max(0, Math.round(x * 1000)); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const subs = tl.lines.filter((l) => l.t1 > a && l.t0 < b).map((l, i) => `${i + 1}\n${ts(l.t0 - a)} --> ${ts(Math.min(b, l.t1 + 0.3) - a)}\n${l.who === 'N' ? '' : l.who + '「'}${l.text}${l.who === 'N' ? '' : '」'}\n`);
writeFileSync(`${tmp}.srt`, subs.join('\n'));
// 3) frames → ffmpeg
const b2 = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await b2.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`${base}/production/render.html?course=${course}&t=${a}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-i', `${tmp}.wav`, '-i', `${tmp}.srt`,
  '-map', '0:v', '-map', '1:a', '-map', '2:s', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
  '-c:s', 'mov_text', '-metadata:s:s:0', 'language=jpn', '-tune', 'animation', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const n = Math.round((b - a) * fps), batch = 12; const t0 = Date.now();
for (let i = 0; i < n; i += batch) {
  const times = Array.from({ length: Math.min(batch, n - i) }, (_, k) => a + (i + k) / fps);
  const urls = await page.evaluate(([tt]) => window.renderFrames(tt, 0.92), [times]);
  for (const u of urls) { if (!ff.stdin.write(Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r)); }
  if (i % (batch * 25) === 0) process.stdout.write(`\r${out}: ${i}/${n} frames (${((i / Math.max(1, (Date.now() - t0) / 1000))).toFixed(1)} fps)   `);
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b2.close();
console.log(`\n${out}: ${(b - a).toFixed(1)} s, ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

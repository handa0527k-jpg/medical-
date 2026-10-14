#!/usr/bin/env node
// シーンを MP4 に書き出す：Chromium で 1 コマずつ描いた JPEG を ffmpeg に流し、build/mix/<scene>.wav と合わせる。
//   node tools/render.mjs s01 [s02 ...] [--fps 30] [--from 0 --to 10] [--out output/scenes] [--crf 23]
// 並列にしたいときは別プロセスで別シーンを渡す（tools/build.sh を参照）。
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const ids = args.filter((a, i) => /^s\d\d$/.test(a) && !String(args[i - 1] || '').startsWith('--'));
const fps = +opt('--fps', 30), outDir = opt('--out', join(ROOT, 'output', 'scenes')), crf = opt('--crf', '23');
const tl = JSON.parse(readFileSync(join(ROOT, 'render', 'data', 'timeline.json'), 'utf8'));
mkdirSync(outDir, { recursive: true });

const srv = await serve(0);
const base = `http://127.0.0.1:${srv.address().port}/render/`;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
for (const id of ids) {
  const sc = tl.scenes.find((s) => s.id === id);
  const a = +opt('--from', 0), b = Math.min(sc.dur, +opt('--to', sc.dur));
  const out = join(outDir, opt('--name', `${id}.mp4`));
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error(`[${id}] page error:`, e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error(`[${id}]`, m.text()); });
  await page.goto(`${base}index.html?scene=${id}&t=0`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
    '-ss', String(a), '-t', String(b - a), '-i', join(ROOT, 'build', 'mix', `${id}.wav`),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-tune', 'animation', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-g', '60', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((b - a) * fps), batch = 10, t0 = Date.now();
  for (let i = 0; i < n; i += batch) {
    const times = Array.from({ length: Math.min(batch, n - i) }, (_, k) => a + (i + k) / fps);
    const urls = await page.evaluate(([sid, tt]) => window.renderFrames(sid, tt, 0.92), [id, times]);
    for (const u of urls) { if (!ff.stdin.write(Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r)); }
    if (i % (batch * 60) === 0) console.log(`[${id}] ${i}/${n} frames, ${(i / Math.max(1, (Date.now() - t0) / 1000)).toFixed(1)} fps`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  console.log(`[${id}] done: ${out} (${(b - a).toFixed(1)} s, ${n} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
await browser.close();
srv.close();

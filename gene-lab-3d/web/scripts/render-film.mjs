// Render a film frame by frame with headless Chromium and encode it with ffmpeg.
//
//   node scripts/render-film.mjs sanger                      # full MP4 → ../film/out/sanger.mp4
//   node scripts/render-film.mjs sanger --stills 5,40,90     # PNG stills for review
//   options: --url http://localhost:5181  --fps 24  --w 1920 --h 1080  --from 0 --to 60
//
// Uses Mesa's llvmpipe through EGL when available (about 2x faster than SwiftShader).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const id = process.argv[2] ?? 'sanger';
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const url = opt('url', 'http://localhost:5181');
const fps = +opt('fps', 24), W = +opt('w', 1920), H = +opt('h', 1080);
const stills = opt('stills', null);
const outDir = path.resolve(import.meta.dirname, '../../film/out');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-gpu-vsync'],
  env: { ...process.env, EGL_PLATFORM: 'surfaceless', GALLIUM_DRIVER: 'llvmpipe' },
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text().slice(0, 200)); });
await page.goto(`${url}/film.html?id=${id}&render=1&w=${W}&h=${H}`);
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 180000 });
const duration = await page.evaluate(() => window.__film.duration);
const shoot = async (t) => {
  await page.evaluate((t) => window.__film.seek(t), t);
  return page.screenshot({ type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: W, height: H } });
};

if (stills) {
  for (const s of stills.split(',').map(Number)) {
    fs.writeFileSync(path.join(outDir, `${id}-${String(Math.round(s * 100)).padStart(6, '0')}.jpg`), await shoot(s));
    console.log('still', s);
  }
} else {
  const from = +opt('from', 0), to = Math.min(+opt('to', duration), duration);
  const out = path.join(outDir, `${id}-video-${from}-${Math.round(to)}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((to - from) * fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await shoot(from + i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 48 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`frame ${i}/${n}  ${(i / Math.max(el, 1e-3)).toFixed(2)} fps  eta ${Math.round((n - i) / Math.max(i / el, 1e-3) / 60)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('wrote', out);
}
await browser.close();

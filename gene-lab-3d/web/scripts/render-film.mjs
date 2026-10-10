// Render a film frame by frame with headless Chromium and encode it with ffmpeg.
//
//   node scripts/render-film.mjs sanger --stills 5,40,90        # PNG/JPEG stills for review
//   node scripts/render-film.mjs sanger --worker 0 --workers 3  # render chunks (resumable)
//   options: --url http://localhost:4176  --fps 24  --w 1920 --h 1080  --chunk 10
//
// The film is cut into fixed chunks (10 s); each finished chunk is written to
// ../film/out/<id>/chunk-NNNN.mp4 and skipped on the next run, so a render that
// is interrupted (container restart) resumes where it stopped. Several workers
// split the chunks (chunk i goes to worker i % workers). film/finish.sh joins
// them and adds the narration.
// Uses Mesa's llvmpipe through EGL when available (about 2x faster than SwiftShader).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const id = process.argv[2] ?? 'sanger';
const opt = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const url = opt('url', 'http://localhost:4176');
const fps = +opt('fps', 24), W = +opt('w', 1920), H = +opt('h', 1080);
const chunk = +opt('chunk', 10);
const worker = +opt('worker', 0), workers = +opt('workers', 1);
const stills = opt('stills', null);
const outDir = path.resolve(import.meta.dirname, '../../film/out', stills ? '' : H === 1080 ? id : `${id}-${H}p`);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-gpu-vsync'],
  env: { ...process.env, EGL_PLATFORM: 'surfaceless', GALLIUM_DRIVER: 'llvmpipe' },
});
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text().slice(0, 200)); });
await page.goto(`${url}/film.html?id=${id}&render=1&w=${W}&h=${H}`);
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 300000 });
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
  const total = Math.ceil(duration / chunk);
  const t0 = Date.now();
  let frames = 0;
  for (let c = worker; c < total; c += workers) {
    const out = path.join(outDir, `chunk-${String(c).padStart(4, '0')}.mp4`);
    if (fs.existsSync(out)) continue;
    const tmp = out.replace('.mp4', `.part${worker}.mp4`);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round(Math.min(chunk, duration - c * chunk) * fps);
    for (let i = 0; i < n; i++) {
      const buf = await shoot(c * chunk + i / fps);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      frames++;
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    fs.renameSync(tmp, out);
    const el = (Date.now() - t0) / 1000;
    console.log(`chunk ${c + 1}/${total} done  ${(frames / el).toFixed(2)} fps`);
  }
  console.log('worker done');
}
await browser.close();

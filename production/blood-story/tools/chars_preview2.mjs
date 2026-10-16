// Render tools/chars_preview2.html to out/preview_run.mp4 (3 s, 30 fps) via ffmpeg (frames piped as PNG).
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
const require = createRequire(import.meta.url);
const PW = '/tmp/claude-0/-home-user-medical-/cabe129b-da88-56c0-b315-974d7937f506/scratchpad/pw/node_modules/playwright';
const { chromium } = require(process.env.PW_PATH || PW);
const here = path.dirname(new URL(import.meta.url).pathname);
const out = process.argv[2] || path.join(here, '../out/preview_poses.mp4');
const frames = +(process.argv[3] || 120);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: false, args: ['--allow-file-access-from-files', '--headless=new'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('pageerror', e));
await page.goto('file://' + path.join(here, 'chars_preview2.html'));
await page.waitForFunction('window.__ready === true');
await page.evaluate(() => document.fonts.ready);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', out], { stdio: ['pipe', 'inherit', 'inherit'] });
let tot = 0;
for (let f = 0; f < frames; f++) {
  const ms = await page.evaluate((f) => { const t0 = performance.now(); window.drawFrame(f); return performance.now() - t0; }, f);
  tot += ms;
  const b64 = await page.evaluate(() => document.getElementById('c').toDataURL('image/png').split(',')[1]);
  ff.stdin.write(Buffer.from(b64, 'base64'));
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log('avg draw ms/frame', (tot / frames).toFixed(1), '->', out);
await browser.close();

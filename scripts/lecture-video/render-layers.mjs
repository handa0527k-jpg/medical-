/**
 * Render a 授業動画 package's picture layers with the MEDSTUDY app itself (headless Chromium):
 *   layers/plate_%05d.jpg    the Wan stand-in (animatic background; replaced by Wan clips where they exist)
 *   layers/overlay_%05d.png  MEDSTUDY's exact figure / board / labels / FX on transparency
 *   keyframes/<shot>.png     text-free start image of every Wan shot (image-to-video)
 *
 * The package's audio/kokoro_timing.json (from `medstudy_video.py tts`) is handed to the page first, so
 * every event lands on the measured moment the lecturer says the word.
 *
 *   node scripts/lecture-video/render-layers.mjs <package-dir> [--base http://localhost:5199]
 *        [--theme genetics-basics:1:2] [--d 30] [--style board] [--k gekiga] [--fps 24] [--workers 3]
 *        [--range t0,t1]  only the frames of that span
 *        [--full]   only the composited animatic (layers/full_%05d.jpg) — 3× faster; for films with no Wan clip yet
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const pkg = resolve(args[0] ?? '.');
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const base = opt('--base', 'http://localhost:5199');
const fps = Number(opt('--fps', 24));
const q = new URLSearchParams({ course: opt('--course', 'genetics-basics'), theme: opt('--theme', 'genetics-basics:1:2'), d: opt('--d', '30'), style: opt('--style', 'board'), k: opt('--k', 'gekiga') });
const timingFile = join(pkg, 'audio', 'kokoro_timing.json');

const workers = Math.max(1, Number(opt('--workers', 3)));
const fullOnly = args.includes('--full');
// --range 115.2,133.1 re-renders only the frames of that time span (after a fix to one scene)
const range = opt('--range', '') ? opt('--range').split(',').map(Number) : null;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const errors = [];
async function openPage() {
  const page = await b.newPage({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/#/category/genetics/video?${q}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__lv && window.__lvImport, null, { timeout: 90000 });
  if (existsSync(timingFile)) {
    const k = JSON.parse(readFileSync(timingFile, 'utf8'));
    await page.evaluate((j) => window.__lvImport(j), k);
    await page.waitForFunction(() => window.__lv.info().source === 'kokoro', null, { timeout: 20000 });
  }
  const lettering = await page.evaluate(() => window.__lv.fonts());
  if (!lettering) console.warn('  warning: lettering fonts did not load — fallback fonts are used');
  return page;
}
const pages = await Promise.all(Array.from({ length: workers }, openPage));
const info = await pages[0].evaluate(() => window.__lv.info());
console.log(`${info.key}  ${info.total.toFixed(2)} s  timing=${info.source}  workers=${workers}`);
// Frames are interleaved across workers, so every worker must draw a moment identically — otherwise the
// film shakes frame to frame (e.g. a font piece loaded in one worker but not another). Check before rendering.
{
  const probes = [0.25, 0.5, 0.75].map((k) => info.total * k);
  const shots = await Promise.all(pages.map((p) => p.evaluate((ts) => ts.map((t) => window.__lv.frame(t, 'full', 'image/png')), probes)));
  const bad = shots.findIndex((s) => s.some((u, i) => u !== shots[0][i]));
  if (bad >= 0) { console.error(`  workers draw differently (worker ${bad} ≠ worker 0) — not rendering`); await b.close(); process.exit(1); }
  console.log(`  ${workers} workers draw identical frames`);
}
mkdirSync(join(pkg, 'layers'), { recursive: true });
mkdirSync(join(pkg, 'keyframes'), { recursive: true });
const bytes = (u) => Buffer.from(u.split(',')[1], 'base64');
for (const j of info.jobs) writeFileSync(join(pkg, 'keyframes', `${j.name}.png`), bytes(await pages[0].evaluate(([t]) => window.__lv.frame(t, 'plate'), [j.t0 + 0.02])));
const n = Math.round(info.total * fps);
let done = 0;
await Promise.all(pages.map(async (page, w) => {
  for (let f = w; f < n; f += workers) {
    const t = f / fps;
    if (range && (t < range[0] || t > range[1])) continue;
    if (fullOnly) {
      writeFileSync(join(pkg, 'layers', `full_${String(f).padStart(5, '0')}.jpg`), bytes(await page.evaluate(([t]) => window.__lv.frame(t, 'full', 'image/jpeg', 0.92), [t])));
    } else {
      const [ov, pl] = await page.evaluate(([t]) => [window.__lv.frame(t, 'overlay'), window.__lv.frame(t, 'plate', 'image/jpeg', 0.9)], [t]);
      writeFileSync(join(pkg, 'layers', `overlay_${String(f).padStart(5, '0')}.png`), bytes(ov));
      writeFileSync(join(pkg, 'layers', `plate_${String(f).padStart(5, '0')}.jpg`), bytes(pl));
    }
    if (++done % 48 === 0) process.stdout.write(`\r  frames ${done}/${n}`);
  }
}));
console.log(`\r  ${n} frames → ${join(pkg, 'layers')}${errors.length ? `  errors: ${errors.join(' | ')}` : ''}`);
await b.close();

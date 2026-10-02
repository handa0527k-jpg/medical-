#!/usr/bin/env node
/**
 * Export still frames of a story anime from the running app (preview / review of motion).
 * Every frame is drawn from its playback position, so the same time always gives the same picture.
 *
 *   npx vite --port 5199 &                       # or any running build
 *   node scripts/story-frames.mjs genetics-basics out/ --at 0.5,6,12.3
 *   node scripts/story-frames.mjs genetics-basics out/ --from 0 --to 46 --fps 8 --sheet
 *   options: --base http://localhost:5199  --phone (390×844 page)  --no-subs
 *
 * Writes out/frame-<seconds>.png (the 1280×720 canvas with subtitles) and, with --sheet, out/sheet.png.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [course, out, ...rest] = process.argv.slice(2);
if (!course || !out) { console.error('usage: story-frames.mjs <course> <out-dir> [--at a,b,c | --from s --to e --fps n] [--sheet] [--phone] [--no-subs] [--base url]'); process.exit(1); }
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const flag = (k) => rest.includes(k);
const base = opt('--base', 'http://localhost:5199');
let times = opt('--at', '') ? opt('--at').split(',').map(Number) : [];
if (!times.length) { const a = Number(opt('--from', 0)), b = Number(opt('--to', 10)), fps = Number(opt('--fps', 4)); for (let t = a; t <= b + 1e-6; t += 1 / fps) times.push(Math.round(t * 1000) / 1000); }
// --scene <id>: times are relative to that scene's start
const scene = opt('--scene', '');
if (scene) {
  const def = JSON.parse(readFileSync(`src/content/courses/${course}/story/story.json`, 'utf8'));
  let T = 0, s0 = null; const seen = new Set();
  def.lines.forEach((l, i) => { if (!seen.has(l.scene)) { seen.add(l.scene); if (l.scene === scene) s0 = T; T += 1.2; } T += (l.wait || 0) + l.dur + 0.55; const n = def.lines[i + 1]; if (!n || n.scene !== l.scene) T += 1.4; });
  if (s0 == null) { console.error('no scene', scene); process.exit(1); }
  times = times.map((t) => Math.round((s0 + t) * 1000) / 1000);
}
mkdirSync(out, { recursive: true });

const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await b.newPage({ viewport: flag('--phone') ? { width: 390, height: 844 } : { width: 1400, height: 900 }, deviceScaleFactor: flag('--phone') ? 2 : 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}/#/open/${course}/animations/story?t=${times[0]}`);
await page.waitForSelector('.story-screen canvas', { timeout: 60000 });
await page.addStyleTag({ content: `.story-start{display:none!important}${flag('--no-subs') ? '.story-sub{display:none!important}' : ''}` });
await page.evaluate(() => document.fonts.ready);
const files = [];
for (const t of times) {
  await page.evaluate((tt) => { location.hash = location.hash.replace(/\?t=[^&]*/, `?t=${tt}`); }, t);
  await page.waitForTimeout(140);
  const f = join(out, `frame-${t.toFixed(2).padStart(6, '0')}.png`);
  await page.locator('.story-screen').screenshot({ path: f });
  files.push([t, f]);
}
if (flag('--sheet')) {
  const cols = 4, imgs = files.map(([t, f]) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString('base64')}"><figcaption>${t.toFixed(2)} s</figcaption></figure>`).join('');
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.setContent(`<style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px}figure{margin:0;color:#ddd;font:12px sans-serif}img{width:100%;display:block}</style>${imgs}`);
  await page.screenshot({ path: join(out, 'sheet.png'), fullPage: true });
}
writeFileSync(join(out, 'frames.json'), JSON.stringify({ course, times, errors }, null, 1));
console.log(files.length, 'frames →', out, errors.length ? `errors: ${errors.join(' | ')}` : '');
await b.close();

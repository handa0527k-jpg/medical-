// キャラクター（透過PNG）・背景・各シーンの代表カットを assets/ と output/stills/ に書き出す
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const srv = await serve(0);
const base = `http://127.0.0.1:${srv.address().port}/render/`;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
async function shot(url, out, sel = 'canvas', omit = true) {
  await page.goto(base + url);
  await page.waitForFunction(() => window.ready === true);
  await page.locator(sel).screenshot({ path: out, omitBackground: omit });
}
const C = join(ROOT, 'assets/characters'), B = join(ROOT, 'assets/backgrounds'), S = join(ROOT, 'output/stills');
for (const d of [C, B, S]) mkdirSync(d, { recursive: true });
const faces = [['normal', 'idle'], ['happy', 'open'], ['surprised', 'surprise'], ['confused', 'shrug'], ['think', 'think'], ['panic', 'panic'], ['laugh', 'cheer'], ['wink', 'point']];
for (const who of ['shun', 'sapo']) for (const [emo, pose] of faces) await shot(`export.html?who=${who}&emo=${emo}&pose=${pose}&mouth=${emo === 'happy' ? 0.6 : 0}`, join(C, `${who}_${emo}.png`));
for (const k of ['fibro', 'macro', 'plasma', 'mast', 'collagen', 'reticular', 'elastic', 'white', 'brown', 'neutro', 'tcell', 'bone', 'cartilage', 'blood', 'bacteria'])
  await shot(`export.html?who=${k}`, join(C, `cell_${k}.png`));
for (const p of ['shun', 'sapo', 'cells']) await shot(`sheet.html?page=${p}`, join(C, `sheet_${p}.png`), 'canvas', false);
for (const [n, q] of [['city', 'bg=city'], ['city_sunset', 'bg=city&warm=1'], ['site', 'bg=site'], ['ecm', 'bg=ecm'], ['factory', 'bg=factory'], ['arena', 'bg=arena'], ['plaza', 'bg=plaza'], ['warehouse', 'bg=warehouse'], ['quiz', 'bg=quiz']])
  await shot(`export.html?${q}`, join(B, `${n}.png`), 'canvas', false);
// シーンの代表カット（各シーン3枚）
const tl = JSON.parse(readFileSync(join(ROOT, 'render/data/timeline.json'), 'utf8'));
for (const sc of tl.scenes) for (const k of [0.25, 0.55, 0.85]) {
  const t = (sc.dur * k).toFixed(1);
  await page.goto(`${base}index.html?scene=${sc.id}&t=${t}`);
  await page.waitForFunction(() => window.ready === true);
  await page.waitForTimeout(100);
  await page.locator('canvas').screenshot({ path: join(S, `${sc.id}_${String(Math.round(k * 100)).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 85 });
}
await b.close(); srv.close();
console.log('assets exported');

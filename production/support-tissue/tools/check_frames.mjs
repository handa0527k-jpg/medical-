// 全シーンを step 秒ごとに描いて、描画エラー・ラベルの付け忘れを検出する：node tools/check_frames.mjs [step]
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const step = +(process.argv[2] || 0.5);
const tl = JSON.parse(readFileSync(join(ROOT, 'render/data/timeline.json'), 'utf8'));
const srv = await serve(0);
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const msgs = [];
page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') msgs.push(m.text()); });
page.on('pageerror', (e) => msgs.push('pageerror ' + e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/render/index.html?all=1&scene=s01&t=1`);
await page.waitForFunction(() => window.ready === true);
let bad = 0;
for (const sc of tl.scenes) {
  const r = await page.evaluate(([id, dur, st]) => { const errs = []; for (let t = 0; t < dur; t += st) { try { window.renderAt(id, t); } catch (e) { errs.push(`${t.toFixed(1)}: ${e.message}`); if (errs.length > 3) break; } } return errs; }, [sc.id, sc.dur, step]);
  if (r.length) { bad++; console.log(sc.id, r); } else console.log(sc.id, 'ok');
}
const uniq = [...new Set(msgs.filter((m) => !m.includes('404')))];
if (uniq.length) console.log('messages:', uniq.slice(0, 20));
await b.close(); srv.close();
process.exit(bad ? 1 : 0);

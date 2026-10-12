// YouTube thumbnails (1280x720 JPEG): a clean frame from the film (rendered with
// --clean) behind a big title -> ../film/thumbs/<id>.jpg.   node scripts/thumbnails.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const out = path.resolve(here, '../../film/out');
const dest = path.resolve(here, '../../film/thumbs');
const font = path.resolve(here, '../src/assets/ZenKakuGothicNew-Bold-lv.woff2');
const T = [
  { id: 'restriction', frame: 'restriction-008400.jpg', s: 1.3, x: 380, y: 10, c: '#ffb36b', title: '制限酵素<br><small>と</small>リガーゼ', hook: '回文 GGATCC を見つけて切る', sub: 'BamHI・DNAリガーゼの実構造' },
  { id: 'cloning', frame: 'cloning-004500.jpg', s: 0.95, x: 400, y: 10, c: '#7bed9f', title: 'プラスミドで<br>クローニング', hook: '遺伝子を大腸菌で10億倍に', sub: 'pUC18・形質転換・GFP' },
  { id: 'pcr', frame: 'pcr-010800.jpg', s: 1.9, x: 420, y: 0, c: '#ff8a8a', title: 'PCR', hook: 'DNAを何十億倍にも増やす', sub: '95℃・55℃・72℃ を原子レベルで' },
  { id: 'sanger', frame: 'sanger-015200.jpg', s: 1.3, x: 260, y: 30, c: '#ff6b9a', title: 'サンガー法', hook: 'ddNTP で止めて、文字を読む', sub: '本物の ddCTP（PDB 3KTQ）' },
  { id: 'crispr', frame: 'crispr-010600.jpg', s: 1.0, x: 400, y: 10, c: '#8fb8ff', title: 'CRISPR<br>-Cas9', hook: '狙った場所でDNAを切る', sub: 'Cas9 の実構造でゲノム編集' },
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
for (const t of T) {
  const img = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(out, t.frame)).toString('base64');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Z; src: url('file://${font}'); }
html,body { margin:0; width:1280px; height:720px; overflow:hidden; background:#04060c; font-family: 'Inter', Z, 'IPAPGothic', sans-serif; font-weight: 800; }
.bg { position:absolute; left:0; top:0; width:1280px; height:720px; transform: translate(${t.x}px, ${t.y}px) scale(${t.s}); transform-origin: 50% 50%; }
.shade { position:absolute; inset:0; background: linear-gradient(90deg, rgba(4,6,12,.96) 0%, rgba(4,6,12,.85) 34%, rgba(4,6,12,.15) 62%, rgba(4,6,12,0) 100%); }
.glow { position:absolute; inset:0; background: radial-gradient(circle at 75% 50%, ${t.c}33, transparent 55%); }
.badge { position:absolute; left:60px; top:52px; display:flex; gap:12px; }
.badge span { font-size:30px; padding:8px 18px; border-radius:12px; background:${t.c}; color:#04060c; }
.badge span.o { background:transparent; color:#fff; border:3px solid rgba(255,255,255,.75); }
h1 { position:absolute; left:56px; top:140px; margin:0; font-size:${t.title.includes('<br>') ? 112 : 170}px; line-height:1.04; color:#fff; letter-spacing:.01em; text-shadow: 0 6px 30px rgba(0,0,0,.8), 0 0 2px #000; }
h1 small { font-size:.6em; }
.hook { position:absolute; left:60px; bottom:120px; font-size:46px; color:${t.c}; text-shadow:0 3px 18px rgba(0,0,0,.9); }
.sub { position:absolute; left:62px; bottom:62px; font-size:28px; color:#dfe7f5; opacity:.9; }
.brand { position:absolute; right:40px; bottom:34px; font-size:22px; color:#fff; opacity:.7; letter-spacing:.12em; }
</style></head><body>
<img class="bg" src="${img}"><div class="glow"></div><div class="shade"></div>
<div class="badge"><span>3Dアニメ授業</span><span class="o">本物の分子で見る</span></div>
<h1>${t.title}</h1><div class="hook">${t.hook}</div><div class="sub">${t.sub}</div><div class="brand">GENE LAB 3D</div>
</body></html>`;
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const file = path.join(dest, `${t.id}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
  console.log(file);
}
await browser.close();

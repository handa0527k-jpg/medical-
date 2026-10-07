// YouTube thumbnail (1280×720): node src/thumbnail.mjs youtube/thumbnail.jpg
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { sprite, FONT, C } from './engine.mjs';
import './sprites.mjs';

const W = 1280, H = 720, P = 4; // one art pixel = 4 screen pixels
const cv = createCanvas(W, H), g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
// night sky in bands, stars
['#05061a', '#0a0d2b', '#101640', '#18205a', '#22297a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 144, W, 144); });
let s = 9; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.2 ? C.z : C.L; const x = Math.floor(r() * W / P) * P, y = Math.floor(r() * H * 0.75 / P) * P; g.fillRect(x, y, P, P); }
// a big double helix on the right
const cols = ['#3fb54a', '#d8344a', '#f7c948', '#3a5fcd'];
for (let j = 0; j < 150; j++) {
  const y = 40 + j * P, ph = j * 0.11;
  const a = Math.sin(ph) * 120, x0 = 1040;
  if (j % 6 === 0) { g.fillStyle = cols[(j / 6) % 4]; const xa = Math.min(x0 + a, x0 - a), w = Math.abs(2 * a); g.fillRect(Math.round(xa / P) * P, y, Math.round(w / P) * P, P); }
  g.fillStyle = Math.cos(ph) > 0 ? '#e6ecff' : '#6878a8'; g.fillRect(Math.round((x0 + a) / P) * P, y, P * 3, P);
  g.fillStyle = Math.cos(ph) <= 0 ? '#e6ecff' : '#6878a8'; g.fillRect(Math.round((x0 - a) / P) * P, y, P * 3, P);
}
// ground
g.fillStyle = '#1a1030'; g.fillRect(0, 600, W, 120);
g.fillStyle = '#2a1a40'; for (let x = 0; x < W; x += 32) g.fillRect(x, 600, 16, 8);
const put = (name, cx, by, sc, flip = false) => { const sp = sprite(name); const w = sp.width * sc, h = sp.height * sc; g.save(); g.translate(Math.round(cx - w / 2) + (flip ? w : 0), by - h); if (flip) g.scale(-1, 1); g.drawImage(sp, 0, 0, w, h); g.restore(); };
// glow behind the hero
g.globalAlpha = 0.18; g.fillStyle = C.z; g.beginPath(); g.arc(230, 520, 150, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
put('heroV', 230, 640, 10);
put('owl', 470, 630, 7, true);
put('crab', 620, 640, 6);
put('dragon', 760, 640, 6, true);
put('fairy', 900, 600, 6);
// a slash of light across the helix (CRISPR)
g.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) g.fillRect(1180 - i * 6, 120 + i * 6, 8, 8);
// text with a thick outline
function title(str, x, y, size, fill, stroke = '#0b0a14', lw = 14, align = 'left') {
  g.font = `${size}px ${FONT}`; g.textAlign = align; g.textBaseline = 'top'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = lw; g.strokeText(str, x, y);
  g.fillStyle = fill; g.fillText(str, x, y);
}
title('遺伝子工学を', 40, 34, 96, '#ffffff');
title('RPGで全クリ！', 40, 140, 128, C.y, '#0b0a14', 18);
// the RPG window band with the subtitle
g.fillStyle = '#06061aee'; g.fillRect(40, 288, 640, 84);
g.fillStyle = '#ffffff'; g.fillRect(48, 294, 624, 4); g.fillRect(48, 358, 624, 4); g.fillRect(44, 298, 4, 60); g.fillRect(672, 298, 4, 60);
g.font = `44px ${FONT}`; g.textAlign = 'left'; g.fillStyle = '#ffffff'; g.fillText('制限酵素 → PCR → CRISPR', 64, 304);
title('GENE QUEST', 1240, 640, 56, C.y, '#0b0a14', 10, 'right');
// a level-up badge
g.fillStyle = C.r; g.fillRect(1000, 30, 240, 64); g.fillStyle = '#0b0a14'; g.fillRect(1006, 36, 228, 52);
g.font = `40px ${FONT}`; g.textAlign = 'center'; g.fillStyle = C.z; g.fillText('8分で Lv30', 1120, 44);
writeFileSync(process.argv[2] || 'youtube/thumbnail.jpg', cv.toBuffer('image/jpeg', 92));

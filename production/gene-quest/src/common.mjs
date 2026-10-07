// GENE QUEST — pieces shared by every scene (item get, level up, portraits, chapter titles).
import { C, LW, spr, win, wtext, text, hi, sprite, popWin, banner, ring, line, px, easeOut, clamp, sparkle } from './engine.mjs';

export const HERO = 'ルミナ';
export const SAGE = '賢者オウルベルト';

// the sage, with his monocle and a staff
export function owl(L, x, y, t, { flip = false, scale = 2 } = {}) {
  const s = scale, yy = y + (Math.floor(t * 1.5) % 2 ? 0 : -s);
  const sx = flip ? x - 13 * s : x + 13 * s;
  line(L, sx, yy - 30 * s, sx, yy, C.N, s + 1);
  ring(L, sx, yy - 32 * s, 2 * s, C.y, s);
  spr(L, 'owl', x, yy, { flip, scale: s });
  // monocle over the eye on the staff side
  const mx = x + (flip ? -5 : 5) * s, my = yy - 13 * s;
  ring(L, mx, my, 4 * s, C.y, s);
  line(L, mx + (flip ? -3 : 3) * s, my + 3 * s, mx + (flip ? -4 : 4) * s, my + 9 * s, C.Y);
}

// sprite drawn on the hi layer (above windows), scale in hi pixels per sprite pixel
export function hiSprite(f, name, x, y, scale = 4, z = 3) {
  hi(f, z, U => { const s = sprite(name); U.imageSmoothingEnabled = false; U.drawImage(s, Math.round(x * 2), Math.round(y * 2), s.width * scale, s.height * scale); }, false);
}

// portrait of whoever speaks (used for the sage's lines)
export function portrait(f, t, name = 'owl', label = SAGE) {
  if (t < 0) return;
  const x = 384, y = 112, w = 88, h = 92;
  if (!popWin(f, t, x, y, w, h, { z: 2 })) return;
  hiSprite(f, name, x + 19, y + 14, 5, 3);
  wtext(f, x + w / 2, y + h - 16, '賢者', { align: 'center', c: C.y });
}

// "ルミナは ○○を てにいれた！"
export function itemGet(f, L, t, item, { x = 240, y = 72, dur = 3.2, icon = null, iconFn = null } = {}) {
  if (t < 0 || t > dur) return;
  const a = Math.min(1, (dur - t) / 0.3);
  const msg = `${HERO}は ${item}を てにいれた！`;
  const w = Math.max(200, [...msg].length * 8 + 34);
  win(f, x - w / 2, y, w, 28, { z: 5, alpha: a });
  wtext(f, x - w / 2 + 28, y + 9, msg, { z: 6, alpha: a });
  if (iconFn) iconFn(x - w / 2 + 8, y + 6);
}

export function levelUp(f, t, lv, { x = 240, y = 104, dur = 2.6 } = {}) {
  if (t < 0 || t > dur) return;
  const a = Math.min(1, (dur - t) / 0.3);
  const k = easeOut(t / 0.25);
  win(f, x - 92, y, 184, 28, { z: 5, alpha: a });
  wtext(f, x, y + 9, `レベルが ${lv} に あがった！`, { z: 6, align: 'center', c: k >= 1 && Math.floor(t * 6) % 2 ? C.z : C.w, alpha: a });
}

export function chapter(f, t, no, name, sub, o = {}) { banner(f, t - 0.2, no ? `第${no}章　${name}` : name, sub, o); }

// a small caption window (on-screen notes; not voiced)
export function note(f, t, x, y, lines, { w = null, c = C.w, title = null, tc = C.y, z = 2 } = {}) {
  if (t < 0) return false;
  const width = w || Math.max(...lines.map(s => [...s].reduce((a, ch) => a + (/[\x20-\x7e]/.test(ch) ? 4 : 8), 0))) + 18;
  const h = lines.length * 12 + (title ? 12 : 0) + 10;
  if (!popWin(f, t, x, y, width, h, { z })) return false;
  let yy = y + 6;
  if (title) { wtext(f, x + 9, yy, title, { c: tc, z: z + 1 }); yy += 12; }
  lines.forEach((s, i) => wtext(f, x + 9, yy + i * 12, s, { c, z: z + 1 }));
  return true;
}

export function flashAt(f, t, at, col = '#ffffff', dur = 0.25) { const k = (t - at) / dur; if (k >= 0 && k < 1) f.flash = [col, 0.7 * (1 - k)]; }
export function shakeAt(f, t, at, amp = 2, dur = 0.35) { const k = (t - at) / dur; if (k >= 0 && k < 1) { const a = amp * (1 - k); f.shake = [Math.round(Math.sin(t * 90) * a), Math.round(Math.cos(t * 70) * a)]; } }
export { sparkle };

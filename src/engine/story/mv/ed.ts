/**
 * Ending: 魔王魂「The milky way」(short version, played to its own end) — the learning summary.
 * The hero walks slowly along a hill under the night sky that turns to dawn; one summary card
 * (しくみ / たとえ / 要点 from the story's points table) per phrase, changing on bar lines; a staff roll at the end.
 */
import { CL, H, L, W, g, rr } from '../kit';
import { camera, perform, type Take } from '../mocap';
import { MUSIC, shot, sections, ease, hex, mixHex, plain, silhouette, span, text, wrap, GOTHIC, MINCHO, HAND, type MvCtx } from './common';

const S = MUSIC.ed, SEC = sections(S);
export const ED_LENGTH = S.len;
const clean = (s: string) => plain(s).replace(/\s+/g, ' ');

function stars(t: number, a: number) {
  for (let i = 0; i < 160; i++) {
    const r = Math.sin(i * 78.233) * 43758.5453, fr = r - Math.floor(r);
    const x = (i * 157.3 + t * (2 + fr * 4)) % W, y = (i * 37.7) % (H * 0.7);
    g.fillStyle = `rgba(255,255,240,${a * (0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + fr) + i)))})`;
    g.beginPath(); g.arc(x, y, 0.6 + fr * 1.6, 0, 7); g.fill();
  }
  // the milky way: a soft diagonal band
  g.save(); g.globalAlpha = 0.35 * a; const gr = g.createLinearGradient(0, H * 0.6, W, 0); gr.addColorStop(0.3, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(200,210,255,.6)'); gr.addColorStop(0.7, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
}
function shootingStar(t: number, at: number) { const u = (t - at) / 1.2; if (u < 0 || u > 1) return; const x = L(W * 0.85, W * 0.35, u), y = L(60, 260, u); g.strokeStyle = `rgba(255,255,255,${1 - u})`; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 140, y - 56); g.stroke(); }

/** the summary cards: one per row of the points table, on bar lines from the verse to the climax */
function cards(c: MvCtx, t: number) {
  const rows = c.def.points?.rows ?? [];
  if (!rows.length) return;
  if (t < SEC.verse || t >= SEC.climax) return;
  const { i, u, len } = shot(S, SEC.verse, SEC.climax, rows.length, t);
  const k = span(u, 0, 0.9, ease.out) * (1 - span(u, len - 0.7, len));
  const [name, ana, gist] = rows[i].map(clean);
  const head = c.def.points?.head ?? ['しくみ', 'たとえ', '要点'];
  const hero = c.def.cast[0]?.color ?? '#d57f45';
  g.save(); g.globalAlpha = k; g.translate(0, L(18, 0, k));
  const lines = wrap(gist, 36).slice(0, 4), ch = 160 + lines.length * 36 + 24; // the card fits its text
  g.fillStyle = 'rgba(14,18,40,.62)'; rr(W / 2 - 470, 96, 940, ch, 22); g.fill();
  g.strokeStyle = hex(hero, 0.8); g.lineWidth = 2; rr(W / 2 - 470, 96, 940, ch, 22); g.stroke();
  text(`${i + 1} / ${rows.length}`, W / 2 + 440, 136, 16, '#c8d0ff', 1, 'right', GOTHIC, 700);
  text(name, W / 2, 168, 40, '#ffffff', 1, 'center', MINCHO, 900);
  text(`${head[1] ?? 'たとえ'}：${ana}`, W / 2, 214, 20, '#ffd9a0', 1, 'center', HAND, 600);
  lines.forEach((ln, j) => text(ln, W / 2, 268 + j * 36, 23, '#eef0ff', span(u, 0.5 + j * 0.35, 1.2 + j * 0.35), 'center', GOTHIC, 700));
  g.restore();
}

function staff(c: MvCtx, t: number) {
  const a = SEC.climax, u = t - a;
  const lines: [string, string][] = [
    ['ストーリーアニメ', c.def.title],
    ['医学的内容', '講義資料に基づく（各場面に出典スライド）'],
    ['原作・脚本・絵', 'MED·STUDY'],
    ['声', '音声合成'],
    ['モーション', 'CMU Graphics Lab Motion Capture Database'],
    ['オープニングテーマ', `「${MUSIC.op.title}」 魔王魂`],
    ['エンディングテーマ', `「${S.title}」 魔王魂`],
  ];
  const y0 = H + 20 - u * 62; // the roll clears the screen before 「おわり」
  lines.forEach(([r, n], i) => { const y = y0 + i * 74; if (y < 40 || y > H + 40) return; const a2 = CL(Math.min((y - 40) / 80, (H - y) / 80)); text(r, W * 0.75, y, 16, '#c8d0ff', a2, 'center', GOTHIC, 700); text(n, W * 0.75, y + 30, 20, '#ffffff', a2, 'center', MINCHO, 800); });
  const fin = span(t, SEC.outro + 2.5, SEC.outro + 3.6); // after the roll, while the hero stands still
  text('おわり', W * 0.75, H / 2, 54, '#ffffff', fin, 'center', MINCHO, 900);
}

/** draw ending frame at song time t */
export function drawED(c: MvCtx, t: number) {
  const dawn = span(t, SEC.chorus, SEC.climax + 6);
  // sky: night → dawn
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, mixHex('#060a22', '#3a5aa8', dawn)); gr.addColorStop(0.65, mixHex('#141a44', '#f0a880', dawn)); gr.addColorStop(1, mixHex('#1a1630', '#ffd8a8', dawn));
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  stars(t, 1 - dawn * 0.85);
  shootingStar(t, SEC.climax + 0.2); shootingStar(t, SEC.break + 1.0);
  // the hill and the hero walking slowly to the right; the camera follows with a little lag
  const hero = c.def.cast[0], col = hero?.color ?? '#d57f45';
  const walkStart = 3.0, stop = SEC.outro + 2;
  const takes: Take[] = [{ clip: 'walk', at: walkStart, x: -1, z: 0, face: Math.PI / 2, travel: true }, { clip: 'stand', at: stop, from: 1, x: 0, z: 0, face: 0.4, blend: 0.8 }];
  const pose = perform(takes.slice(0, 1), Math.min(t, stop));
  const px = pose.p[0][0];
  const camX = px + 0.4;
  // parallax hills (move with the camera at different rates)
  const ph = camX * 0.08;
  g.fillStyle = mixHex('#0c1030', '#4a3a5a', dawn); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, H * 0.7 - Math.sin(x * 0.004 + ph) * 30); g.lineTo(W, H); g.fill();
  g.fillStyle = mixHex('#05081a', '#2a2036', dawn); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, H * 0.86 - Math.sin(x * 0.006 + camX * 0.25) * 8); g.lineTo(W, H); g.fill();
  const full = t < stop ? pose : perform([{ ...takes[0] }, { ...takes[1], x: px, z: pose.p[0][2] }], t);
  // a level camera high enough that the hero walks along the bottom, below the cards
  silhouette(camera({ x: camX, y: 3.4, z: 7.2, tx: camX, ty: 3.4, tz: 0, f: 560 }), full, mixHex(col, '#04050c', 0.72), { rim: hex('#ffd8a8', 0.3 + dawn * 0.6), rimSide: 1 });
  // title block in the intro
  const ti = span(t, 2.4, 4.2) * (1 - span(t, SEC.verse - 1.2, SEC.verse - 0.2));
  text('学習のまとめ', W / 2, H * 0.36, 48, '#ffffff', ti, 'center', MINCHO, 900);
  text(c.def.title, W / 2, H * 0.36 + 50, 24, '#ffd9a0', ti, 'center', MINCHO, 800);
  text(`エンディングテーマ「${S.title}」 魔王魂`, 70, H - 60, 18, '#e8ecff', ti, 'left', GOTHIC, 700);
  cards(c, t);
  if (t >= SEC.climax) staff(c, t);
  // fade in from black and out with the song
  g.save(); g.globalAlpha = CL(1 - span(t, 0.2, 1.6)); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalAlpha = span(t, S.end - 0.6, S.len); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.restore();
  void HAND;
}

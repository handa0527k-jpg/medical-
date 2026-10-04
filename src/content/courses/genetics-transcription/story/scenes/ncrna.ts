/**
 * Scene 6「写しにならない写し」: the corridor to the gate, shelves of copies that never go out; Jin walks right
 * with the finished copy, Deo by the shelves → insert: transcripts by kind (slide 55) and the RNAs that work as
 * RNA — rRNA, tRNA, miRNA, lncRNA (56, 67, 68) → Jin → Deo: most still unknown, some you cannot lose →
 * insert: deletions of the snoRNA cluster (chr 15) and the miRNA cluster (chr 13) (56).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { DEO, JIN } from '../cast';
import { COL, GOTHIC, arrowP, blinkAt, blob, bust, corridor, cues, insert, plate, ribbon, sun, talk, txt } from '../sets';

const { c, e, d } = cues('ncrna');
const DONE: [number, number, 'ex' | 'in'][] = [[0, 0.36, 'ex'], [0.36, 0.66, 'ex'], [0.66, 1, 'ex']];

function walk(t: number) {
  const go = span(t, 0.3, c[2] - 0.4, (x) => x * x * (3 - 2 * x)), jx = L(-80, 620, go), walking = go > 0 && go < 1;
  shot({ x: L(560, 660, go), y: 380, z: 1.05 }, 1, () => {
    g.drawImage(corridor(), 0, 0); sun(t, 0.6);
    drawFigure(DEO, { x: 900, y: 692, s: 460, dir: -1, t, yaw: -0.4, light: -1, blink: blinkAt(t, 4), mouth: talk(t, c[1], e[1]), gazeX: -0.6, gazeY: 0.1, smile: 0.2,
      armN: t > c[1] ? { at: [L(860, 980, span(t, c[1], c[1] + 1)), L(560, 420, span(t, c[1], c[1] + 1))], grip: 0.2 } : { hand: [0.2, 1.3], grip: 0.4 }, armF: { hand: [0.2, 1.3], grip: 0.4 } });
    drawFigure(JIN, { x: jx, y: 700, s: 440, dir: 1, t, yaw: walking ? 0.75 : 0.5, light: -1, blink: blinkAt(t, 1), gazeX: walking ? 0.8 : 0.9, gazeY: walking ? 0.1 : -0.1, smile: 0.2,
      walk: walking ? { p: jx / 48, amt: 1 } : undefined, armN: { at: [jx + 60, 520], grip: 1 }, holdN: (hx, hy) => ribbon([[hx - 10, hy], [hx + 150, hy + 6]], 14, { parts: DONE, cap: 1, tail: 1 }), armF: { hand: [0.25, 1.25], grip: 1 } });
  });
}

function kinds(t: number, u: number) {
  insert('RNAのまま働く写し（非コードRNA）', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    // transcript counts (slide 55)
    const bar = span(u, 0.5, 2.5, ease.out), tot = 60483, x0 = 140, w = 1000, y = 150;
    const parts: [string, number, string][] = [['ノンコーディングRNA 25,794', 25794, '#9b74c8'], ['メッセンジャーRNA 19,814', 19814, '#4fa3d8'], ['その他（偽遺伝子など） 14,285', 14285, '#c8c0b0']];
    let px = x0; parts.forEach(([n, v, col]) => { const pw = (v / tot) * w * bar; g.fillStyle = col; rr(px, y, Math.max(0, pw - 3), 44, 6); g.fill(); txt(n, px + pw / 2, y + 74, 16, '#1f2a3a', bar, 'center', GOTHIC, 800); px += pw; });
    txt('ヒト全転写物 60,483（スライド55）', W / 2, y - 18, 18, '#1f2a3a', bar, 'center', GOTHIC, 800);
    // four cards
    const card = (i: number, title: string, sub: string, draw: (cx: number, cy: number) => void) => {
      const a = span(u, 3 + i * 3.2, 3.8 + i * 3.2, ease.out); if (a <= 0) return;
      const cx = 220 + i * 280, cy = 400;
      g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(255,255,255,.95)'; rr(cx - 125, cy - 110, 250, 250, 16); g.fill(); g.strokeStyle = 'rgba(31,58,95,.2)'; g.lineWidth = 2; g.stroke(); g.restore();
      txt(title, cx, cy - 76, 22, '#1f2a3a', a, 'center', GOTHIC, 800);
      g.save(); g.globalAlpha = a; draw(cx, cy + 10); g.restore();
      txt(sub, cx, cy + 116, 14, '#5a6b80', a, 'center', GOTHIC, 700);
    };
    card(0, 'rRNA', 'リボソームの部品', (x, y) => { blob(x, y - 10, 60, 40, '#a8c86a', '', 1); blob(x + 6, y + 36, 42, 26, '#7aa84a', '', 1); });
    card(1, 'tRNA', 'アミノ酸を運ぶ', (x, y) => { g.strokeStyle = '#d06a3a'; g.lineWidth = 6; [[0, -40], [-36, 0], [36, 0], [0, 40]].forEach(([dx, dy]) => { g.beginPath(); g.arc(x + dx, y + dy, 16, 0, 7); g.stroke(); }); });
    card(2, 'miRNA', '約22塩基・翻訳を抑える', (x, y) => { g.strokeStyle = COL.rna; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 70, y + 30); g.lineTo(x + 70, y + 30); g.stroke(); g.strokeStyle = '#7d5aa8'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 20, y + 18); g.lineTo(x + 20, y + 18); g.stroke(); blob(x, y - 26, 40, 24, '#7d5aa8', 'RISC', 1, '#ffffff', 14); txt('翻訳 ✕', x, y + 64, 16, '#c0392b', 1, 'center', GOTHIC, 800); });
    card(3, 'lncRNA', 'キャップ・ポリA・スプライシング、翻訳されない', (x, y) => { ribbon([[x - 80, y + 10], [x + 80, y + 10]], 18, { cap: 1, tail: 1 }); txt('翻訳 ✕', x, y + 60, 16, '#c0392b', 1, 'center', GOTHIC, 800); });
    plate('スライド56・67・68', W / 2, 604, 16, '#1f2a3a', 'rgba(255,255,255,.95)', span(u, 15, 16));
  }, 'スライド55・56・67・68');
  void t;
}

function disease(t: number, u: number) {
  insert('非コードRNA遺伝子の欠失と疾患', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const chrom = (x: number, y: number, h: number, col: string) => { g.fillStyle = col; rr(x - 26, y - h / 2, 52, h, 26); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - 26, y - h * 0.18, 52, 6); };
    const a1 = span(u, 0.6, 1.6), a2 = span(u, 7, 8);
    g.globalAlpha = a1; chrom(260, 250, 190, '#8a9ab0'); g.globalAlpha = 1;
    txt('15番染色体', 260, 380, 20, '#1f2a3a', a1, 'center', GOTHIC, 800);
    const gap1 = span(u, 2, 3); if (gap1 > 0) { g.fillStyle = '#f2f7fc'; g.fillRect(230, 270, 60, 30 * gap1); plate('snoRNA遺伝子群の欠失', 300, 290, 16, '#ffffff', '#c0392b', gap1, 'left'); }
    arrowP(380, 270, 520, 270, '#c0392b', span(u, 3, 4), 4);
    plate('Prader-Willi症候群', 540, 250, 22, '#ffffff', '#c0392b', span(u, 3.6, 4.4), 'left');
    txt('肥満・性腺機能低下・認知障害', 548, 300, 18, '#1f2a3a', span(u, 4.2, 5), 'left', GOTHIC, 700);
    g.globalAlpha = a2; chrom(260, 490, 170, '#8a9ab0'); g.globalAlpha = 1;
    txt('13番染色体', 260, 606, 20, '#1f2a3a', a2, 'center', GOTHIC, 800);
    const gap2 = span(u, 8, 9); if (gap2 > 0) { g.fillStyle = '#f2f7fc'; g.fillRect(230, 500, 60, 28 * gap2); plate('miRNA遺伝子群の欠失', 300, 516, 16, '#ffffff', '#c0392b', gap2, 'left'); }
    arrowP(380, 490, 520, 490, '#c0392b', span(u, 9, 10), 4);
    plate('Feingold症候群', 540, 470, 22, '#ffffff', '#c0392b', span(u, 9.6, 10.4), 'left');
    txt('小頭症・低身長・手指の奇形を特徴とする骨格系疾患', 548, 520, 18, '#1f2a3a', span(u, 10.2, 11), 'left', GOTHIC, 700);
    txt('※染色体と欠失の位置は模式図', 1140, 110, 14, '#5a6b80', a1, 'right', GOTHIC, 600);
  }, 'スライド56');
  void t;
}

export function ncrna(t: number, dd: number) {
  const hh = handheld(t, 1.2, 61);
  const cut = [c[2] - 0.2, c[3] - 0.2, c[4] - 0.2, c[5] - 0.2];
  if (t < cut[0]) walk(t);
  else if (t < cut[1]) kinds(t, t - cut[0]);
  else if (t < cut[2]) {
    g.drawImage(corridor(), -300, -160, W * 1.55, H * 1.55); wash('#fff6e6', 0.2); sun(t, 0.5);
    bust(JIN, 560 + hh[0], 340 + hh[1], 320, { yaw: 0.4, gazeX: 0.7, gazeY: 0.1, mouth: talk(t, c[3], e[3]), blink: blinkAt(t, 1), smile: 0.45 }, t, -1);
  } else if (t < cut[3]) {
    g.drawImage(corridor(), -700, -160, W * 1.55, H * 1.55); wash('#fff6e6', 0.2); sun(t, 0.5);
    bust(DEO, 700 + hh[0], 330 + hh[1], 320, { yaw: -0.3, gazeX: -0.6, gazeY: 0.15, mouth: talk(t, c[4], e[4]), blink: blinkAt(t, 4), brow: 0.25 }, t, -1);
    plate('ncRNA遺伝子の多くは、機能が未解明（スライド55）', 640, 90, 20, '#ffffff', '#1f3a5f', span(t, c[4] + 0.5, c[4] + 1.5));
  } else disease(t, t - cut[3]);
  cut.forEach((x) => wash('#0a0806', CL(1 - Math.abs(t - x) / 0.22) * 0.35));
  wash('#0a0806', 1 - span(t, 0, 0.6));
  wash('#0a0806', span(t, d - 0.6, d));
  grain(t, 0.03);
  void dd; void H;
}

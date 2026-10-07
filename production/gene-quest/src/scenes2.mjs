// GENE QUEST — scenes 10–22: viral vectors, libraries, PCR, VNTR, electrophoresis, RT-PCR/qPCR,
// Sanger, NGS, RNA-seq, genome editing, DSB repair, the final battle, the epilogue.
import { C, BASE, BASE_TXT, LW, LH, rect, px, line, circle, ring, ellipse, dither, vgrad, stars, spr, shadow, text, seq, win, wtext, popWin, cursor, popup, sparkle, swirl, clamp, lerp, ease, easeOut, easeIn, prog, pulse, rng, hi } from './engine.mjs';
import { board, sky, clouds, grass, floorTiles, brickWall, woodWall, sea, night, windowLight, torch, vignette, walker, bob, duplex, strand, dsBar, plasmid, bacterium, cellBox, gel, band, helix, icon, comp } from './kit.mjs';
import { owl, hiSprite, itemGet, levelUp, chapter, note, flashAt, shakeAt, HERO } from './common.mjs';

const S = (b, i, d = 0) => (b.L[i] ? b.L[i].s : 0) + d;
const E = (b, i, d = 0) => (b.L[i] ? b.L[i].e : 0) + d;

// a battle backdrop (black field with a horizon of light)
function battleBg(L, t, tint = '#1a1440') {
  vgrad(L, 0, 0, LW, LH, ['#000000', '#05030f', tint, '#05030f']);
  for (let i = 0; i < 8; i++) { const y = 150 + i * 6; L.globalAlpha = 0.15 + i * 0.04; rect(L, 0, y, LW, 1, '#6a5acd'); }
  L.globalAlpha = 1;
}
// enemy name / battle message window at the top (the bottom one is the narration)
function battleMsg(f, t, str) { if (t < 0) return; if (popWin(f, t, 110, 8, 260, 24, { z: 4 })) wtext(f, 240, 14, str.slice(0, Math.floor(t * 40)), { align: 'center', z: 5 }); }
function hpBar(f, L, x, y, w, k, label) { rect(L, x - 1, y - 1, w + 2, 5, C.k); rect(L, x, y, w, 3, '#3a1020'); rect(L, x, y, Math.round(w * k), 3, k > 0.3 ? C.g : C.r); if (label) text(f, x + w / 2, y - 11, label, { align: 'center', c: C.w }); }

// ── 3:15 第7章 宅配の港：ウイルスベクター ───────────────────────────────
const VIR = [
  ['AAV', 'アデノ随伴', ['ssDNA 約5 kb', '組み込み：なし', '長期（非分裂細胞）', '拡散防止 P1'], C.m],
  ['アデノ', 'アデノウイルス', ['dsDNA 約36 kb', '組み込み：なし', '一過性', '拡散防止 P2'], C.p],
  ['レンチ', 'レトロウイルス', ['ssRNA 8–9 kb', '組み込み：あり', '長期', '拡散防止 P2'], C.o],
];
export function harbor(b) {
  const at = [S(b, 0, 3.4), S(b, 0, 7.1), S(b, 0, 9.9)], sail = E(b, 0, 0.3), item = E(b, 1, 0.6);
  return {
    se: [[0.2, 'fanfareS'], [0.4, 'horn'], ...at.map(a => [a, 'bell']), [sail, 'horn'], [sail + 2.6, 'sparkle'], [item, 'item'], [item + 1.6, 'levelup']],
    draw(f, t) {
      const { L } = f;
      sky(L, ['#5aa0e8', '#7ab8f0', '#9ccff6', '#c4e4fa'], 130); clouds(L, t, 14, 9);
      sea(L, t, 130);
      rect(L, 0, 186, 120, 10, '#8a5a3b'); for (let x = 4; x < 120; x += 14) rect(L, x, 196, 4, 12, '#5a3a25');
      spr(L, 'gull', 30, 186 + bob(t, 1), { scale: 2 }); spr(L, 'hero', 80, 186, { scale: 2 });
      VIR.forEach(([name, fam, stats, col], i) => {
        const sx0 = 190 + i * 100, sy = 178;
        const k = t > sail ? easeIn(prog(t, sail + i * 0.3, sail + 2.4 + i * 0.3)) : 0;
        const x = sx0 + k * 320, y = sy + Math.round(Math.sin(t * 2 + i) * 1);
        spr(L, 'ship', x, y, { scale: 3 });
        rect(L, x - 2, y - 36, 12, 7, col); // the flag
        text(f, x, y - 2, name, { align: 'center', c: C.w, z: 1 });
        const on = t > at[i];
        if (on && t < sail + 0.6) {
          const wx = 106 + i * 124;
          if (popWin(f, t - at[i], wx, 58, 118, 70, { z: 2 })) {
            wtext(f, wx + 9, 64, name, { c: col === C.p ? C.u : col });
            wtext(f, wx + 50, 64, fam, { c: C.L });
            stats.forEach((s, j) => wtext(f, wx + 9, 78 + j * 11, s));
          }
        }
      });
      // the lentivirus ship docks into a chromosome on the far shore
      if (t > sail + 2.2) {
        const k = easeOut(prog(t, sail + 2.2, sail + 3.0));
        rect(L, 380, 150, 90, 8, C.p); rect(L, 418, 147, 6, 14, C.P);
        rect(L, 404, 150, Math.round(14 * k), 8, C.o);
        text(f, 425, 128, '宿主の染色体に組み込み', { align: 'center', c: C.o, alpha: k });
      }
      if (t > S(b, 1, 2.6)) note(f, t - S(b, 1, 2.6), 106, 58, ['AAV1：筋肉・肝臓・気道・中枢神経', 'AAV2：広い範囲の細胞・組織', 'AAV5：中枢神経・肝臓・網膜', 'AAV6：心臓・筋肉・肝臓'], { title: '血清型で 届け先が かわる（AAV）' });
      chapter(f, t, 7, '宅配の港', 'ウイルスベクター ― 遺伝子の宅配便');
      itemGet(f, L, t - item, '宅配船の乗船券', { y: 56 });
      levelUp(f, t - item - 1.6, 14, { y: 88 });
    },
  };
}

// ── 3:40 第8章 遺伝子の図書館：ライブラリー ─────────────────────────────
export function library(b) {
  const g0 = S(b, 0, 2.6), c0 = S(b, 0, 6.0), dish = S(b, 1, 0.3), probe = S(b, 1, 1.6), hit = S(b, 1, 3.4), item = E(b, 1, 1.2);
  return {
    se: [[0.2, 'fanfareS'], [0.6, 'book'], [g0, 'page'], [c0, 'page'], [dish, 'pop'], [probe, 'glow'], [hit, 'ding'], [item, 'item'], [item + 1.6, 'levelup']],
    draw(f, t) {
      const { L } = f;
      woodWall(L, 0, 150, '#5a3a25', '#4a2e1c');
      for (let i = 0; i < 8; i++) { const x = 4 + i * 60; rect(L, x, 10, 56, 140, C.N); for (let s = 0; s < 5; s++) { rect(L, x + 2, 14 + s * 27, 52, 23, '#2a1a0e'); const r = rng(i * 13 + s); for (let k = 0; k < 10; k++) rect(L, x + 3 + k * 5, 18 + s * 27 + Math.floor(r() * 4), 4, 18 - Math.floor(r() * 4), ['#7a3030', '#30507a', '#3a6a3a', '#8a7030', '#5a3a7a'][Math.floor(r() * 5)]); } }
      floorTiles(L, 150, '#6a4530', '#5a3a28');
      spr(L, 'worm', 440, 200 + bob(t, 1.5), { scale: 2 }); spr(L, 'hero', 36, 200, { scale: 2 });
      board(L, 104, 60, 300, 140);
      if (t < dish) {
        // genomic library (top row) and cDNA library (bottom row)
        const row = (y, at, src, lab, col, isc) => {
          const k = t - at; if (k < 0) return;
          text(f, 112, y - 14, lab, { c: col });
          // source
          if (isc) { for (let i = 0; i < 3; i++) { rect(L, 114, y + i * 6, 26, 2, C.c); seq(f, 140, y + i * 6 - 4, 'AAAA', { cw: 3, cols: () => C.c, size: 16 }); } }
          else { let px0 = 114, py0 = y + 6; const r = rng(3); for (let i = 0; i < 10; i++) { const nx = 114 + r() * 34, ny = y + r() * 16; line(L, px0, py0, nx, ny, C.l); px0 = nx; py0 = ny; } }
          text(f, 168, y + 2, '→', { c: C.w, alpha: clamp(k / 0.3) });
          if (k > 0.5) for (let i = 0; i < 5; i++) plasmid(L, 192 + (i % 3) * 14, y + 2 + Math.floor(i / 3) * 12, 5, [[0.1, 0.35, [C.r, C.g, C.b, C.y, C.p][i]]], { th: 2 });
          text(f, 238, y + 2, '→', { c: C.w, alpha: clamp((k - 0.8) / 0.3) });
          if (k > 1.2) for (let i = 0; i < 6; i++) bacterium(L, 262 + (i % 3) * 30, y + 2 + Math.floor(i / 3) * 14, 26, 10, { plas: [[0.1, 0.4, [C.r, C.g, C.b, C.y, C.p, C.o][i]]] });
        };
        row(86, g0, null, 'ゲノムDNAライブラリー（ゲノム全体の棚）', C.L, false);
        row(150, c0, null, 'cDNAライブラリー（発現中の遺伝子の棚）', C.c, true);
      } else {
        // screening: colony hybridization with a probe
        const cx = 196, cy = 130, r = 50;
        circle(L, cx, cy, r + 2, C.l); circle(L, cx, cy, r, '#e8d8a8');
        const rr = rng(8);
        const cols = [];
        for (let i = 0; i < 46; i++) { const a = rr() * 6.28, d = rr() * (r - 6); cols.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]); }
        const pr = clamp((t - probe) / 1.4);
        cols.forEach(([x, y], i) => {
          const target = i === 17;
          const lit = target && t > hit;
          if (lit) { L.globalAlpha = 0.4 + 0.3 * pulse(t, 2); circle(L, x, y, 6, C.z); L.globalAlpha = 1; }
          circle(L, x, y, 2, lit ? C.z : '#f4f0e0');
        });
        if (pr > 0 && pr < 1) { L.globalAlpha = 0.25; rect(L, cx - r, cy - r + pr * 2 * r - 4, 2 * r, 8, C.c); L.globalAlpha = 1; }
        text(f, 300, 76, 'プローブ', { c: C.c }); strand(f, L, 300, 96, 'GATTACA', { cw: 7, letters: false, col: C.c });
        text(f, 300, 108, '（DNA または RNA）', { c: C.L });
        if (t > hit) { const [x, y] = cols[17]; popup(f, x, y - 10, 'あたり！', t - hit, { c: C.z, dur: 2.2 }); text(f, 300, 134, '目的のクローンを', { c: C.w }); text(f, 300, 146, '選び出す', { c: C.w }); text(f, 300, 166, 'コロニー', { c: C.y }); text(f, 300, 178, 'ハイブリダイゼーション', { c: C.y }); }
      }
      chapter(f, t, 8, '遺伝子の図書館', 'ライブラリーと スクリーニング');
      itemGet(f, L, t - item, 'プローブの栞', { y: 56 });
      levelUp(f, t - item - 1.6, 15, { y: 88 });
    },
  };
}

// ── 4:05 第9章 熱竜の炉：PCR（戦闘） ──────────────────────────────────────
export function pcr(b) {
  const appear = 3.2, cmd = 4.0, spell = 5.6, L1 = S(b, 1);
  const st = [L1 + 0.4, L1 + 2.1, L1 + 4.3]; // 変性・アニーリング・伸長
  const fast = L1 + 6.4, design = S(b, 2, 0.2);
  const cycles = t => (t < st[0] ? 0 : t < fast ? 1 : Math.min(30, 1 + Math.floor((t - fast) * 4.2)));
  return {
    noFade: false,
    se: [[0.0, 'swirl'], [appear, 'encounter'], [cmd, 'menu'], [cmd + 0.9, 'cursor'], [spell, 'spell'], [st[0], 'heat'], [st[1], 'anneal'], [st[2], 'extend'],
      ...Array.from({ length: 8 }, (_, i) => [fast + i * 0.48, 'hit']), [design, 'ding'], [E(b, 2, 0.4), 'item'], [E(b, 2, 2.0), 'levelup']],
    draw(f, t) {
      const { L } = f;
      battleBg(L, t, '#3a1410');
      swirl(f, 1 - clamp(t / 0.6));
      // the party: hero and the fire dragon, seen from behind-ish
      spr(L, 'heroR', 52, 198, { scale: 2 }); spr(L, 'dragon', 100, 198 + bob(t, 2), { scale: 2 });
      battleMsg(f, t - appear, t < spell ? 'ごく微量の DNA が あらわれた！' : t < L1 + 6 ? 'ルミナは じゅもん PCR を となえた！' : `サイクル ${cycles(t)}：DNA が ふえていく！`);
      if (t > cmd && t < spell + 0.3) {
        if (popWin(f, t - cmd, 150, 150, 84, 50, { z: 4 })) { wtext(f, 170, 158, 'たたかう', { z: 5, c: C.e }); wtext(f, 170, 171, 'じゅもん', { z: 5 }); wtext(f, 170, 184, 'どうぐ', { z: 5, c: C.e }); cursor(f, 158, 171, t, 5); }
        if (t > cmd + 0.9 && popWin(f, t - cmd - 0.9, 238, 150, 74, 24, { z: 4 })) { wtext(f, 256, 157, 'PCR', { z: 5, c: C.z }); cursor(f, 244, 157, t * 3, 5, C.z); }
      }
      if (t < spell) { // the target: a lone double strand
        const y = 92 + bob(t, 1.2, 2);
        dsBar(L, 220, y, 90, C.l, 5); rect(L, 252, y, 26, 2, C.y); rect(L, 252, y + 5, 26, 2, C.y);
        if (t > appear) text(f, 265, y + 12, '増やしたい領域', { align: 'center', c: C.y });
        return;
      }
      // the thermal profile (temperature vs time), drawn as the steps are named
      board(L, 150, 40, 320, 72);
      const gx = 164, gy = 50, gw = 296, gh = 52;
      const T2y = T => gy + gh - ((T - 40) / 60) * gh;
      text(f, gx - 8, T2y(95) - 4, '95', { align: 'right', c: C.r }); text(f, gx - 8, T2y(72) - 4, '72', { align: 'right', c: C.y }); text(f, gx - 8, T2y(55) - 4, '55', { align: 'right', c: C.c });
      const prof = [[0, 30], [0.08, 95], [0.33, 95], [0.42, 55], [0.62, 55], [0.68, 72], [1, 72]];
      const k = clamp((t - st[0] + 0.4) / (st[2] + 1.6 - st[0] + 0.4));
      for (let i = 0; i < prof.length - 1; i++) {
        const [x0, T0] = prof[i], [x1, T1] = prof[i + 1];
        if (x0 > k) break;
        const xe = Math.min(x1, k), Te = lerp(T0, T1, (xe - x0) / (x1 - x0 || 1));
        line(L, gx + x0 * gw, T2y(T0), gx + xe * gw, T2y(Te), C.w, 2);
      }
      const labs = [['① 変性 95℃', 0.2, C.r], ['② アニーリング 55℃', 0.52, C.c], ['③ 伸長 72℃', 0.84, C.y]];
      if (t < design) labs.forEach(([s, x, c], i) => { if (t > st[i]) text(f, gx + x * gw, gy + gh + 2, s, { align: 'center', c, alpha: clamp((t - st[i]) / 0.3) }); });
      // the molecules
      const my = 134;
      board(L, 150, 120, 320, 78);
      const sep = t > st[0] ? easeOut(prog(t, st[0], st[0] + 0.6)) : 0;
      const ann = t > st[1] ? easeOut(prog(t, st[1], st[1] + 0.6)) : 0;
      const ext = t > st[2] ? clamp((t - st[2]) / 1.4) : 0;
      if (t < fast) {
        const yT = my + 6 - sep * 8, yB = my + 12 + sep * 8;
        rect(L, 180, yT, 260, 2, C.l); rect(L, 180, yB, 260, 2, C.l);
        rect(L, 260, yT, 100, 2, C.y); rect(L, 260, yB, 100, 2, C.y);
        if (ann > 0) {
          rect(L, 336 + (1 - ann) * 20, yT + 3, 24, 2, '#7aa2ff'); line(L, 336 + (1 - ann) * 20, yT + 4, 341 + (1 - ann) * 20, yT + 1, '#7aa2ff');
          rect(L, 260 - (1 - ann) * 20, yB - 3, 24, 2, '#ff6b6b'); line(L, 283 - (1 - ann) * 20, yB - 2, 278 - (1 - ann) * 20, yB - 5, '#ff6b6b');
        }
        if (ext > 0) { rect(L, 336 - ext * 156, yT + 3, ext * 156, 2, '#7aa2ff'); rect(L, 284, yB - 3, ext * 156, 2, '#ff6b6b'); }
        const cap = t > st[2] ? 'DNAポリメラーゼが プライマーから 相補鎖を合成' : t > st[1] ? 'プライマーが 相補的な配列に結合' : t > st[0] ? '熱で 2本鎖を分離' : '';
        if (cap) text(f, 310, 182, cap, { align: 'center', c: C.w });
        text(f, 176, yT - 10, "5'", { c: C.l, align: 'right' }); text(f, 176, yB - 2, "3'", { c: C.l, align: 'right' });
        text(f, 444, yT - 10, "3'", { c: C.l }); text(f, 444, yB - 2, "5'", { c: C.l });
      } else {
        // copies double each cycle: an array of short double bars
        const n = cycles(t), shown = Math.min(64, 2 ** Math.min(n, 6));
        for (let i = 0; i < shown; i++) { const x = 162 + (i % 16) * 19, y = 126 + Math.floor(i / 16) * 13; rect(L, x, y, 15, 2, C.y); rect(L, x, y + 4, 15, 2, C.y); }
        const num = n >= 30 ? '2の30乗 ≈ 約10億 本' : `${(2 ** n).toLocaleString()} 本`;
        text(f, 310, 182, `${n} サイクル → ${num}`, { align: 'center', c: C.z, bold: true });
        for (let i = 0; i < 8; i++) popup(f, 300 + (i % 3) * 40, 120, '×2', t - fast - i * 0.48, { c: C.z, dur: 0.6 });
        if (t > design) { // the primer pair that defines the product
          board(L, 150, 40, 320, 72);
          rect(L, 176, 66, 268, 2, C.l); rect(L, 176, 74, 268, 2, C.l); rect(L, 260, 66, 100, 2, C.y); rect(L, 260, 74, 100, 2, C.y);
          rect(L, 260, 70, 24, 2, '#ff6b6b'); line(L, 284, 71, 279, 68, '#ff6b6b');
          rect(L, 336, 70, 24, 2, '#7aa2ff'); line(L, 336, 71, 341, 68, '#7aa2ff');
          text(f, 272, 50, 'プライマー', { align: 'center', c: '#ff6b6b' }); text(f, 348, 50, 'プライマー', { align: 'center', c: '#7aa2ff' });
          text(f, 310, 82, 'この2本の間だけが 増える', { align: 'center', c: C.z });
          if (t - design < 0.6) sparkle(L, 310, 70, t - design, 12, C.z, 4, 40, 6);
        }
      }
      shakeAt(f, t, spell, 2);
      flashAt(f, t, spell, '#ff9a5a');
      chapter(f, t, 9, '熱竜の炉', 'PCR ― コピーの術', { y: 60 });
      itemGet(f, L, t - E(b, 2, 0.4), '熱竜のうろこ（PCR）', { y: 36 });
      levelUp(f, t - E(b, 2, 2.0), 17, { y: 68 });
    },
  };
}

// ── 4:30 第10章 探偵の事務所：PCRクローニングと DNA鑑定 ──────────────────
// repeat counts read off the textbook gel (three VNTR loci × two alleles)
const VNTR = { A: [[30, 10], [25, 13], [15, 4]], B: [[30, 10], [25, 20], [7, 4]], C: [[33, 4], [20, 13], [21, 11]], F: [[30, 10], [25, 20], [7, 4]] };
export function vntr(b) {
  const clone = S(b, 0, 0.8), grow = S(b, 0, 3.2), loci = S(b, 1, 0.4), gelT = S(b, 1, 3.6), match = S(b, 2, 0.2), apps = S(b, 2, 1.4);
  return {
    se: [[0.2, 'fanfareS'], [clone, 'join'], [grow, 'print'], [grow + 0.8, 'print'], [grow + 1.6, 'print'], [loci, 'pop'], [gelT, 'gel'], [match, 'scanner'], [match + 1.2, 'ding'], [E(b, 2, 0.4), 'item'], [E(b, 2, 2.0), 'levelup']],
    draw(f, t) {
      const { L } = f;
      woodWall(L, 0, 150, '#6a4a34', '#5a3c28'); floorTiles(L, 150, '#4a3a5a', '#40324e');
      windowLight(L, 400, 24, 50, 50, t);
      spr(L, 'tanuki', 440, 200 + bob(t, 1), { scale: 2 }); spr(L, 'hero', 36, 200, { scale: 2 });
      board(L, 100, 58, 316, 142);
      if (t < loci) {
        // PCR cloning: product → vector → E. coli → clones
        const k = clamp((t - clone) / 1.2);
        rect(L, 118, 96, 30, 2, C.y); rect(L, 118, 100, 30, 2, C.y); text(f, 133, 106, 'PCR産物', { align: 'center', c: C.y });
        text(f, 160, 94, '→', {});
        plasmid(L, 192, 100, 12, k > 0.6 ? [[0.0, 0.18, C.y]] : [], { base: C.l, th: 2 });
        text(f, 192, 118, 'ベクター', { align: 'center', c: C.L });
        text(f, 214, 94, '→', {});
        const n = t < grow ? 1 : Math.min(8, 2 ** (1 + Math.floor((t - grow) / 0.8)));
        for (let i = 0; i < n; i++) bacterium(L, 252 + (i % 4) * 36, 84 + Math.floor(i / 4) * 22, 30, 12, { plas: [[0.0, 0.3, C.y]] });
        if (n >= 8) text(f, 306, 134, '同じクローンが 大量に', { align: 'center', c: C.z });
        text(f, 258, 160, '従来のクローニングより 迅速', { align: 'center', c: C.L });
        return finish(f, L, t);
      }
      // VNTR: repeats of different lengths → bands on a gel
      const people = ['A', 'B', 'C', 'F'];
      const gx = 300, gy = 66, gw = 104, gh = 128;
      gel(L, gx, gy, gw, gh, 4);
      const cols = [C.m, '#5fb0e8', C.g];
      const y4 = n => gy + gh - 8 - (n / 35) * (gh - 18);
      people.forEach((p, i) => {
        text(f, gx + i * 26 + 13, gy - 10, p === 'F' ? 'F' : p, { align: 'center', c: p === 'F' ? C.z : C.w });
        if (t > gelT) VNTR[p].forEach((loc, li) => loc.forEach(n => {
          const k = easeOut(prog(t, gelT + li * 0.3, gelT + 1.2 + li * 0.3));
          band(L, gx + i * 26 + 5, lerp(gy + 6, y4(n), k), 16, { c: cols[li] });
        }));
      });
      [0, 10, 20, 30].forEach(n => text(f, gx - 4, y4(n) - 4, String(n), { align: 'right', c: C.L }));
      text(f, gx - 22, gy + gh / 2 - 20, '反', { c: C.L }); text(f, gx - 22, gy + gh / 2 - 10, '復', { c: C.L }); text(f, gx - 22, gy + gh / 2, '回', { c: C.L }); text(f, gx - 22, gy + gh / 2 + 10, '数', { c: C.L });
      // homologous chromosomes with tandem repeats (person B, one locus)
      text(f, 112, 66, 'VNTR：反復の回数が 人ごとに ちがう', { c: C.w });
      const rep = (x, y, n, col) => { rect(L, x, y, 24, 3, col); for (let i = 0; i < n; i++) { rect(L, x + 24 + i * 3, y, 2, 3, C.w); } rect(L, x + 24 + n * 3, y, 24, 3, col); };
      rep(112, 90, 10, C.m); rep(112, 98, 30, C.m);
      text(f, 112, 106, '相同染色体の 2本（Bさん）', { c: C.L });
      line(L, 116, 86, 120, 82, C.y, 2); line(L, 210, 104, 206, 108, C.y, 2);
      text(f, 160, 120, '↑ PCRで増やして 長さを比べる', { align: 'center', c: C.y });
      if (t > match) {
        const k = clamp((t - match) / 0.4);
        L.globalAlpha = 0.5 * k; rect(L, gx + 26 + 2, gy + 2, 22, gh - 4, C.z); rect(L, gx + 78 + 2, gy + 2, 22, gh - 4, C.z); L.globalAlpha = 1;
        text(f, 200, 150, '試料F と Bさんが 一致！', { align: 'center', c: C.z, bold: true, alpha: k });
      }
      if (t > apps) note(f, t - apps, 104, 160, ['親子鑑定・犯罪捜査（毛髪など微量試料）', '古生物学・人類学（化石・進化の比較）'], { w: 190 });
      return finish(f, L, t);
      function finish() {
        chapter(f, t, 10, '探偵の事務所', 'PCRクローニングと DNA鑑定');
        itemGet(f, L, t - E(b, 2, 0.4), '探偵のルーペ', { y: 36 });
        levelUp(f, t - E(b, 2, 2.0), 18, { y: 68 });
      }
    },
  };
}

// the electric eel エレキ: a wavy body drawn segment by segment, sparking while it powers the gel
function eel(L, x, y, t, zap) {
  for (let i = 11; i >= 0; i--) {
    const xx = x + i * 5, yy = y + Math.round(Math.sin(t * 4 - i * 0.7) * 3), r = Math.max(2, 6 - Math.floor(i / 3));
    circle(L, xx, yy, r + 1, C.k); circle(L, xx, yy, r, i % 3 === 1 ? C.z : '#3a8ad0'); px(L, xx, yy - r + 1, '#9fd4ff');
  }
  const hy = y + Math.round(Math.sin(t * 4) * 3);
  circle(L, x - 3, hy, 7, C.k); circle(L, x - 3, hy, 6, '#3a8ad0'); rect(L, x - 7, hy - 3, 3, 3, C.w); px(L, x - 6, hy - 2, C.k); rect(L, x - 9, hy + 2, 4, 1, C.k);
  if (zap && Math.floor(t * 12) % 2) { line(L, x + 20, y - 10, x + 30, y - 22, C.z, 2); line(L, x + 30, y - 22, x + 26, y - 26, C.z, 2); line(L, x + 44, y - 8, x + 52, y - 20, C.z, 2); }
}

// ── 4:55 第11章 雷の川：電気泳動 ─────────────────────────────────────────
export function gelScene(b) {
  const run = S(b, 0, 1.6), uv = S(b, 1, 0.3), warn = S(b, 1, 4.6);
  const sizes = [[0.15, 0.3, 0.55, 0.8], [0.25, 0.6], [0.4, 0.7, 0.85]]; // 0 = big (slow), 1 = small (fast)
  return {
    se: [[0.2, 'fanfareS'], [run - 0.3, 'zap'], [run, 'gel'], [uv, 'switch'], [uv + 0.4, 'glow'], [warn, 'alert'], [E(b, 1, 0.3), 'item'], [E(b, 1, 1.9), 'levelup']],
    draw(f, t) {
      const { L } = f;
      const dark = t > uv;
      if (!dark) { sky(L, ['#3a3a6a', '#4a4a80', '#5a5a96', '#6a6aaa'], 100); clouds(L, t, 10, 4, '#8a8ab8'); grass(L, 100); }
      else vgrad(L, 0, 0, LW, LH, ['#05030c', '#0a0618', '#0f0a22']);
      // river
      if (!dark) { vgrad(L, 0, 150, LW, 50, ['#2752a8', '#3a6cc4']); }
      eel(L, 60, 168, t, t > run - 0.3 && t < uv);
      spr(L, 'hero', 30, 200, { scale: 2 });
      if (t > run - 0.3 && !dark && Math.floor(t * 12) % 2) { line(L, 110, 150, 160, 100, C.z, 2); line(L, 160, 100, 154, 94, C.z, 2); }
      const gx = 170, gy = 62, gw = 150, gh = 130;
      const lw = gel(L, gx, gy, gw, gh, 4, { uv: dark });
      text(f, gx - 12, gy - 4, '−', { c: C.c, size: 32 }); text(f, gx - 12, gy + gh - 18, '+', { c: C.r, size: 32 });
      text(f, gx + gw / 2, gy - 12, dark ? 'UV 260 nm で照らす' : 'ウェル（ここに試料を入れる）', { align: 'center', c: dark ? C.u : C.w });
      const p = t < run ? 0 : clamp((t - run) / 5.5);
      // ladder (lane 0) + three samples; small fragments run further
      const lanes = [[0.12, 0.25, 0.4, 0.58, 0.78, 0.92], ...sizes];
      lanes.forEach((ls, i) => ls.forEach(s => {
        const y = gy + 8 + p * s * (gh - 18);
        band(L, gx + i * lw + lw * 0.18, y, lw * 0.64, { uv: dark, c: i === 0 ? '#556070' : '#3b4a66', a: dark ? 1 : 0.9 });
      }));
      if (p > 0.3 && !dark) {
        line(L, gx + gw + 14, gy + 20, gx + gw + 14, gy + gh - 10, C.y, 2); line(L, gx + gw + 14, gy + gh - 10, gx + gw + 10, gy + gh - 16, C.y, 2); line(L, gx + gw + 14, gy + gh - 10, gx + gw + 18, gy + gh - 16, C.y, 2);
        text(f, gx + gw + 24, gy + 24, 'DNAは負の電荷', { c: C.w }); text(f, gx + gw + 24, gy + 36, '→ ＋極へ', { c: C.w });
        text(f, gx + gw + 24, gy + 64, '大きい断片：遅い', { c: C.L }); text(f, gx + gw + 24, gy + 76, '小さい断片：速い', { c: C.z });
        text(f, gx + gw + 24, gy + 104, 'アガロース／', { c: C.L }); text(f, gx + gw + 24, gy + 116, 'ポリアクリルアミド', { c: C.L });
      }
      if (dark) {
        text(f, gx + gw + 24, gy + 24, 'EtBr が 塩基対の間に', { c: C.o }); text(f, gx + gw + 24, gy + 36, '挿入（インターカレーション）', { c: C.o });
        text(f, gx + gw + 24, gy + 56, '→ 590 nm の蛍光', { c: '#ffd27a' });
        if (t > warn) note(f, t - warn, gx + gw + 16, gy + 78, ['EtBr は DNA に入りこむ', '手袋・廃液の処理を守る'], { title: '！ 取り扱い注意', tc: C.r, w: 132 });
      }
      chapter(f, t, 11, '雷の川', '電気泳動 ― サイズで分ける');
      itemGet(f, L, t - E(b, 1, 0.3), '雷のうなぎ笛', { y: 36 });
      levelUp(f, t - E(b, 1, 1.9), 19, { y: 68 });
    },
  };
}
export { gelScene as gel };

// ── 5:15 第12章 灯台の観測所：RT-PCR と qPCR ─────────────────────────────
export function qpcr(b) {
  const rtA = S(b, 0, 1.6), rtGel = S(b, 0, 5.4), plot = S(b, 1, 0.2), stdc = S(b, 1, 7.4), ref = S(b, 2, 0.2);
  const Ct = [15, 18.3, 21.6, 25];
  const cross = Ct.map(c => plot + 0.8 + (c / 40) * 6.2);
  return {
    se: [[0.2, 'fanfareS'], [0.4, 'beepLow'], [rtA, 'pop'], [rtGel, 'gel'], [plot, 'beepLow'], ...cross.map(c => [c, 'alert']), [stdc, 'ding'], [ref, 'sparkle'], [E(b, 2, 0.3), 'item'], [E(b, 2, 1.9), 'levelup']],
    draw(f, t) {
      const { L } = f;
      night(L, t, 31);
      rect(L, 0, 190, LW, 80, '#1a2040');
      // the lighthouse
      rect(L, 430, 40, 24, 150, C.w); for (let y = 56; y < 190; y += 28) rect(L, 430, y, 24, 12, C.r); rect(L, 426, 30, 32, 12, C.k); circle(L, 442, 34, 4, C.z);
      L.globalAlpha = 0.08; L.fillStyle = C.z; L.beginPath(); const a = t * 0.8; L.moveTo(442, 34); L.lineTo(442 + Math.cos(a) * 300, 34 + Math.sin(a) * 60 - 30); L.lineTo(442 + Math.cos(a + 0.2) * 300, 34 + Math.sin(a + 0.2) * 60 + 30); L.fill(); L.globalAlpha = 1;
      spr(L, 'flyBig', 400, 120 + bob(t, 2, 3), { scale: 2 }); L.globalAlpha = 0.25 + 0.2 * pulse(t, 1.5); circle(L, 400, 114, 10, C.z); L.globalAlpha = 1;
      spr(L, 'hero', 30, 200, { scale: 2 });
      board(L, 64, 58, 316, 142);
      if (t < plot) {
        // RT-PCR: cell A and B → mRNA → cDNA → PCR → gel
        text(f, 72, 64, 'RT-PCR：遺伝子C の発現を くらべる', { c: C.w });
        [['細胞A', 90, 1], ['細胞B', 150, 0.3]].forEach(([n, y, amt], i) => {
          cellBox(L, 74, y - 14, 34, 28);
          text(f, 91, y + 16, n, { align: 'center', c: C.w });
          if (t > rtA) { text(f, 116, y - 6, '→', {}); for (let k = 0; k < 3; k++) { rect(L, 132, y - 8 + k * 6, 20, 2, C.c); seq(f, 152, y - 12 + k * 6, 'AAAA', { cw: 3, cols: () => C.c }); } }
          if (t > rtA + 1.2) { text(f, 170, y - 6, '→', {}); for (let k = 0; k < 3; k++) { rect(L, 186, y - 8 + k * 6, 20, 2, C.m); seq(f, 206, y - 12 + k * 6, 'TTTT', { cw: 3, cols: () => C.m }); } text(f, 196, y + 12, 'cDNA', { align: 'center', c: C.m }); }
          if (t > rtA + 2.4) { text(f, 224, y - 6, 'PCR→', {}); }
        });
        if (t > rtGel) {
          gel(L, 290, 72, 70, 110, 2);
          const k = easeOut(prog(t, rtGel, rtGel + 1.4));
          band(L, 296, lerp(78, 130, k), 24, { c: '#2a3550' }); rect(L, 296, lerp(78, 130, k) + 2, 24, 2, '#2a3550');
          band(L, 331, lerp(78, 130, k), 24, { c: '#7f8fa2', a: 0.6 });
          text(f, 308, 186, 'A', { align: 'center' }); text(f, 343, 186, 'B', { align: 'center' });
          text(f, 325, 154, '量の差 = 発現の差', { align: 'center', c: C.z });
        }
        return done();
      }
      // qPCR amplification curves
      const gx = 84, gy = 70, gw = 180, gh = 100;
      rect(L, gx, gy, 1, gh, C.w); rect(L, gx, gy + gh, gw, 1, C.w);
      text(f, gx + gw / 2, gy + gh + 4, 'サイクル数', { align: 'center', c: C.L });
      text(f, gx - 4, gy - 10, '蛍光', { c: C.L });
      const thr = gy + gh - 22; for (let x = gx; x < gx + gw; x += 4) rect(L, x, thr, 2, 1, C.e);
      text(f, gx + gw + 2, thr - 4, 'しきい値', { c: C.e });
      const cols = [C.r, C.g, '#5fb0e8', C.y], labs = ['1', '1/10', '1/100', '1/1000'];
      const cyc = clamp((t - plot - 0.8) / 6.2) * 40;
      Ct.forEach((c, i) => {
        let prev = null;
        for (let x = 0; x <= cyc; x += 0.25) {
          const v = 1 / (1 + Math.exp(-(x - c - 3) * 0.9)); // crosses the threshold (~0.2) near Ct
          const X = gx + (x / 40) * gw, Y = gy + gh - v * (gh - 6);
          if (prev) line(L, prev[0], prev[1], X, Y, cols[i]);
          prev = [X, Y];
        }
        if (t > cross[i]) { const X = gx + (c / 40) * gw; circle(L, X, thr, 2, C.w); popup(f, X, thr - 10, `Ct ${c.toFixed(1)}`, t - cross[i], { c: cols[i], dur: 1.6 }); }
      });
      labs.forEach((l, i) => text(f, gx + 6 + i * 44, gy - 2 + 0, l, { c: cols[i] }));
      // the standard curve: Ct vs log(starting amount)
      if (t > stdc) {
        const sx = 290, sy = 74, sw = 80, sh = 96, k = easeOut(prog(t, stdc, stdc + 0.6));
        rect(L, sx, sy, 1, sh, C.w); rect(L, sx, sy + sh, sw, 1, C.w);
        text(f, sx + sw / 2, sy + sh + 4, '最初のDNA量（対数）', { align: 'center', c: C.L });
        text(f, sx + 4, sy - 10, 'Ct', { c: C.L });
        const pts = Ct.map((c, i) => [sx + sw - 8 - i * 22, sy + sh - ((c - 10) / 18) * sh]);
        line(L, pts[0][0], pts[0][1], lerp(pts[0][0], pts[3][0], k), lerp(pts[0][1], pts[3][1], k), C.z);
        pts.forEach(([x, y], i) => circle(L, x, y, 2, cols[i]));
        text(f, sx + sw / 2, sy + 8, '検量線', { align: 'center', c: C.z });
        if (t > ref && t - ref < 0.8) sparkle(L, sx + sw / 2, sy + sh / 2, t - ref, 12, C.z, 4, 40, 7);
      }
      text(f, 72, 186, 'SYBR Green I ／ TaqMan プローブ で蛍光を測る', { c: C.L });
      return done();
      function done() {
        chapter(f, t, 12, '灯台の観測所', 'RT-PCR と qPCR（リアルタイムPCR）');
        itemGet(f, L, t - E(b, 2, 0.3), '観測所のランタン', { y: 36 });
        levelUp(f, t - E(b, 2, 1.9), 21, { y: 68 });
      }
    },
  };
}

// ── 5:40 第13章 からくり塔：サンガー法 ───────────────────────────────────
export function sanger(b) {
  const tmpl = '3\'-GTACGACCATTAG-5\'';
  const temp = 'GTACGACCATTAG', prod = comp(temp); // 5'-CATGCTGGTAATC-3'
  const ext = S(b, 0, 1.8), ladder = S(b, 0, 4.4), cap = S(b, 1, 0.6), read0 = S(b, 1, 2.6), fin = E(b, 1, -0.3);
  return {
    se: [[0.2, 'fanfareS'], [0.4, 'clock'], [ext, 'tick'], [ladder, 'pop'], [cap, 'zap'], ...Array.from({ length: 9 }, (_, i) => [read0 + i * 0.62, 'beep']), [fin, 'jingle'], [E(b, 1, 0.6), 'item'], [E(b, 1, 2.2), 'levelup']],
    draw(f, t) {
      const { L } = f;
      brickWall(L, 0, 160, '#3c4458', '#2c3242'); floorTiles(L, 160, '#3a3a4a', '#30303e');
      [[30, 40, 14], [452, 60, 18]].forEach(([x, y, r], i) => { const a0 = t * (i ? -1 : 1); circle(L, x, y, r, '#8a7030'); circle(L, x, y, r - 4, '#5a4a20'); for (let k = 0; k < 8; k++) { const a = a0 + (k / 8) * 6.28; rect(L, x + Math.cos(a) * r - 2, y + Math.sin(a) * r - 2, 4, 4, '#8a7030'); } });
      spr(L, 'robot', 440, 200 + bob(t, 1), { scale: 2 }); spr(L, 'hero', 30, 200, { scale: 2 });
      board(L, 64, 50, 346, 152);
      const cw = 9, x0 = 120;
      text(f, 72, 56, '鋳型', { c: C.L });
      seq(f, x0, 56, temp, { cw, cols: ch => BASE_TXT[ch] }); text(f, x0 - 14, 56, "3'", { c: C.l }); text(f, x0 + temp.length * cw + 2, 56, "5'", { c: C.l });
      rect(L, x0, 66, temp.length * cw - 1, 2, C.l);
      if (t < cap) {
        // primer + extension with ddNTP terminators
        seq(f, x0, 70, prod.slice(0, 4), { cw, cols: () => C.c }); text(f, x0 - 14, 70, "5'", { c: C.l });
        text(f, x0 + 4 * cw * 0.5, 80, 'プライマー', { align: 'center', c: C.c });
        if (t > ext) {
          const n = Math.min(9, Math.floor((t - ext) * 3.4));
          for (let i = 0; i < n; i++) {
            const y = 96 + i * 11, len = 5 + i;
            rect(L, x0, y, (len - 1) * cw, 2, '#cfd6ea');
            rect(L, x0, y, 4 * cw - 1, 2, C.c);
            const last = prod[len - 1];
            circle(L, x0 + (len - 1) * cw + 3, y + 1, 3, BASE[last]);
          }
          text(f, x0 + 14 * cw, 96, 'ddNTP が入ると', { c: C.w }); text(f, x0 + 14 * cw, 108, 'そこで 伸長が止まる', { c: C.w });
          if (t > ladder) { text(f, x0 + 14 * cw, 132, '蛍光の色 = 最後の塩基', { c: C.z }); [['A', C.g], ['C', C.b], ['G', C.y], ['T', C.r]].forEach(([s, c], i) => { circle(L, x0 + 14 * cw + 4 + i * 22, 156, 3, c); text(f, x0 + 14 * cw + 10 + i * 22, 151, s, { c: BASE_TXT[s] }); }); }
        }
        return done();
      }
      // capillary electrophoresis: shortest first past the detector → peaks → the read
      const cy = 96;
      rect(L, 80, cy, 300, 4, '#9aa6c0'); rect(L, 81, cy + 1, 298, 2, '#1a2236');
      rect(L, 300, cy - 6, 8, 16, C.z); text(f, 304, cy - 18, '検出器', { align: 'center', c: C.z });
      text(f, 76, cy - 12, '−', { c: C.c }); text(f, 382, cy - 12, '+', { c: C.r });
      text(f, 150, cy + 8, 'キャピラリー（毛細管）', { align: 'center', c: C.L });
      const read = prod.slice(4); // C T G G T A A T C
      const nRead = clamp((t - read0) / (read.length * 0.62)) * read.length;
      for (let i = 0; i < read.length; i++) {
        const x = 300 - (i - (t - read0) / 0.62) * 22;
        if (x > 82 && x < 300) circle(L, x, cy + 2, 2, BASE[read[i]]);
      }
      // chromatogram
      const gx = 90, gy = 130, gw = 280, gh = 40;
      rect(L, gx, gy + gh, gw, 1, C.e);
      for (let i = 0; i < Math.floor(nRead); i++) {
        const X = gx + 14 + i * 30, col = BASE[read[i]];
        for (let dx = -8; dx <= 8; dx++) { const h = Math.round(gh * Math.exp(-(dx * dx) / 12) * (0.75 + 0.25 * ((i * 37) % 7) / 7)); rect(L, X + dx, gy + gh - h, 1, h, col); }
        seq(f, X - 3, gy + gh + 4, read[i], { cw: 6, cols: ch => BASE_TXT[ch] });
      }
      if (t > fin) text(f, 230, 186, "読めた配列：5'-CATG CTGGTAATC-3'", { align: 'center', c: C.z });
      return done();
      function done() {
        chapter(f, t, 13, 'からくり塔', 'サンガー法 ― 1本ずつ 正確に読む');
        itemGet(f, L, t - E(b, 1, 0.6), 'からくりの歯車', { y: 36 });
        levelUp(f, t - E(b, 1, 2.2), 22, { y: 68 });
      }
    },
  };
}

// ── 6:00 第14章 蛍の大平原：次世代シークエンサー ─────────────────────────
export function ngs(b) {
  const zoom = S(b, 1, 0.2), bridge = S(b, 1, 2.4), clus = S(b, 1, 4.8), map = S(b, 1, 7.4);
  return {
    se: [[0.2, 'fanfareS'], ...Array.from({ length: 10 }, (_, i) => [0.6 + i * 0.5, 'beat']), [zoom, 'pop'], [bridge, 'join'], [clus, 'cluster'], [clus + 0.5, 'cluster'], [map, 'ding'], [E(b, 1, 0.4), 'item'], [E(b, 1, 2.0), 'levelup']],
    draw(f, t) {
      const { L } = f;
      night(L, t, 41);
      rect(L, 0, 170, LW, 100, '#0f1a2a');
      spr(L, 'hero', 30, 200, { scale: 2 }); spr(L, 'flyBig', 446, 160 + bob(t, 2, 3), { scale: 2 });
      // the flow cell: tens of millions of clusters (here: a field of fireflies)
      const fx = 100, fy = 56, fw = 290, fh = 140;
      rect(L, fx - 2, fy - 2, fw + 4, fh + 4, '#5a6a8a'); rect(L, fx, fy, fw, fh, '#05070f');
      const cyc = Math.floor(t * 2);
      const r = rng(77);
      const cols = [C.g, C.b, C.y, C.r];
      for (let i = 0; i < 900; i++) {
        const x = fx + 2 + Math.floor(r() * (fw - 4)), y = fy + 2 + Math.floor(r() * (fh - 4)), s = Math.floor(r() * 1e6);
        const c = cols[(s + cyc * 7 + (s >> 3) * cyc) % 4];
        const on = (t * 2) % 1 < 0.7;
        px(L, x, y, on ? c : '#1a2030');
      }
      text(f, fx + fw / 2, fy - 12, `フローセル ― サイクル ${cyc + 1}：1塩基ずつ 蛍光で読む`, { align: 'center', c: C.w });
      if (t > zoom) {
        // zoom: adapter → bridge PCR → cluster → reads mapped onto the genome
        board(L, 112, 70, 266, 118, { a: 0.92 });
        const bx = 124, by = 150;
        rect(L, bx, by, 110, 2, '#9aa6c0'); text(f, bx + 55, by + 4, 'フローセルの表面', { align: 'center', c: C.L });
        const k = clamp((t - zoom) / 1.6);
        // a fragment with adapters (colored ends)
        if (t < bridge) { const y = lerp(90, 120, k); rect(L, bx + 30, y, 40, 2, C.l); rect(L, bx + 22, y, 8, 2, C.o); rect(L, bx + 70, y, 8, 2, C.m); text(f, bx + 50, y - 12, 'アダプター付き断片', { align: 'center', c: C.w }); }
        else if (t < clus) { // bridge
          const a = clamp((t - bridge) / 1.0);
          for (let s = 0; s <= 20; s++) { const u = s / 20, x = bx + 30 + u * 40, y = by - Math.sin(u * Math.PI) * 30 * a; rect(L, x, y, 2, 2, u < 0.15 ? C.o : u > 0.85 ? C.m : C.l); }
          text(f, bx + 50, by - 46, 'ブリッジPCR', { align: 'center', c: C.y });
        } else { // cluster: many copies standing up
          const n = Math.min(24, Math.floor((t - clus) * 18));
          for (let i = 0; i < n; i++) { const x = bx + 20 + (i * 37 % 70), h = 16 + (i * 13 % 14); rect(L, x, by - h, 1, h, cols[i % 4]); }
          text(f, bx + 55, by - 46, 'クラスター（同じ断片の集団）', { align: 'center', c: C.y });
        }
        // reads mapped to the reference
        if (t > map) {
          const gx0 = 252, gw = 116;
          text(f, gx0 + gw / 2, 78, 'リード（80〜200 bp）', { align: 'center', c: C.w });
          const rr = rng(5), n = Math.min(16, Math.floor((t - map) * 10));
          for (let i = 0; i < n; i++) { const x = gx0 + rr() * (gw - 22), y = 94 + (i % 8) * 6; rect(L, x, y, 22, 2, cols[i % 4]); }
          rect(L, gx0, 150, gw, 3, C.w); text(f, gx0 + gw / 2, 156, '既知のゲノム配列', { align: 'center', c: C.L });
          text(f, gx0 + gw / 2, 168, 'マッピング → 全体を網羅', { align: 'center', c: C.z });
        }
      }
      chapter(f, t, 14, '蛍の大平原', '次世代シークエンサー（NGS）');
      itemGet(f, L, t - E(b, 1, 0.4), '蛍の灯', { y: 36 });
      levelUp(f, t - E(b, 1, 2.0), 24, { y: 68 });
    },
  };
}

// ── 6:25 第15章 地図職人の谷：RNA-seq ・ シングルセル ・ Spatial ─────────
export function seqScene(b) {
  const p1 = S(b, 0, 0.4), p2 = S(b, 0, 4.6), p3 = S(b, 1, 0.3);
  const TYPES = [C.r, C.b, C.y, C.g]; // 心筋・血管・神経・免疫
  return {
    se: [[0.2, 'fanfareS'], [p1, 'pop'], [p1 + 1.4, 'heatmap'], [p2, 'pop'], [p2 + 1.2, 'heatmap'], [p3, 'pop'], [p3 + 1.4, 'heatmap'], [E(b, 1, 0.3), 'item'], [E(b, 1, 1.9), 'levelup']],
    draw(f, t) {
      const { L } = f;
      sky(L, ['#7a9ad0', '#94b2dc', '#b0c8e6', '#cfe0f0'], 90); clouds(L, t, 6, 7);
      for (let x = 0; x < LW; x++) { const h = 40 + Math.sin(x * 0.02) * 14; rect(L, x, 90 - h + 40, 1, h, '#6a7a5a'); }
      grass(L, 130, LH - 130, 3);
      spr(L, 'mole', 446, 200 + bob(t, 1.2), { scale: 2 }); spr(L, 'hero', 30, 200, { scale: 2 });
      const pan = (i, at, title, sub) => {
        const x = 64 + i * 122, y = 54, w = 116, h = 146;
        if (t < at) return null;
        board(L, x, y, w, h);
        text(f, x + w / 2, y + 4, title, { align: 'center', c: C.y });
        text(f, x + w / 2, y + h - 26, sub[0], { align: 'center', c: C.w });
        text(f, x + w / 2, y + h - 14, sub[1], { align: 'center', c: C.L });
        return [x, y, w, h, t - at];
      };
      let P = pan(0, p1, 'RNA-seq', ['組織全体の 総和', '細胞の区別は できない']);
      if (P) {
        const [x, y, w, , u] = P;
        const r = rng(2);
        for (let i = 0; i < 20; i++) { const cx = x + 18 + (i % 5) * 18, cy = y + 26 + Math.floor(i / 5) * 10; circle(L, cx, cy, 3, TYPES[Math.floor(r() * 4)]); }
        if (u > 1.2) { const k = easeOut(prog(u, 1.2, 1.8)); [0.7, 0.4, 0.9, 0.5, 0.6].forEach((v, j) => rect(L, x + 20 + j * 16, y + 108 - v * 34 * k, 10, v * 34 * k, '#b8a0e0')); }
      }
      P = pan(1, p2, 'シングルセル', ['1細胞ずつの 発現', '同じ細胞種の 多様性も']);
      if (P) {
        const [x, y, , , u] = P;
        for (let i = 0; i < 4; i++) circle(L, x + 20 + i * 26, y + 30, 4, TYPES[i]);
        if (u > 1.0) for (let row = 0; row < 8; row++) for (let col = 0; col < 10; col++) {
          const type = row % 4, hot = (col * 3 + type * 5) % 10 < 3 + (type === 1 ? 1 : 0);
          rect(L, x + 14 + col * 9, y + 46 + row * 8, 8, 7, hot ? TYPES[type] : '#2a2f4a');
        }
      }
      P = pan(2, p3, 'Spatial', ['位置を 保ったまま', '組織の構造 と 機能']);
      if (P) {
        const [x, y, , , u] = P;
        // a tissue section with spots coloured by expression
        ellipse(L, x + 58, y + 68, 46, 40, '#f2c6d8');
        for (let j = -4; j <= 4; j++) for (let i = -5; i <= 5; i++) {
          const sx = x + 58 + i * 8 + (j % 2) * 4, sy = y + 68 + j * 8;
          if (((sx - x - 58) / 44) ** 2 + ((sy - y - 68) / 38) ** 2 > 1) continue;
          const zone = Math.hypot(i, j) < 2.5 ? 2 : i < -1 ? 0 : j > 1 ? 3 : 1;
          if (u > 1.2) rect(L, sx - 2, sy - 2, 4, 4, TYPES[zone]); else px(L, sx, sy, '#a07090');
        }
      }
      if (t > p1) { [['心筋', 0], ['血管', 1], ['神経', 2], ['免疫', 3]].forEach(([n, i]) => { rect(L, 104 + i * 70, 40, 6, 6, TYPES[i]); text(f, 114 + i * 70, 38, n, { c: C.w }); }); }
      chapter(f, t, 15, '地図職人の谷', 'RNA-seq ・ シングルセル ・ Spatial');
      itemGet(f, L, t - E(b, 1, 0.3), '細胞の地図', { y: 36 });
      levelUp(f, t - E(b, 1, 1.9), 25, { y: 68 });
    },
  };
}
export { seqScene as seq };

// ── 6:45 第16章 編集の祭壇：ゲノム編集（戦闘） ────────────────────────────
export function crispr(b) {
  const guide = S(b, 0, 2.4), cut = S(b, 0, 5.6), list = S(b, 0, 7.0), ghost = S(b, 1, 0.4), check = S(b, 1, 5.2);
  const target = 'GACGTTACCGGATTCAGCTA', pam = 'TGG';
  const off = 'GACGTAACCGGATTGAGCTA'; // two mismatches
  return {
    se: [[0.0, 'swirl'], [3.0, 'encounter'], [guide, 'glow'], [cut - 0.3, 'spell'], [cut, 'slash'], [cut + 0.1, 'impact'], [list, 'menu'], [ghost, 'ghost'], [check, 'ding'], [E(b, 1, 0.4), 'item'], [E(b, 1, 2.0), 'levelup']],
    draw(f, t) {
      const { L } = f;
      battleBg(L, t, '#102a3a');
      swirl(f, 1 - clamp(t / 0.6));
      spr(L, 'heroR', 52, 198, { scale: 2 });
      spr(L, 'fairy', 96, 150 + bob(t, 2, 3), { scale: 2 }); sparkle(L, 96, 140, t, 6, C.C, 3, 12, 2);
      battleMsg(f, t - 3.0, t < ghost ? '標的の配列が あらわれた！' : 'オフターゲットの影が あらわれた！');
      const cw = 9, x0 = 130, y0 = 76;
      board(L, 120, 40, 344, 104);
      const top = target + pam, bot = comp(top);
      const cutAt = target.length - 3; // Cas9 cuts 3 bp upstream of the PAM
      const k = t > cut ? easeOut((t - cut) / 0.4) : 0;
      const dx = Math.round(6 * k);
      const draw = (x, s, e) => { duplex(f, L, x + s * cw, y0, top.slice(s, e), bot.slice(s, e), { cw, letters: false, lab: false }); seq(f, x + s * cw, y0 - 10, top.slice(s, e), { cw, cols: (ch, i) => (s + i >= target.length ? C.z : BASE_TXT[ch]) }); seq(f, x + s * cw, y0 + 13, bot.slice(s, e), { cw, cols: ch => BASE_TXT[ch] }); };
      if (t >= cut) { draw(x0 - dx, 0, cutAt); draw(x0 + dx, cutAt, top.length); }
      else { draw(x0, 0, top.length); }
      text(f, x0 - 12, y0 - 10, "5'", { c: C.l }); text(f, x0 + top.length * cw + 4, y0 - 10, "3'", { c: C.l });
      text(f, x0 + (target.length + 1.5) * cw, y0 - 22, 'PAM', { align: 'center', c: C.z });
      if (t > guide) { // guide RNA pairs with the target
        const g = easeOut(prog(t, guide, guide + 0.8));
        const gy = lerp(y0 + 60, y0 + 34, g);
        rect(L, x0, gy, target.length * cw - 1, 2, C.c);
        seq(f, x0, gy + 4, target.replace(/T/g, 'U'), { cw, cols: () => C.C });
        text(f, x0 + target.length * cw * 0.5, gy + 16, 'ガイドRNA（20塩基）が 標的を指定', { align: 'center', c: C.c });
      }
      if (t > cut) {
        const xc = x0 + cutAt * cw;
        if (t - cut < 0.35) { line(L, xc + 20, y0 - 26, xc - 20, y0 + 36, C.W, 3); }
        popup(f, xc, y0 - 30, '二本鎖切断！', t - cut, { c: C.z, dur: 1.8 });
      }
      shakeAt(f, t, cut, 4, 0.5); flashAt(f, t, cut, '#ffffff', 0.3);
      if (t > list && t < ghost) note(f, t - list, 300, 150, ['ZFN ・ TALEN ・ CRISPR/Cas9'], { title: '人工ヌクレアーゼ' });
      if (t > ghost) {
        // the off-target lookalike
        const a = clamp((t - ghost) / 0.5);
        spr(L, 'ghost', 420, 196 + bob(t, 1.5, 3), { scale: 2, alpha: a });
        board(L, 120, 150, 280, 50);
        text(f, 128, 154, '似た配列（別の場所）', { c: C.u });
        seq(f, 128, 168, off, { cw, cols: (ch, i) => (ch !== target[i] ? C.r : C.L) });
        if (t > check) {
          text(f, 128, 182, '赤＝ちがう塩基 → 誤って切るリスク', { c: C.r });
          note(f, t - check, 300, 104, ['標的に固有のガイドを設計', '切れた場所を 確かめる'], { title: 'リスク管理' });
        }
      }
      chapter(f, t, 16, '編集の祭壇', 'ゲノム編集 ― CRISPR/Cas9', { y: 150 });
      itemGet(f, L, t - E(b, 1, 0.4), '編集の剣 キャスナイン', { y: 36 });
      levelUp(f, t - E(b, 1, 2.0), 27, { y: 68 });
    },
  };
}

// ── 7:05 修復の分かれ道：NHEJ と HDR ─────────────────────────────────────
export function repair(b) {
  const nhej = S(b, 1, 0.2), hdr = S(b, 1, 5.6), pick = S(b, 1, 10.0);
  return {
    noStatus: true,
    se: [[0.4, 'slash'], [nhej, 'tape'], [nhej + 1.2, 'tape'], [nhej + 2.6, 'bad'], [hdr, 'tick'], [hdr + 1.2, 'tick'], [hdr + 2.6, 'ding'], [pick, 'sparkle']],
    draw(f, t) {
      const { L } = f;
      rect(L, 0, 0, LW / 2, LH, '#3a2a20'); rect(L, LW / 2, 0, LW / 2, LH, '#1e3a2e');
      dither(L, 0, 0, LW / 2, LH, '#40302520'); rect(L, LW / 2 - 1, 0, 2, 200, C.w);
      text(f, 120, 40, 'NHEJ（非相同末端結合）', { align: 'center', c: C.o });
      text(f, 360, 40, 'HDR（相同組換え修復）', { align: 'center', c: C.v });
      spr(L, 'raccoon', 30, 200 + bob(t, 3, 2), { scale: 2 }); spr(L, 'turtle', 452, 200, { scale: 2 });
      // a cut duplex on both sides
      const brk = (x, y) => { rect(L, x, y, 64, 2, C.l); rect(L, x, y + 6, 64, 2, C.l); rect(L, x + 80, y, 64, 2, C.l); rect(L, x + 80, y + 6, 64, 2, C.l); };
      const y = 80;
      if (t < nhej) { brk(48, y); brk(288, y); text(f, 240, 104, '二本鎖切断を どう直す？', { align: 'center', c: C.z }); return; }
      // NHEJ: quick, sloppy join — bases lost or added
      const kN = clamp((t - nhej) / 1.6);
      rect(L, 48 + kN * 10, y, 64, 2, C.l); rect(L, 48 + kN * 10, y + 6, 64, 2, C.l); rect(L, 128 - kN * 10, y, 64, 2, C.l); rect(L, 128 - kN * 10, y + 6, 64, 2, C.l);
      if (kN >= 1) { rect(L, 118, y - 3, 12, 14, '#c0b080'); line(L, 118, y - 3, 130, y + 11, '#a09060'); text(f, 124, y + 18, '欠失や挿入', { align: 'center', c: C.r }); }
      if (t > nhej + 2.6) { note(f, t - nhej - 2.6, 20, 120, ['速い・細胞周期に依存しない', 'ただし不正確', '→ フレームシフトで', '　 遺伝子を壊す（ノックアウト）'], { w: 200 }); }
      // HDR: a donor with homology arms used as a template
      if (t > hdr) {
        const kH = clamp((t - hdr) / 1.8);
        brk(288, y);
        const dy = lerp(y + 34, y + 14, easeOut(kH));
        rect(L, 300, dy, 120, 2, C.g); rect(L, 352, dy, 16, 2, C.y);
        text(f, 360, dy + 4, 'ドナー（両端が相同配列）', { align: 'center', c: C.g });
        if (kH >= 1) { rect(L, 352, y, 16, 2, C.y); rect(L, 352, y + 6, 16, 2, C.y); text(f, 360, y - 12, '正確に修復・改変', { align: 'center', c: C.z }); }
        if (t > hdr + 2.6) note(f, t - hdr - 2.6, 250, 120, ['姉妹染色分体などを 鋳型に', '正確（塩基の改変・遺伝子の挿入）', 'ただし細胞周期に依存する'], { w: 200 });
      } else { brk(288, y); }
      if (t > pick) text(f, 240, 186, '目的に応じて 戦略を選ぶ', { align: 'center', c: C.z, bold: true });
    },
  };
}

// ── 7:20 最終章 病の影との決戦 ────────────────────────────────────────────
const TOOLS = ['scissors', 'thread', 'lyre', 'plasmid', 'gear', 'gem', 'ship', 'book', 'flame', 'lens', 'bolt', 'light', 'cog', 'map', 'sword'];
export function finale(b) {
  const mice = S(b, 0, 0.3), boss = S(b, 0, 4.4), combo = S(b, 1, 0.8), defeat = E(b, 1, -0.2), win_ = S(b, 2, b.L[2].dur + 0.3);
  return {
    se: [[0.2, 'fanfareS'], [mice, 'pop'], [mice + 1.6, 'pop'], [boss - 0.4, 'swirl'], [boss, 'encounter'], ...TOOLS.map((_, i) => [combo + i * 0.55, 'hit']), [defeat, 'impact'], [defeat + 0.4, 'victory'], [win_, 'levelup']],
    draw(f, t) {
      const { L } = f;
      if (t < boss) {
        // model animals
        sky(L, ['#405a9a', '#5272b0', '#6a8ac4', '#88a6d8'], 120); grass(L, 120);
        spr(L, 'hero', 30, 200, { scale: 2 });
        board(L, 90, 54, 300, 140);
        const k1 = clamp((t - mice) / 0.4), k2 = clamp((t - mice - 1.6) / 0.4);
        if (k1 > 0) { L.globalAlpha = 0.3 + 0.2 * pulse(t, 1.5); circle(L, 170, 108, 22, C.v); L.globalAlpha = 1; spr(L, 'mouseG', 170, 122, { scale: 3, alpha: k1 }); text(f, 170, 132, 'トランスジェニック', { align: 'center', c: C.v, alpha: k1 }); text(f, 170, 144, '遺伝子を 過剰発現', { align: 'center', c: C.L, alpha: k1 }); text(f, 170, 156, '（GFPマウス など）', { align: 'center', c: C.L, alpha: k1 }); }
        if (k2 > 0) { spr(L, 'mouse', 310, 122, { scale: 3, alpha: k2 }); line(L, 296, 88, 324, 116, C.r, 3); line(L, 324, 88, 296, 116, C.r, 3); text(f, 310, 132, 'ノックアウト', { align: 'center', c: C.r, alpha: k2 }); text(f, 310, 144, '遺伝子の機能を 欠損', { align: 'center', c: C.L, alpha: k2 }); }
        text(f, 240, 176, '病態の解明・薬効の評価のモデル', { align: 'center', c: C.z });
        f.fade = Math.max(f.fade, clamp((t - boss + 0.4) / 0.4));
        return;
      }
      battleBg(L, t, '#2a0f3a');
      const hpk = 1 - clamp((t - combo) / (defeat - combo));
      const gone = t > defeat ? clamp((t - defeat) / 1.2) : 0;
      if (gone < 1) {
        const bx = 300, by = 150 + bob(t, 0.8, 3);
        spr(L, 'boss', bx, by, { scale: 4, alpha: 1 - gone });
        if (gone > 0) sparkle(L, bx, by - 40, gone * 2, 24, C.z, 6, 60, 3);
        hpBar(f, L, bx - 40, 62, 80, hpk, '病の影');
      }
      if (gone > 0.4) text(f, 300, 96, '原因遺伝子を つきとめた！', { align: 'center', c: C.z, size: 32, bold: true, alpha: clamp((gone - 0.4) / 0.3) });
      // the party, all the friends made on the way
      const party = ['owl', 'crab', 'spider', 'fox', 'camel', 'golem', 'gull', 'worm', 'dragon', 'tanuki', 'robot', 'mole', 'raccoon', 'turtle'];
      party.forEach((p, i) => spr(L, p, 18 + i * 17, 200 - (i % 2) * 4 + bob(t + i * 0.3, 1.5), { scale: 1 }));
      spr(L, gone > 0.5 ? 'heroV' : 'heroR', 120, 166, { scale: 2 });
      TOOLS.forEach((k, i) => {
        const u = t - combo - i * 0.55; if (u < 0 || u > 0.7) return;
        const p = easeIn(u / 0.5), x = lerp(130, 296, p), y = lerp(150, 120, p) - Math.sin(p * Math.PI) * 30;
        if (p < 1) icon(L, k, x - 8, y - 8, t);
        popup(f, 300 + ((i * 23) % 40) - 20, 104, `${12 + i * 7}`, u - 0.5, { c: C.w, dur: 0.6 });
      });
      if (t > combo && t < defeat) battleMsg(f, t - combo, 'ルミナたちは 道具を 組み合わせた！');
      else if (t >= defeat) battleMsg(f, t - defeat, '病の影を やっつけた！');
      shakeAt(f, t, defeat, 5, 0.6); flashAt(f, t, defeat, '#ffffff', 0.4);
      levelUp(f, t - win_, 30, { y: 104, dur: 3.0 });
    },
  };
}

// ── 7:40 エピローグ：夕暮れの丘 ──────────────────────────────────────────
export function epilogue(b) {
  const v = [S(b, 0, 4.2), S(b, 0, 5.4), S(b, 0, 6.8)], last = S(b, 1), end = E(b, 1, 0.9);
  return {
    noStatus: true,
    noFade: true,
    se: [[0.2, 'bellSoft'], ...v.map(a => [a, 'bell']), [last, 'bellSoft'], [end + 0.6, 'bellSoft']],
    draw(f, t) {
      const { L } = f;
      vgrad(L, 0, 0, LW, 150, ['#2a1e4a', '#5a2e5a', '#a8486a', '#e0705a', '#f4a060', '#f8c878']);
      circle(L, 240, 150, 26, '#ffe2a0'); circle(L, 240, 150, 20, '#fff0c8');
      stars(L, t, 3, 30, 60);
      for (let x = 0; x < LW; x++) { const h = 50 + Math.sin(x * 0.012) * 18 + Math.sin(x * 0.05) * 4; rect(L, x, 150 + 50 - h + 20, 1, h + 60, '#2a1a30'); }
      rect(L, 0, 196, LW, 80, '#1a1020');
      spr(L, 'hero', 210, 186, { scale: 2 }); owl(L, 262, 186, t, { flip: true, scale: 2 });
      ['安全性', '倫理', '社会的責任'].forEach((s, i) => {
        const u = t - v[i]; if (u < 0) return;
        const x = 120 + i * 120, y = 50, k = easeOut(u / 0.4);
        L.globalAlpha = 0.25 * k; circle(L, x, y, 14, C.z); L.globalAlpha = 1;
        for (let a = 0; a < 5; a++) { const g = (a / 5) * Math.PI * 2 - Math.PI / 2; line(L, x, y, x + Math.cos(g) * 7 * k, y + Math.sin(g) * 7 * k, C.z, 2); }
        text(f, x, y + 14, s, { align: 'center', c: C.w, alpha: k, bold: true });
      });
      // the closing card
      if (t > end) {
        const k = clamp((t - end) / 0.8);
        L.globalAlpha = 0.85 * k; rect(L, 0, 0, LW, LH, '#000'); L.globalAlpha = 1;
        text(f, 240, 92, 'GENE QUEST', { align: 'center', size: 48, c: C.y, z: 8, bold: true, alpha: k, world: false });
        text(f, 240, 124, '― 設計図の勇者 ―', { align: 'center', c: C.w, z: 8, alpha: k, world: false });
        text(f, 240, 146, '～ おわり ～', { align: 'center', c: C.w, z: 8, alpha: clamp((t - end - 0.6) / 0.6), world: false });
        const ca = clamp((t - end - 1) / 0.6);
        text(f, 240, 176, '内容：講義資料「遺伝子工学」（遺伝医学 2026）', { align: 'center', c: C.L, z: 8, alpha: ca, world: false });
        text(f, 240, 188, '声：音声合成　音楽・効果音：オリジナル（合成）　フォント：DotGothic16（OFL）', { align: 'center', c: C.L, z: 8, alpha: ca, world: false });
      }
      // fade in from the battle; out at the very end of the film
      f.fade = Math.max(clamp(1 - t / 0.8), clamp((t - (b.dur - 0.9)) / 0.8));
    },
  };
}

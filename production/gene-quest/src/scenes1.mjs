// GENE QUEST — scenes 1–9: title, the history map, restriction enzymes, ligase, compatible ends,
// reverse transcriptase, vectors, expression vectors, GFP.
import { C, BASE, BASE_TXT, LW, LH, rect, px, line, circle, ring, ellipse, dither, vgrad, stars, spr, shadow, text, seq, win, wtext, popWin, cursor, say, popup, sparkle, clamp, lerp, ease, easeOut, easeIn, prog, pulse, rng } from './engine.mjs';
import { board, sky, clouds, grass, floorTiles, brickWall, woodWall, sea, night, windowLight, torch, vignette, walker, bob, duplex, strand, dsBar, plasmid, bacterium, cellBox, helix, icon, comp } from './kit.mjs';
import { owl, hiSprite, itemGet, levelUp, chapter, note, flashAt, shakeAt, HERO } from './common.mjs';

const S = (b, i, d = 0) => (b.L[i] ? b.L[i].s : 0) + d; // time of line i (+ d seconds)

// ── 0:00 タイトル → 賢者の書斎 ───────────────────────────────────────────
export function title(b) {
  const T_MENU = 6.5, T_SEL = 10.4, T_ROOM = 11.4, T_CHEST = S(b, 2, 2.2);
  return {
    noStatus: t => t < T_CHEST + 1.5,
    se: [[0, 'wind'], [3.0, 'pin'], [T_MENU, 'menu'], [8.2, 'cursor'], [T_SEL, 'select'], [S(b, 2), 'beckon'], [T_CHEST, 'chest'], [T_CHEST + 0.5, 'item']],
    draw(f, t) {
      const { L } = f;
      if (t < T_ROOM) {
        night(L, t, 4);
        // distant hills
        for (let x = 0; x < LW; x++) { const h = 30 + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.011 + 1) * 10; rect(L, x, LH - h, 1, h, '#0d1236'); }
        L.globalAlpha = 0.85; helix(L, 240, 26, 196, t, { amp: 34, turns: 2.4, speed: 0.25 }); L.globalAlpha = 1;
        const k = easeOut(prog(t, 0.6, 2.2));
        if (k > 0) {
          win(f, 92, 70, 296, 64, { z: 2, alpha: k, fill: '#04041699' });
          text(f, 240, 80 - (1 - k) * 6, 'GENE QUEST', { size: 48, align: 'center', c: C.y, z: 3, bold: true, alpha: k, world: false });
          text(f, 240, 112, '― 設計図の勇者 ―', { size: 16, align: 'center', c: C.w, z: 3, alpha: k, world: false });
        }
        if (t > 3.0) { // the quest notice is pinned to the board
          const a = clamp((t - 3) / 0.2);
          note(f, t - 3.0, 40, 150, ['クエスト：遺伝子工学を きわめよ'], { title: '― おふれ ―', c: C.w });
          if (a < 1) f.shake = [0, 1];
        }
        if (t > T_MENU) {
          if (popWin(f, t - T_MENU, 350, 148, 92, 46, { z: 4 })) {
            wtext(f, 370, 158, 'はじめから', { z: 5 }); wtext(f, 370, 172, 'つづきから', { z: 5, c: C.e });
            if (t < T_SEL) cursor(f, 359, 158, t, 5); else cursor(f, 359, 158, t * 4, 5, C.z);
          }
        }
        f.fade = Math.max(0, (t - (T_ROOM - 0.6)) / 0.6);
        return;
      }
      // the sage's study
      const u = t - T_ROOM;
      woodWall(L, 0, 140);
      for (let i = 0; i < 3; i++) { // bookshelves
        const x = 300 + i * 52; rect(L, x, 40, 48, 100, C.N); for (let s = 0; s < 4; s++) { rect(L, x + 2, 46 + s * 24, 44, 20, '#3a2414'); const r = rng(i * 9 + s); for (let k = 0; k < 9; k++) rect(L, x + 4 + k * 5, 50 + s * 24 + Math.floor(r() * 4), 4, 16 - Math.floor(r() * 4), ['#a83b3b', '#3b6ea8', '#5aa85a', '#c9a03a', '#7d4fa8'][Math.floor(r() * 5)]); }
      }
      windowLight(L, 60, 40, 40, 44, t);
      floorTiles(L, 140);
      rect(L, 150, 120, 80, 6, C.N); rect(L, 154, 126, 4, 22, C.N); rect(L, 222, 126, 4, 22, C.N); // desk
      ring(L, 170, 114, 5, C.y); rect(L, 196, 108, 14, 12, C.w); line(L, 212, 106, 216, 118, C.k); // globe-ish lens and papers
      torch(L, 130, 70, t); torch(L, 280, 70, t);
      owl(L, 340, 198, t, { flip: true, scale: 2 });
      const open = t >= T_CHEST;
      spr(L, open ? 'chestOpen' : 'chest', 268, 198, { scale: 2 });
      if (open) sparkle(L, 268, 180, t - T_CHEST, 10, C.z, 3, 22, 4);
      const hx = walker(L, 'hero', t, T_ROOM + 0.2, T_ROOM + 2.2, 30, 200, 200);
      itemGet(f, L, t - T_CHEST - 0.4, 'どうぐぶくろ', { iconFn: (x, y) => {} });
      f.fade = Math.max(0, 1 - u / 0.5);
      vignette(L, 0.3);
    },
  };
}

// ── 0:20 年表：伝説の石碑をたどる ─────────────────────────────────────────
const MILES = [
  [1869, 'DNAの発見', 'Miescher', 66, 92],
  [1953, '二重らせん', 'Watson・Crick', 136, 150],
  [1962, '制限酵素', 'Arber ほか', 206, 92],
  [1977, '配列決定法', 'Sanger ほか', 276, 150],
  [1985, 'PCR', 'Mullis', 346, 92],
  [2004, 'ヒトゲノム', '完成版', 416, 150],
];
export function history(b) {
  const L1 = S(b, 1);
  // reveal in the order they are spoken (PCR is named before sequencing)
  const at = [S(b, 0, 1.2), L1 + 1.4, L1 + 2.9, L1 + 5.4, L1 + 4.4, L1 + 7.0];
  return {
    se: at.map(a => [a, 'page']).concat([[L1 + 9.6, 'chime']]),
    draw(f, t) {
      const { L } = f;
      sea(L, t, 0, ['#1d3f8a', '#21479a', '#2752a8']);
      // the continent
      const r = rng(21);
      ellipse(L, 240, 128, 236, 82, '#d8c48a');
      ellipse(L, 240, 128, 230, 77, '#3f9a4a');
      for (let i = 0; i < 60; i++) {
        const x = 30 + r() * 420, y = 66 + r() * 120, kind = r() < 0.6 ? 'tree' : 'mtn';
        if (MILES.some(([, , , mx, my]) => Math.abs(x - mx) < 38 && Math.abs(y - my) < 44)) continue;
        if (x < 70 || x > 440) continue;
        spr(L, kind, x, y);
      }
      // road
      for (let i = 0; i < MILES.length - 1; i++) { const [, , , x0, y0] = MILES[i], [, , , x1, y1] = MILES[i + 1]; for (let k = 0; k <= 1; k += 0.02) { const x = lerp(x0, x1, k), y = lerp(y0, y1, k) + 4; rect(L, x - 1, y, 3, 2, '#c9a86a'); } }
      spr(L, 'castle', 30, 100); spr(L, 'castle', 452, 160);
      // hero walks the road as the years are read
      const seg = clamp((t - at[0]) / (at[5] + 1 - at[0])) * (MILES.length - 1);
      const i0 = Math.min(MILES.length - 2, Math.floor(seg)), kk = seg - i0;
      const hx = lerp(MILES[i0][3], MILES[i0 + 1][3], kk), hy = lerp(MILES[i0][4], MILES[i0 + 1][4], kk) + 6;
      shadow(L, hx, hy, 10); spr(L, Math.floor(t * 6) % 2 ? 'heroR' : 'heroR2', hx, hy, { scale: 1 });
      MILES.forEach(([yr, a, who, x, y], i) => {
        const u = t - at[i];
        if (u < 0) { L.globalAlpha = 0.35; spr(L, 'stone', x, y); L.globalAlpha = 1; return; }
        const pop = easeOut(u / 0.3);
        spr(L, 'stone', x, y - (1 - pop) * 6);
        if (u < 0.6) sparkle(L, x, y - 6, u, 8, C.z, 2, 14, i + 1);
        const up = y < 120;
        const ly = up ? y - 34 : y + 4;
        text(f, x, ly, String(yr), { align: 'center', c: C.y, z: 1, alpha: pop });
        text(f, x, ly + 10, a, { align: 'center', c: C.w, z: 1, alpha: pop });
        text(f, x, ly + 20, who, { align: 'center', c: C.L, z: 1, alpha: pop });
      });
      const u = t - (L1 + 9.6);
      if (u > 0) {
        const k = easeOut(u / 0.6);
        const x0 = MILES[1][3], x1 = lerp(x0, MILES[5][3], k);
        line(L, x0, 194, x1, 194, C.z, 2); if (k > 0.95) { line(L, x1, 194, x1 - 4, 190, C.z, 2); line(L, x1, 194, x1 - 4, 198, C.z, 2); }
        text(f, (x0 + MILES[5][3]) / 2 + 30, 182, '1953 → 2004：約50年', { align: 'center', c: C.z, alpha: k });
      }
      note(f, t - 0.3, 336, 8, ['組換えDNAと遺伝子導入の歩み'], { c: C.w });
    },
  };
}

// ── 0:40 第1章 刃の港町：制限酵素 ─────────────────────────────────────────
export function smith(b) {
  const scan0 = S(b, 0, 0.8), found = S(b, 0, 3.6), cut1 = S(b, 0, 5.4);
  const sma = S(b, 1, 0.2), cut2 = S(b, 1, 4.6), table = S(b, 1, 6.6);
  const item = S(b, 2) + (b.L[2].dur + 0.6);
  return {
    se: [[0.2, 'fanfareS'], [scan0, 'scan'], [found, 'ding'], [cut1, 'snip'], [sma + 0.3, 'pop'], [cut2, 'chop'], [table, 'menu'], [item, 'item'], [item + 1.6, 'levelup']],
    draw(f, t) {
      const { L } = f;
      brickWall(L, 0, 132, '#6a4f4a', '#4d3936');
      floorTiles(L, 132, '#5a4436', '#4e3a2e');
      // forge
      rect(L, 14, 74, 54, 58, '#3b2c2a'); rect(L, 20, 92, 42, 30, '#1a1012');
      const fl = Math.floor(t * 9) % 3; ellipse(L, 41, 112, 14 - fl, 8, C.o); ellipse(L, 41, 114, 8, 4, C.z);
      L.globalAlpha = 0.1; circle(L, 41, 110, 40 + fl * 2, C.o); L.globalAlpha = 1;
      // anvil table
      rect(L, 120, 184, 240, 5, '#2b2d3a'); rect(L, 130, 189, 6, 10, '#2b2d3a'); rect(L, 344, 189, 6, 10, '#2b2d3a');
      torch(L, 96, 50, t); torch(L, 384, 50, t);
      spr(L, 'hero', 40, 200, { scale: 2 });
      spr(L, 'crab', 430, 200 + bob(t, 1.4), { scale: 2 });
      // BamHI duplex
      const top = 'ACGGATCCTG', bot = comp(top);
      const x0 = 146, y0 = 92, cw = 9;
      if (t < cut1) {
        let hl = null;
        if (t > scan0 && t < found) { const k = Math.floor(((t - scan0) / (found - scan0)) * 5); hl = [k, k + 6]; }
        if (t >= found) hl = [2, 8];
        duplex(f, L, x0, y0, top, bot, { cw, hl });
        if (t >= found) {
          text(f, x0 + 2 * cw + 3 * cw, y0 - 24, 'BamHI の しるし：GGATCC', { align: 'center', c: C.z });
          text(f, x0 + 11 * cw + 4, y0 + 1, '← 2本とも 5\'→3\' に', { c: C.L });
          text(f, x0 + 11 * cw + 4, y0 + 11, '　 読むと同じ（回文）', { c: C.L });
        }
      } else {
        const d = Math.round(20 * easeOut((t - cut1) / 0.5));
        duplex(f, L, x0 - d, y0, 'ACG       ', 'TGCCTAG   ', { cw });
        duplex(f, L, x0 + d, y0, '   GATCCTG', '       GAC', { cw });
        if (t - cut1 < 0.4) { sparkle(L, x0 + 3 * cw, y0 + 5, t - cut1, 10, C.w, 2, 20, 9); }
        if (t > cut1 + 0.6) text(f, x0 + 5 * cw, y0 + 25, '5\' 突出末端（接着末端）', { align: 'center', c: C.y });
      }
      // SmaI duplex — blunt
      if (t > sma) {
        const top2 = 'TACCCGGGAT', bot2 = comp(top2), y2 = 158;
        const a = clamp((t - sma) / 0.3);
        if (t < cut2) {
          duplex(f, L, x0, y2, top2, bot2, { cw, alpha: a, hl: t > sma + 1.2 ? [2, 8] : null });
          if (t > sma + 1.2) text(f, x0 + 5 * cw, y2 - 22, 'SmaI の しるし：CCCGGG', { align: 'center', c: C.z });
        } else {
          const d = Math.round(20 * easeOut((t - cut2) / 0.5));
          duplex(f, L, x0 - d, y2, 'TACCC     ', 'ATGGG     ', { cw });
          duplex(f, L, x0 + d, y2, '     GGGAT', '     CCCTA', { cw });
          if (t > cut2 + 0.6) text(f, x0 + 5 * cw, y2 - 22, '平滑末端（まっすぐ切れる）', { align: 'center', c: C.y });
        }
      }
      // the four cuts on the slide
      if (t > table && t < item) {
        note(f, t - table, 286, 8, ['Sau3AI　 ▼GATC　 　5\'突出', 'BamHI　 G▼GATCC　5\'突出', 'PstI　 CTGCA▼G　3\'突出', 'SmaI　 CCC▼GGG　平滑'], { title: '制限酵素と 切り口（上の鎖）', w: 186 });
      }
      chapter(f, t, 1, '刃の港町', '制限酵素 ― 分子のハサミ');
      itemGet(f, L, t - item, '制限酵素のハサミ', { y: 56, iconFn: (x, y) => {} });
      levelUp(f, t - item - 1.6, 3, { y: 88 });
    },
  };
}

// ── 1:05 第2章 糸紡ぎの村：DNAリガーゼ ───────────────────────────────────
export function ligase(b) {
  const meet = S(b, 0, 2.6), labels = S(b, 1, 0.6), seal1 = S(b, 1, 4.2), seal2 = S(b, 1, 5.6), done = S(b, 1, 8.2);
  const item = done + 2.2;
  return {
    se: [[0.2, 'fanfareS'], [meet, 'snap'], [labels, 'pop'], [seal1, 'join'], [seal2, 'join'], [done, 'sparkle'], [item, 'item'], [item + 1.6, 'levelup']],
    draw(f, t) {
      const { L } = f;
      sky(L, ['#ffb97a', '#ffd29a', '#ffe7b8', '#fff1d0'], 120);
      clouds(L, t, 10, 3, '#fff7e6');
      grass(L, 120);
      // a great web between two trees
      spr(L, 'tree', 64, 132, { scale: 2 }); spr(L, 'tree', 416, 132, { scale: 2 });
      L.globalAlpha = 0.5;
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; line(L, 240, 70, 240 + Math.cos(a) * 140, 70 + Math.sin(a) * 60, C.w); }
      for (let r = 20; r < 140; r += 22) for (let i = 0; i < 9; i++) { const a0 = (i / 9) * Math.PI * 2, a1 = ((i + 1) / 9) * Math.PI * 2; line(L, 240 + Math.cos(a0) * r, 70 + Math.sin(a0) * r * 0.43, 240 + Math.cos(a1) * r, 70 + Math.sin(a1) * r * 0.43, C.w); }
      L.globalAlpha = 1;
      const sy = 40 + Math.round(Math.sin(t * 1.3) * 3);
      line(L, 240, 0, 240, sy - 10, C.w);
      spr(L, 'spider', 240, sy + 10, { scale: 2 });
      spr(L, 'hero', 40, 200, { scale: 2 });
      // the two BamHI fragments find each other
      const x0 = 150, y0 = 120, cw = 9;
      board(L, 96, 76, 210, 120);
      const d = t < meet ? Math.round(lerp(40, 0, easeIn(prog(t, S(b, 0, 0.6), meet)))) : 0;
      const sealed1 = t > seal1, sealed2 = t > seal2;
      duplex(f, L, x0 - d, y0, 'ACG       ', 'TGCCTAG   ', { cw, lab: d > 0, hb: false });
      duplex(f, L, x0 + d, y0, '   GATCCTG', '       GAC', { cw, lab: d > 0, hb: false });
      if (d === 0) {
        for (let i = 3; i < 7; i++) px(L, x0 + i * cw + 3, y0 + 6, C.w); // the sticky ends pair
        text(f, x0 - 14, y0 - 9, "5'", { c: C.l }); text(f, x0 + 10 * cw + 1, y0 - 9, "3'", { c: C.l });
        text(f, x0 - 14, y0 + 13, "3'", { c: C.l }); text(f, x0 + 10 * cw + 1, y0 + 13, "5'", { c: C.l });
        // nicks
        const nick = (x, y, ok) => { if (!ok) { rect(L, x - 1, y, 2, 2, '#3f9a4a'); } else { rect(L, x - 2, y - 1, 4, 4, C.z); } };
        nick(x0 + 3 * cw, y0, sealed1); nick(x0 + 7 * cw, y0 + 10, sealed2);
        if (t > labels) {
          const a = clamp((t - labels) / 0.3);
          if (!sealed1) { text(f, x0 + 3 * cw - 3, y0 - 32, "3'-OH", { align: 'right', c: C.c, alpha: a }); text(f, x0 + 3 * cw + 3, y0 - 32, "5'-P", { c: C.o, alpha: a }); line(L, x0 + 3 * cw, y0 - 20, x0 + 3 * cw, y0 - 13, C.w); }
          if (!sealed2) { text(f, x0 + 7 * cw - 3, y0 + 32, '5\'-P', { align: 'right', c: C.o, alpha: a }); text(f, x0 + 7 * cw + 3, y0 + 32, "3'-OH", { c: C.c, alpha: a }); line(L, x0 + 7 * cw, y0 + 24, x0 + 7 * cw, y0 + 30, C.w); }
        }
        // threads from the spider
        const th = (at, x, y) => { const k = prog(t, at - 0.5, at); if (k > 0 && k < 1) line(L, 240, sy + 2, lerp(240, x, k), lerp(sy + 2, y, k), C.w); if (t > at && t < at + 0.6) sparkle(L, x, y, t - at, 10, C.z, 2, 14, Math.round(x)); };
        th(seal1, x0 + 3 * cw, y0 + 1); th(seal2, x0 + 7 * cw, y0 + 11);
        if (t > seal1 - 0.6 && t < seal2 + 0.4) note(f, t - seal1 + 0.6, 328, 150, ['ATP の力で', 'リン酸と OH を', '共有結合'], { title: 'T4 DNAリガーゼ' });
        if (t > done) {
          const a = clamp((t - done) / 0.3);
          text(f, x0 + 5 * cw, y0 + 46, '組換えDNA 完成！', { align: 'center', c: C.z, alpha: a, bold: true });
          text(f, x0 + 5 * cw, y0 + 60, '（平滑末端どうしも つなげられる）', { align: 'center', c: C.L, alpha: a });
        }
      }
      chapter(f, t, 2, '糸紡ぎの村', 'DNAリガーゼ ― つなぐ糸');
      itemGet(f, L, t - item, 'リガーゼの糸', { y: 56 });
      levelUp(f, t - item - 1.6, 5, { y: 88 });
    },
  };
}

// ── 1:25 違う酵素でも 切り口が合えば ─────────────────────────────────────
export function puzzle(b) {
  const cut = S(b, 0, 2.0), swap = S(b, 0, 3.4), click = S(b, 0, 5.0);
  return {
    se: [[cut, 'snip'], [cut + 0.15, 'snip'], [click, 'jigsaw'], [S(b, 1, 0.4), 'sparkle']],
    draw(f, t) {
      const { L } = f;
      sky(L, ['#ffb97a', '#ffd29a', '#ffe7b8', '#fff1d0'], 120); grass(L, 120);
      spr(L, 'spider', 440, 200 + bob(t), { scale: 2 }); spr(L, 'hero', 36, 200, { scale: 2 });
      const cw = 9;
      const red = (ch, i, s, a, z) => (i >= a && i < z ? C.q : C.w);
      // two sources: BamHI (left) and BglII (right)
      const Ax = 130, Bx = 300, y = 74;
      board(L, 104, 40, 278, 152);
      const colA = i => (i >= 1 && i < 5 ? '#ff6b6b' : C.w), colB = i => (i >= 1 && i < 5 ? '#7aa2ff' : C.w);
      const showSeq = (x, yy, top, bot, ca, alpha = 1) => {
        duplex(f, L, x, yy, top, bot, { cw, letters: false, alpha, lab: false });
        seq(f, x, yy - 10, top, { cw, cols: (ch, i) => ca(i), alpha }); seq(f, x, yy + 13, bot, { cw, cols: (ch, i) => ca(i), alpha });
      };
      if (t < cut) {
        for (const X of [Ax, Bx]) { text(f, X - 10, y - 10, "5'", { c: C.l }); text(f, X + 6 * cw + 1, y - 10, "3'", { c: C.l }); text(f, X - 10, y + 13, "3'", { c: C.l }); text(f, X + 6 * cw + 1, y + 13, "5'", { c: C.l }); }
        showSeq(Ax, y, 'GGATCC', 'CCTAGG', i => (i >= 1 && i < 5 ? '#ff6b6b' : C.w));
        showSeq(Bx, y, 'AGATCT', 'TCTAGA', i => (i >= 1 && i < 5 ? '#7aa2ff' : C.w));
      }
      text(f, Ax + 3 * cw, y - 26, 'BamHI', { align: 'center', c: '#ff6b6b' });
      text(f, Bx + 3 * cw, y - 26, 'BglII', { align: 'center', c: '#7aa2ff' });
      if (t >= cut) {
        const d = Math.round(8 * easeOut((t - cut) / 0.4));
        const k = easeOut(prog(t, swap, click));
        // left pieces stay, right pieces cross over
        showSeq(Ax - d, y, 'G     ', 'CCTAG ', i => (i >= 1 && i < 5 ? '#ff6b6b' : C.w));
        showSeq(Bx - d, y, 'A     ', 'TCTAG ', i => (i >= 1 && i < 5 ? '#7aa2ff' : C.w));
        const rx = lerp(Bx + d, Ax + 0, k), ry = lerp(y, y + 70, k);
        const lx = lerp(Ax + d, Bx + 0, k);
        if (t < click) {
          showSeq(rx, ry, ' GATCT', '     A', i => (i >= 1 && i < 5 ? '#7aa2ff' : C.w));
          showSeq(lx, ry, ' GATCC', '     G', i => (i >= 1 && i < 5 ? '#ff6b6b' : C.w));
          if (k > 0) { showSeq(Ax, y + 70, 'G     ', 'CCTAG ', i => (i >= 1 && i < 5 ? '#ff6b6b' : C.w), k); showSeq(Bx, y + 70, 'A     ', 'TCTAG ', i => (i >= 1 && i < 5 ? '#7aa2ff' : C.w), k); }
        } else {
          // hybrids: left half from one enzyme, right half from the other
          const y2 = y + 70;
          duplex(f, L, Ax, y2, 'GGATCT', 'CCTAGA', { cw, letters: false, lab: false });
          seq(f, Ax, y2 - 10, 'GGATCT', { cw, cols: (ch, i) => (i === 0 ? C.w : i < 5 ? '#7aa2ff' : C.w) });
          seq(f, Ax, y2 + 13, 'CCTAGA', { cw, cols: (ch, i) => (i >= 1 && i < 5 ? '#ff6b6b' : C.w) });
          duplex(f, L, Bx, y2, 'AGATCC', 'TCTAGG', { cw, letters: false, lab: false });
          seq(f, Bx, y2 - 10, 'AGATCC', { cw, cols: (ch, i) => (i >= 1 && i < 5 ? '#ff6b6b' : C.w) });
          seq(f, Bx, y2 + 13, 'TCTAGG', { cw, cols: (ch, i) => (i >= 1 && i < 5 ? '#7aa2ff' : C.w) });
          if (t - click < 0.5) { sparkle(L, Ax + 27, y2 + 5, t - click, 10, C.z, 2, 18, 2); sparkle(L, Bx + 27, y2 + 5, t - click, 10, C.z, 2, 18, 5); }
          for (const X of [Ax, Bx]) { text(f, X - 10, y2 - 10, "5'", { c: C.l }); text(f, X + 6 * cw + 1, y2 - 10, "3'", { c: C.l }); text(f, X - 10, y2 + 13, "3'", { c: C.l }); text(f, X + 6 * cw + 1, y2 + 13, "5'", { c: C.l }); }
          text(f, 243, y2 + 34, '切り口 GATC が相補的 → 連結できる', { align: 'center', c: C.z });
        }
      }
      // jigsaw caption
      if (t > S(b, 1)) note(f, t - S(b, 1), 330, 8, ['設計の自由度が 広がる'], { title: 'ちがう酵素 × 同じ切り口' });
    },
  };
}

// ── 1:40 第3章 歌う森：逆転写酵素 ────────────────────────────────────────
export function rt(b) {
  const primer = S(b, 1, 1.6), synth0 = S(b, 1, 3.4), synth1 = S(b, 1, 7.6), rnaseH = S(b, 1, 8.8), second_ = S(b, 1, 10.0);
  const item = S(b, 2) + b.L[2].dur + 0.5;
  return {
    se: [[0.2, 'fanfareS'], [0.4, 'rec'], [S(b, 0, 1), 'lyre'], [primer, 'snap'], [synth0, 'tape'], [rnaseH, 'pop'], [second_, 'tape'], [item, 'item'], [item + 1.6, 'levelup']],
    draw(f, t) {
      const { L } = f;
      vgrad(L, 0, 0, LW, 140, ['#173d2a', '#1f5236', '#2a6a44', '#357f52']);
      for (let i = 0; i < 14; i++) spr(L, 'tree', 16 + i * 34, 64 + (i % 2) * 6, { scale: 2 });
      grass(L, 130, LH - 130, 8);
      board(L, 76, 76, 300, 92);
      L.globalAlpha = 0.5; for (let i = 0; i < 6; i++) { const x = 60 + i * 70, yy = 30 + ((t * 20 + i * 40) % 90); text(f, x + Math.sin(t + i) * 6, yy, '♪', { c: C.z, alpha: 0.6 }); } L.globalAlpha = 1;
      spr(L, 'fox', 40, 200 + bob(t, 2), { scale: 2 });
      spr(L, 'hero', 444, 200, { flip: true, scale: 2 });
      const cw = 7, x0 = 92, y0 = 100, yB = y0 + 18;
      const body = 'GCCAUGGCUUCGAAG', tail = 'AAAAAAA';
      const m = body + tail, n = m.length;
      const cdna = comp(m.replace(/U/g, 'T'));            // partner strand, aligned under the mRNA
      const second = comp(cdna);                          // = the mRNA sequence written in DNA (T for U)
      const a0 = clamp((t - 0.6) / 0.6);
      text(f, x0 - 11, y0 - 10, "5'", { c: C.l, alpha: a0 }); text(f, x0 + n * cw + 2, y0 - 10, "3'", { c: C.l, alpha: a0 });
      // row A: the mRNA (the song) — chewed by RNase H, then replaced by the second DNA strand
      const chew = t > rnaseH ? clamp((t - rnaseH) / 1.0) : 0;
      const g2 = t > second_ ? Math.floor(clamp((t - second_) / 2.0) * n) : 0;
      for (let i = 0; i < n; i++) {
        const xx = x0 + i * cw;
        if (i < g2) { rect(L, xx, y0, cw - 1, 2, '#f7a8d0'); rect(L, xx + 2, y0 + 2, 2, 5, BASE[second[i]]); continue; }
        if (chew > 0 && (i * 7 % 10) / 10 < chew) continue;
        const wav = t < primer ? Math.round(Math.sin(t * 3 + i * 0.6) * 2) : 0;
        L.globalAlpha = a0; rect(L, xx, y0 + wav, cw - 1, 2, C.c); rect(L, xx + 2, y0 + 2 + wav, 2, 5, BASE[m[i]]); L.globalAlpha = 1;
      }
      const rowA = [...m].map((ch, i) => (i < g2 ? second[i] : chew > 0 && (i * 7 % 10) / 10 < chew ? ' ' : ch)).join('');
      seq(f, x0, y0 - 10, rowA, { cw, cols: (ch, i) => (i < g2 ? '#ffc2e0' : BASE_TXT[ch]), alpha: a0 });
      if (g2 === 0) { text(f, x0 + 2, y0 - 22, 'mRNA', { c: C.c, alpha: a0 * (1 - chew) }); text(f, x0 + body.length * cw + 24, y0 - 22, 'ポリA尾', { c: C.c, alpha: a0 * (1 - chew), align: 'center' }); }
      // row B: oligo(dT) primer, then cDNA growing 5'→3' (leftward along the mRNA)
      if (t > primer - 0.8) {
        const k = easeOut(prog(t, primer - 0.8, primer));
        const yy = lerp(yB + 26, yB, k);
        const grown = t < synth0 ? 0 : Math.floor(clamp((t - synth0) / (synth1 - synth0)) * body.length);
        const from = n - tail.length - grown;
        for (let i = from; i < n; i++) { const xx = x0 + i * cw; rect(L, xx, yy + 5, cw - 1, 2, C.m); rect(L, xx + 2, yy, 2, 5, BASE[cdna[i]]); if (k >= 1 && t < rnaseH + 0.3) px(L, xx + 2, yB - 5, C.w); }
        seq(f, x0, yy + 9, ' '.repeat(from) + cdna.slice(from), { cw, cols: ch => BASE_TXT[ch] });
        text(f, x0 - 11, yy + 9, k >= 1 ? "3'" : '', { c: C.l }); text(f, x0 + n * cw + 2, yy + 9, "5'", { c: C.l, alpha: k });
        if (t > synth0 && t < synth1 + 0.3) { const ex = x0 + from * cw - 6; ellipse(L, ex, yy + 1, 7, 6, C.y); ellipse(L, ex - 2, yy - 1, 3, 2, C.z); px(L, ex - 4, yy, C.k); }
        if (grown < body.length) text(f, x0 + (n - 4) * cw, yy + 22, 'ポリTプライマー', { align: 'center', c: C.m, alpha: k });
        else text(f, x0 + 40, yy + 22, g2 >= n ? '二本鎖 cDNA' : 'cDNA（相補的DNA）', { c: g2 >= n ? C.z : C.m, bold: g2 >= n });
      }
      if (t > rnaseH - 0.2 && t < second_ + 2.4) note(f, t - rnaseH + 0.2, 310, 8, ['RNアーゼH が RNA を分解', 'DNAポリメラーゼが', '相補鎖を合成'], { w: 168 });
      if (t > S(b, 0, 1.2) && t < primer) note(f, t - S(b, 0, 1.2), 286, 8, ['レトロウイルス由来（M-MLV など）', 'RNA を鋳型に DNA をつくる'], { title: '逆転写酵素' });
      chapter(f, t, 3, '歌う森', '逆転写酵素 ― 歌を本に写す');
      itemGet(f, L, t - item, '逆転写の竪琴', { y: 56 });
      levelUp(f, t - item - 1.6, 7, { y: 88 });
    },
  };
}

// ── 2:05 第4章 キャラバンの市場：ベクター ─────────────────────────────────
const VECTORS = [
  ['プラスミド', '0.01〜10 kb', 1], ['λファージ', '10〜20 kb', 2], ['コスミド', '35〜50 kb', 3], ['BAC', '50〜250 kb', 4], ['YAC', '0.5〜3 Mb', 5],
];
export function market(b) {
  const list = S(b, 0, 1.0);
  const sel = VECTORS.map((_, i) => list + 1.2 + i * 1.7);
  const map = S(b, 1, 0.2), buy = S(b, 1, b.L[1].dur + 0.4);
  return {
    se: [[0.2, 'fanfareS'], [0.3, 'crowd'], [list, 'menu'], ...sel.map(s => [s, 'cursor']), [map, 'pop'], [buy, 'cash'], [buy + 0.3, 'item'], [buy + 1.9, 'levelup']],
    draw(f, t) {
      const { L } = f;
      sky(L, ['#ffcf7a', '#ffdf9a', '#ffeab8', '#fff3d6'], 110);
      rect(L, 0, 110, LW, LH - 110, '#e0c48a'); dither(L, 0, 110, LW, LH - 110, '#d2b47a');
      // tents
      for (let i = 0; i < 5; i++) { const x = 10 + i * 96; for (let s = 0; s < 6; s++) rect(L, x + s * 14, 62, 14, 14, s % 2 ? C.r : C.w); rect(L, x, 76, 84, 40, '#7a5236'); rect(L, x + 4, 80, 76, 30, '#5a3a25'); const r = rng(i); for (let k = 0; k < 6; k++) circle(L, x + 10 + k * 12, 100, 3, ['#d8344a', '#f7c948', '#3fb54a', '#f08a3c'][Math.floor(r() * 4)]); }
      spr(L, 'camel', 430, 200 + bob(t, 0.8), { scale: 2 });
      spr(L, 'hero', 370, 200, { scale: 2 });
      let cur = -1; sel.forEach((s, i) => { if (t > s) cur = i; });
      if (t > list && t < map) {
        if (popWin(f, t - list, 8, 64, 172, 92, { z: 2 })) {
          wtext(f, 18, 70, 'どれを おもとめで？', { c: C.y });
          VECTORS.forEach(([n, cap], i) => { wtext(f, 30, 84 + i * 13, n); wtext(f, 170, 84 + i * 13, cap, { align: 'right', c: C.L }); });
          if (cur >= 0) cursor(f, 18, 84 + cur * 13, t);
        }
        // the vehicle that carries that much
        if (cur >= 0) {
          const cx = 250, cy = 134, k = easeOut((t - sel[cur]) / 0.3);
          const r = [8, 0, 13, 18, 0][cur];
          if (cur === 1) { // λ phage: head and tail
            const s = 1 + k * 0.3; ellipse(L, cx, cy - 12, 9 * s, 10 * s, C.l); line(L, cx, cy - 2, cx, cy + 18, C.e, 3); for (let j = -1; j <= 1; j += 2) line(L, cx, cy + 18, cx + j * 10, cy + 26, C.e);
          } else if (cur === 4) { // YAC: a linear artificial chromosome
            rect(L, cx - 46 * k, cy - 4, 92 * k, 8, C.p); rect(L, cx - 3, cy - 6, 6, 12, C.P); rect(L, cx - 48 * k, cy - 5, 4, 10, C.z); rect(L, cx + 44 * k, cy - 5, 4, 10, C.z);
            text(f, cx, cy + 12, 'テロメア・セントロメアを もつ', { align: 'center', c: C.L, size: 16 });
          } else plasmid(L, cx, cy, Math.round(r * (0.7 + 0.3 * k)), [[0.05, 0.2 + cur * 0.08, C.r]], { th: cur >= 3 ? 4 : 3 });
          // a cargo bar on a log scale
          const lg = [Math.log10(10), Math.log10(20), Math.log10(50), Math.log10(250), Math.log10(3000)][cur];
          rect(L, 196, 176, 110, 6, C.k); rect(L, 197, 177, Math.round((lg / Math.log10(3000)) * 108 * k), 4, C.y);
          text(f, 251, 184, '運べる長さ（対数）', { align: 'center', c: C.w });
        }
      }
      if (t > map) {
        // pUC18 map
        const cx = 120, cy = 128, rr = 40;
        const k = clamp((t - map) / 0.4);
        board(L, 20, 64, 200, 136);
        plasmid(L, cx, cy, rr, [[0.02, 0.18, '#f08a3c'], [0.38, 0.52, C.c], [0.62, 0.86, C.r]], { base: C.l, th: 4 });
        text(f, cx, cy - 14, 'pUC18', { align: 'center', c: C.w, z: 2 }); text(f, cx, cy - 2, '2,686 bp', { align: 'center', c: C.L, z: 2 });
        text(f, cx + 44, cy - 46, 'lacZ・MCS', { c: '#f08a3c', z: 2 }); text(f, cx + 34, cy + 34, 'ori', { c: C.c, z: 2 }); text(f, cx - 82, cy - 2, 'AmpR', { c: C.r, z: 2 });
        note(f, t - map - 0.6, 232, 64, ['MCS：外来DNAを入れる場所', 'AmpR：アンピシリン耐性', 'ori：複製開始点', '大腸菌の中で 数十〜数百コピー', '（pUC18 は 500コピー以上）'], { title: 'プラスミドの しくみ' });
      }
      chapter(f, t, 4, 'キャラバンの市場', 'ベクター ― DNAの乗り物');
      itemGet(f, L, t - buy - 0.3, 'プラスミド', { y: 56 });
      levelUp(f, t - buy - 1.9, 9, { y: 88 });
    },
  };
}

// ── 2:30 第5章 歯車の工場：発現ベクター ──────────────────────────────────
export function factory(b) {
  const cutA = S(b, 0, 1.6), insert = S(b, 0, 3.4), into = S(b, 0, 5.4), make = S(b, 0, 7.0), crates = S(b, 1, 0.4);
  return {
    se: [[0.2, 'fanfareS'], [0.4, 'factory'], [cutA, 'snip'], [insert, 'join'], [into, 'pop'], [make, 'factory2'], [crates, 'fanfare'], [crates + 3, 'item'], [crates + 4.6, 'levelup']],
    draw(f, t) {
      const { L } = f;
      brickWall(L, 0, 150, '#4a5266', '#353b4c');
      rect(L, 0, 150, LW, LH - 150, '#2e3240'); dither(L, 0, 150, LW, LH - 150, '#262a36');
      // gears on the wall
      [[40, 40, 16], [76, 58, 10], [440, 44, 14]].forEach(([x, y, r], i) => { const a0 = t * (i % 2 ? -1 : 1) * 1.5; circle(L, x, y, r, '#6b7286'); circle(L, x, y, r - 4, '#4a5266'); for (let k = 0; k < 8; k++) { const a = a0 + (k / 8) * Math.PI * 2; rect(L, x + Math.cos(a) * r - 2, y + Math.sin(a) * r - 2, 4, 4, '#6b7286'); } circle(L, x, y, 3, C.k); });
      // conveyor belt
      rect(L, 0, 186, LW, 8, '#1b1d26'); for (let x = -16; x < LW; x += 16) rect(L, x + ((t * 30) % 16), 188, 8, 2, '#4a5266');
      spr(L, 'golem', 444, 186 + bob(t, 1), { scale: 2 });
      spr(L, 'hero', 28, 186, { scale: 2 });
      // the expression vector
      const vx = 110, vy = 100;
      const cut = t > cutA, ins = t > insert;
      if (t < into + 0.6) {
        const k = 1 - clamp((t - into) / 0.6);
        L.globalAlpha = k;
        // oval plasmid like the slide
        const w = 70, h = 26;
        const draw = (x, y, c) => { rect(L, x - w / 2 + 6, y - h / 2, w - 12, 3, c); rect(L, x - w / 2 + 6, y + h / 2 - 3, w - 12, 3, c); rect(L, x - w / 2, y - h / 2 + 6, 3, h - 12, c); rect(L, x + w / 2 - 3, y - h / 2 + 6, 3, h - 12, c); px(L, x - w / 2 + 3, y - h / 2 + 3, c); px(L, x + w / 2 - 4, y - h / 2 + 3, c); px(L, x - w / 2 + 3, y + h / 2 - 4, c); px(L, x + w / 2 - 4, y + h / 2 - 4, c); };
        draw(vx, vy, C.l);
        rect(L, vx - 24, vy + h / 2 - 3, 12, 3, C.r);
        if (cut && !ins) rect(L, vx - 12, vy + h / 2 - 4, 4, 5, '#2e3240');
        if (ins) rect(L, vx - 12, vy + h / 2 - 3, 26, 3, C.g);
        if (cut && !ins) { const g = easeOut(prog(t, cutA + 0.4, insert)); rect(L, vx - 10, lerp(vy + 52, vy + h / 2 - 3, g), 24, 3, C.g); text(f, vx + 2, lerp(vy + 58, vy + 18, g), '目的遺伝子', { align: 'center', c: C.g }); }
        text(f, vx - 18, vy + 18, 'プロモーター', { align: 'center', c: C.r });
        text(f, vx, vy - 28, '発現ベクター', { align: 'center', c: C.w });
        L.globalAlpha = 1;
      }
      // the cell becomes a factory
      const cx = 220, cy = 52, cw = 150, ch = 90;
      if (t > into) {
        const k = easeOut((t - into) / 0.5);
        cellBox(L, cx, cy, cw * k, ch, { nucleus: false });
        if (k >= 1) {
          plasmid(L, cx + 30, cy + 50, 12, [[0.55, 0.65, C.r], [0.65, 0.9, C.g]], { base: C.l, th: 2 });
          if (t > make) {
            const u = t - make;
            for (let i = 0; i < 3; i++) { const p = (u * 0.8 + i * 0.33) % 1; rect(L, cx + 46 + p * 40, cy + 30 + i * 18, 14, 2, C.b); }
            const r = rng(5);
            const n = Math.min(40, Math.floor(u * 8));
            for (let i = 0; i < n; i++) { const x = cx + 96 + r() * 46, y = cy + 14 + r() * 74; circle(L, x, y, 2, C.g); px(L, x - 1, y - 1, C.v); }
            // products leave on the belt
            for (let i = 0; i < 12; i++) { const p = ((u * 40 + i * 40) % 520) - 40; if (p > cx + cw - 220 && u > 1) circle(L, p, 183, 2, C.g); }
            text(f, cx + cw / 2, cy - 12, `mRNA → タンパク質 ×${Math.min(999999, Math.floor(Math.exp(Math.min(13.8, u * 1.6)))).toLocaleString()}`, { align: 'center', c: C.z });
          }
        }
      }
      if (t > crates) {
        ['インスリン', '成長ホルモン', 'ワクチン抗原'].forEach((n, i) => {
          const u = t - crates - i * 0.5; if (u < 0) return;
          const k = easeOut(u / 0.3), x = 110 + i * 92, y = 152 - (1 - k) * 10;
          rect(L, x, y, 84, 26, '#8a5a3b'); rect(L, x + 2, y + 2, 80, 22, '#a8743f'); line(L, x + 2, y + 2, x + 81, y + 23, '#7a4f2e');
          text(f, x + 42, y + 8, n, { align: 'center', c: C.w, z: 1, alpha: k });
        });
      }
      chapter(f, t, 5, '歯車の工場', '発現ベクター ― 細胞を工場に');
      itemGet(f, L, t - crates - 3, '発現ベクターの歯車', { y: 56 });
      levelUp(f, t - crates - 4.6, 11, { y: 88 });
    },
  };
}

// ── 2:55 第6章 光の入り江：GFP ──────────────────────────────────────────
export function gfp(b) {
  const gem = S(b, 0, 1.4), fuse = S(b, 0, 3.6), scope = S(b, 0, 6.4), credit = S(b, 1, 0);
  return {
    se: [[0.2, 'fanfareS'], [0.6, 'chime'], [gem, 'chime'], [fuse, 'join'], [scope, 'glow'], [credit + 3, 'item'], [credit + 4.6, 'levelup']],
    draw(f, t) {
      const { L } = f;
      night(L, t, 12);
      sea(L, t, 150, ['#071a3a', '#0a2350', '#0e2c62']);
      // moon
      circle(L, 410, 40, 14, '#fff6d0'); circle(L, 416, 36, 12, '#071a3a00');
      // jellyfish spirit with a glow
      const jy = 96 + Math.round(Math.sin(t * 1.2) * 4);
      L.globalAlpha = 0.12 + 0.08 * pulse(t, 0.7); circle(L, 70, jy - 6, 26, C.v); L.globalAlpha = 0.1; circle(L, 70, jy - 6, 36, C.g); L.globalAlpha = 1;
      spr(L, 'jelly', 70, jy + 14, { scale: 3 });
      spr(L, 'hero', 40, 200, { scale: 2 });
      // the gem (GFP)
      if (t > gem) {
        const gx = lerp(70, 170, easeOut(prog(t, gem, gem + 0.8))), gy = 96;
        if (t < fuse) {
          L.globalAlpha = 0.25; circle(L, gx, gy, 10, C.v); L.globalAlpha = 1;
          ellipse(L, gx, gy, 6, 8, C.g); ellipse(L, gx - 2, gy - 3, 2, 3, C.v); text(f, gx, gy + 12, 'GFP', { align: 'center', c: C.v });
          ellipse(L, 230, 96, 34, 10, '#f7c6dc'); text(f, 230, 92, '目的タンパク質', { align: 'center', c: C.k, shadow: false });
        } else {
          const k = easeOut(prog(t, fuse, fuse + 0.4));
          ellipse(L, 200, 96, 34, 10, '#f7c6dc'); text(f, 200, 92, '目的タンパク質', { align: 'center', c: C.k, shadow: false });
          rect(L, 234, 89, 18, 14, C.g); rect(L, 235, 90, 16, 2, C.v);
          L.globalAlpha = 0.2 * pulse(t, 1); circle(L, 239, 96, 12, C.v); L.globalAlpha = 1;
          text(f, 222, 110, 'GFP融合タンパク質', { align: 'center', c: C.z, alpha: k });
        }
      }
      // under the microscope: living cell, a glowing network that moves
      if (t > scope) {
        const k = easeOut((t - scope) / 0.5);
        const cx = 360, cy = 110, r = Math.round(46 * k);
        circle(L, cx, cy, r + 3, C.l); circle(L, cx, cy, r, '#020a04');
        if (k >= 1) {
          const rr = rng(4);
          for (let i = 0; i < 24; i++) { const a = rr() * 6.28, d = 6 + rr() * 30, ph = rr() * 6; let x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; for (let s = 0; s < 6; s++) { const nx = x + Math.cos(ph + s * 0.7 + t * 0.8) * 3, ny = y + Math.sin(ph + s * 0.9 + t * 0.6) * 3; if ((nx - cx) ** 2 + (ny - cy) ** 2 < (r - 2) ** 2) line(L, x, y, nx, ny, s % 2 ? C.g : C.v); x = nx; y = ny; } }
          text(f, cx, cy + r + 6, '生きたまま 見える', { align: 'center', c: C.v });
        }
      }
      if (t > credit) note(f, t - credit, 134, 130, ['オワンクラゲ由来の 緑色蛍光タンパク質', '下村 脩 博士（2008年 ノーベル化学賞）'], { title: 'GFP（Green Fluorescent Protein）', tc: C.v });
      chapter(f, t, 6, '光の入り江', 'GFP ― 光る宝石');
      itemGet(f, L, t - credit - 3, '光る宝石（GFP）', { y: 56 });
      levelUp(f, t - credit - 4.6, 12, { y: 88 });
    },
  };
}

// SCENE 5：コラーゲン製造工場（線維芽細胞における膠原線維の産生 7 工程）
import { W, H, clamp, lerp, ease, easeOut, back, text, panel, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, circle, ellipse, table, sparkle } from '../core.js';
import { factory } from '../bg.js';
import { drawCell } from '../chars.js';

const CH = ['#e0525a', '#f29a2e', '#2f7de1'];

// 3本の α 鎖のらせん。tw: 0=ばらばら 1=らせん
function helix(ctx, x, y, L, amp, tw, t, o = {}) {
  for (let c = 0; c < 3; c++) {
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const k = i / 80, xx = x - L / 2 + k * L;
      const twist = Math.sin(k * 10 * Math.PI + c * 2.094 + t * (o.spin || 0));
      const spread = (c - 1) * 34 * (1 - tw);
      const yy = y + spread + twist * amp * tw + Math.sin(k * 9 + c + t) * 6 * (1 - tw);
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    }
    ctx.lineWidth = o.w || 9; ctx.strokeStyle = CH[c]; ctx.lineCap = 'round'; ctx.stroke();
  }
  if (o.ends) for (const s of [-1, 1]) {
    // 両端のプロペプチド（球状）
    withAlpha(ctx, o.ends, () => {
      for (let c = 0; c < 3; c++) { circle(ctx, x + s * (L / 2 + 22 + c * 6), y + (c - 1) * 16, 18); ctx.fillStyle = CH[c]; ctx.fill(); }
    });
  }
}

function beads(ctx, x, y, n, g, labels, hi, t) {
  for (let i = 0; i < n; i++) {
    if (i / n > g) break;
    const xx = x + i * 46, yy = y + Math.sin(i * 0.7 + t * 2) * 6;
    const lab = labels[i % labels.length];
    circle(ctx, xx, yy, 20);
    ctx.fillStyle = lab === 'G' ? '#ffd23f' : lab === 'P' ? '#9fd3f7' : lab === 'K' ? '#c3a5f0' : '#e6e9f0';
    ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, lab, xx, yy + 1, { size: 20, align: 'center', weight: 800 });
    if (hi && lab === 'G') ring(ctx, xx, yy, 27, 27, 1, COLORS.red, 4);
  }
}

function golgi(ctx, x, y, t) {
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.ellipse(x, y + i * 26, 150 - i * 12, 28, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.lineWidth = 16; ctx.strokeStyle = ['#f3b3c8', '#eea2bb', '#e991ae', '#e480a1', '#df6f94'][i]; ctx.lineCap = 'round'; ctx.stroke();
  }
}

function vesicle(ctx, x, y, r, inner) {
  circle(ctx, x, y, r); ctx.fillStyle = 'rgba(255,240,245,0.95)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#df6f94'; ctx.stroke();
  if (inner) inner();
}

function scissors(ctx, x, y, open, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (const s of [-1, 1]) {
    ctx.save(); ctx.rotate(s * open * 0.4);
    ctx.fillStyle = '#9aa3b4'; rr(ctx, 0, -5, 60, 10, 5); ctx.fill();
    ctx.strokeStyle = '#e0475b'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-16, 0, 13, 0, 7); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export default {
  draw(ctx, S) {
    const t = S.t;
    const stages = ['st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7'];
    let idx = -1;
    stages.forEach((s, i) => { if (S.on(s)) idx = i; });
    // カメラ（工程の位置）
    const SX = (i) => 1250 + i * 900;
    let camX = 0;
    stages.forEach((s, i) => { if (i > 0) camX = lerp(camX, SX(i) - SX(0), S.e(s, 1.2)); });
    factory(ctx, t, { cam: camX * 0.3 });
    const lineOn = S.vis('line', 'done', 0.6);
    const shun = S.actor('shun', [[0, { x: 230, y: 1010, s: 0.8, face: 1, d: 0.01 }], ['line', { x: 180, s: 0.7, d: 1 }], ['snipq', { x: 260 }], ['done', { x: 230, s: 0.8 }]]);
    const sapo = S.actor('sapo', [[0, { x: 470, y: 930, s: 0.85, face: 1, d: 0.01 }], ['line', { x: 420, s: 0.75, d: 1 }], ['vitc', { x: 520, lift: 240 }], ['vitc2', { x: 420, lift: 0 }], ['done', { x: 470, s: 0.85 }]]);
    const fib = S.actor('fibro', [[0, { x: 2300, y: 560, s: 1.4, face: -1, d: 0.01 }], ['fibro', { x: 1250, d: 1.0 }], ['pct', { x: 2400, d: 1.0 }],
      ['snipq', { x: 1700, y: 760, s: 0.8, d: 0.9 }], ['st6', { x: 2400, d: 1.0 }]]);
    if (S.speaking('fibro')) fib.emo = S.emo('fibro', 'happy');

    // コラーゲンの割合（円グラフ）
    const pA = S.vis('pct', 'triple');
    if (pA > 0) withAlpha(ctx, pA, () => pop(ctx, S.p('pct', 0.6), 1150, 520, () => {
      panel(ctx, -420, -300, 840, 600, { r: 34 });
      const k = S.e('pct', 1.2, 0.4);
      circle(ctx, -150, 30, 170); ctx.fillStyle = '#e6e9f0'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-150, 30); ctx.arc(-150, 30, 170, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.275 * k); ctx.closePath(); ctx.fillStyle = COLORS.collagen; ctx.fill();
      text(ctx, '25〜30％', -150, 30, { size: 50, align: 'center', weight: 800, color: COLORS.ink, stroke: '#fff', strokeW: 10 });
      text(ctx, 'コラーゲン', 130, -40, { size: 56, weight: 800, color: COLORS.collagen });
      text(ctx, 'ヒトの全蛋白質の', 130, 40, { size: 34 });
      text(ctx, '25〜30％を占める', 130, 90, { size: 34, weight: 800 });
      tag(ctx, -400, -270, 'med');
    }));

    // 3本のα鎖
    const tA = S.vis('triple', 'line');
    if (tA > 0) withAlpha(ctx, tA, () => {
      panel(ctx, 640, 90, 1240, 720, { title: 'コラーゲン分子の構造', color: COLORS.collagen, color2: '#f07a86', tsize: 34 });
      helix(ctx, 1260, 300, 980, 30, S.e('triple', 2, 0.5), t, { spin: 1.2 });
      withAlpha(ctx, S.p('triple', 0.5, 2), () => {
        arrow(ctx, 770, 400, 1750, 400, { color: COLORS.sub, w: 4, head: 16 }); arrow(ctx, 1750, 400, 770, 400, { color: COLORS.sub, w: 4, head: 16 });
        chip(ctx, 1260, 430, '長さ 約300 nm', { size: 28, align: 'center', fill: COLORS.sub });
        text(ctx, '3本のα鎖のらせん構造', 1260, 210, { size: 36, align: 'center', weight: 800 });
      });
      if (S.on('gly')) {
        const g = S.p('gly', 3);
        beads(ctx, 760, 560, 22, g, ['G', 'X', 'Y'], S.on('gly', 1.5), t);
        withAlpha(ctx, S.p('gly', 0.5, 1), () => text(ctx, 'アミノ酸3つごとにグリシン（G）', 1260, 500, { size: 30, align: 'center', weight: 800, color: '#b38600' }));
      }
      if (S.on('gxy')) withAlpha(ctx, S.p('gxy', 0.6), () => {
        chip(ctx, 1000, 680, '（Gly−X−Y）n', { size: 40, align: 'center', fill: COLORS.ink });
        text(ctx, 'X・Y：プロリン（P）とリシン（K）が多い', 1180, 680, { size: 32, weight: 800 });
      });
    });

    // 製造ライン
    if (lineOn > 0) withAlpha(ctx, lineOn, () => {
      // 工程バー
      const names = ['α鎖の合成', 'α鎖の修飾', '3本らせん', 'ゴルジ→小胞', '分泌・切断', '細線維', '膠原線維'];
      ctx.save(); rr(ctx, 620, 96, 1280, 92, 46); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); ctx.restore();
      names.forEach((n, i) => {
        const x = 690 + i * 182, on = i <= idx, cur = i === idx;
        circle(ctx, x, 142, cur ? 30 : 24); ctx.fillStyle = on ? COLORS.collagen : '#cfd6e4'; ctx.fill();
        text(ctx, `${i + 1}`, x, 143, { size: cur ? 30 : 24, align: 'center', color: '#fff', weight: 800 });
        text(ctx, n, x + 34, 142, { size: 20, weight: 800, color: on ? COLORS.ink : COLORS.gray });
      });
      ctx.save();
      ctx.beginPath(); ctx.rect(600, 200, W - 600, 700); ctx.clip();
      ctx.translate(-camX, 0);
      // 細胞膜（工程4と5の間）
      const mx = (SX(3) + SX(4)) / 2;
      ctx.strokeStyle = '#d6608a'; ctx.lineWidth = 22;
      ctx.beginPath(); for (let y = 200; y <= 900; y += 10) { const x = mx + Math.sin(y * 0.02 + t) * 10; y === 200 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      chip(ctx, mx - 30, 240, '細胞内', { size: 26, align: 'right', fill: '#d6608a' });
      chip(ctx, mx + 30, 240, '細胞外', { size: 26, fill: '#2f7de1' });
      text(ctx, '細胞膜', mx, 870, { size: 26, align: 'center', weight: 800, color: '#d6608a' });
      for (let i = 0; i < 7; i++) {
        const x = SX(i), y = 560;
        ctx.save(); rr(ctx, x - 380, 280, 760, 560, 30); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill(); ctx.strokeStyle = i === idx ? COLORS.collagen : '#e6c3cf'; ctx.lineWidth = i === idx ? 6 : 3; ctx.stroke(); ctx.restore();
        text(ctx, `第${i + 1}工程`, x - 350, 320, { size: 30, weight: 800, color: COLORS.collagen });
        text(ctx, ['粗面小胞体（rER）', '粗面小胞体（rER）', '', 'ゴルジ装置', '細胞外へ分泌', '細胞外', '細胞外'][i], x + 350, 320, { size: 26, align: 'right', weight: 800, color: COLORS.sub });
        const p = S.p(stages[i], 1);
        if (i === 0) {
          ctx.strokeStyle = '#e991ae'; ctx.lineWidth = 18;
          ctx.beginPath(); for (let xx = x - 330; xx <= x + 330; xx += 10) { const yy = 430 + Math.sin(xx * 0.03) * 12; xx === x - 330 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); } ctx.stroke();
          for (let xx = x - 320; xx <= x + 320; xx += 40) { circle(ctx, xx, 410 + Math.sin(xx * 0.03) * 12, 9); ctx.fillStyle = '#7a3a6a'; ctx.fill(); }
          beads(ctx, x - 300, 560, 14, S.p('st1', 4), ['G', 'P', 'K'], false, t);
          text(ctx, 'リボソームでα鎖を合成', x, 680, { size: 32, align: 'center', weight: 800 });
          text(ctx, '（リボソームの点：rER）', x, 730, { size: 24, align: 'center', color: COLORS.sub });
        }
        if (i === 1) {
          beads(ctx, x - 300, 470, 14, 1, ['G', 'P', 'K'], false, t);
          const kOH = S.p('st2', 0.6, 2), kSug = S.p('st2', 0.6, 4), kSS = S.p('st2', 0.6, 5.5);
          const fail = S.on('vitc2') && !S.on('hyp') ? 1 : 0;
          for (let b = 0; b < 14; b++) {
            const lab = ['G', 'P', 'K'][b % 3], bx = x - 300 + b * 46, by = 470 + Math.sin(b * 0.7 + t * 2) * 6;
            if (lab !== 'G') pop(ctx, kOH * (fail ? 0.3 : 1), bx, by - 44, () => { chip(ctx, 0, 0, 'OH', { size: 16, align: 'center', fill: fail ? COLORS.gray : COLORS.teal, shadow: false }); });
            if (lab === 'K' && b % 2) pop(ctx, kSug, bx, by + 46, () => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } ctx.closePath(); ctx.fillStyle = '#f5c542'; ctx.fill(); ctx.strokeStyle = '#a67c00'; ctx.lineWidth = 2; ctx.stroke(); });
          }
          withAlpha(ctx, kSS, () => chip(ctx, x + 340, 470, 'S−S', { size: 22, align: 'right', fill: '#8a6a3a' }));
          withAlpha(ctx, kOH, () => text(ctx, '水酸化（OH）・糖鎖付加・ジスルフィド結合', x, 600, { size: 30, align: 'center', weight: 800 }));
          if (S.on('vitc')) {
            const k = S.p('vitc', 0.8);
            pop(ctx, k, x - 300, 700, () => {
              circle(ctx, 0, 0, 52); ctx.fillStyle = '#ff9f1c'; ctx.fill(); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 4; ctx.stroke();
              text(ctx, 'C', 0, 2, { size: 54, align: 'center', color: '#fff', weight: 800 });
            });
            withAlpha(ctx, k, () => text(ctx, 'プロリン・リシンの水酸化に ビタミンC が必要', x + 60, 700, { size: 28, align: 'center', weight: 800, color: '#d97706', maxW: 480 }));
            if (!fail) for (let s2 = 0; s2 < 6; s2++) sparkle(ctx, x - 300 + s2 * 120, 420 + Math.sin(t * 3 + s2) * 10, 12 * k, t + s2, '#ffb703');
          }
          if (fail) withAlpha(ctx, S.p('vitc2', 0.4), () => { chip(ctx, x, 780, '✕ ビタミンC不足 → この過程が障害', { size: 30, align: 'center', fill: COLORS.red }); });
          if (S.on('hyp')) withAlpha(ctx, S.p('hyp', 0.5), () => {
            chip(ctx, x - 160, 780, 'ヒドロキシプロリン：3本の鎖を結合', { size: 22, align: 'center', fill: COLORS.teal });
            chip(ctx, x + 210, 780, 'ヒドロキシリシン：糖がつく', { size: 22, align: 'center', fill: '#a67c00' });
          });
        }
        if (i === 2) {
          helix(ctx, x, 520, 520, 24, S.e('st3', 2.5, 0.5), t, { ends: 1, w: 8 });
          withAlpha(ctx, S.p('st3', 0.5, 2.5), () => { chip(ctx, x, 650, 'プロコラーゲン procollagen', { size: 34, align: 'center', fill: COLORS.collagen }); text(ctx, '（両端にまだ余分な部分がついている）', x, 720, { size: 24, align: 'center', color: COLORS.sub }); });
        }
        if (i === 3) {
          golgi(ctx, x - 100, 420, t);
          const k = S.e('st4', 3, 1);
          vesicle(ctx, lerp(x - 60, x + 210, k), lerp(560, 600, k), 80, () => at(ctx, lerp(x - 60, x + 210, k), lerp(560, 600, k), 0.22, () => helix(ctx, 0, 0, 520, 24, 1, t, { ends: 1, w: 8 })));
          text(ctx, 'ゴルジ装置に送られ、小胞を形成', x, 760, { size: 30, align: 'center', weight: 800 });
        }
        if (i === 4) {
          const k = S.e('st5', 2.5, 0.2);
          const vx = lerp(x - 420, x - 200, k);
          if (k < 0.98) vesicle(ctx, vx, 520, 80 * (1 - k * 0.3));
          const cut = S.p('st5', 1.0, 4.5);
          helix(ctx, x + 40, 520, 400, 18, 1, t, { ends: 1 - cut, w: 7 });
          if (S.on('st5', 3.6)) {
            const op = Math.abs(Math.sin(S.since('st5') * 8)) * (1 - cut);
            scissors(ctx, x + 40 - 230, 470, op, 0.6); scissors(ctx, x + 40 + 230, 470, op, Math.PI - 0.6);
          }
          if (cut > 0) for (const sgn of [-1, 1]) withAlpha(ctx, 1 - cut, () => { for (let c = 0; c < 3; c++) { circle(ctx, x + 40 + sgn * (240 + cut * 120), 520 + (c - 1) * 16 + cut * 80, 16); ctx.fillStyle = CH[c]; ctx.fill(); } });
          withAlpha(ctx, S.p('st5', 0.5, 1), () => chip(ctx, x - 60, 660, '構造的分泌経路で分泌', { size: 26, align: 'center', fill: '#d6608a' }));
          withAlpha(ctx, cut, () => chip(ctx, x + 40, 740, '両端を切断 → コラーゲン分子（トロポコラーゲン）', { size: 26, align: 'center', fill: COLORS.collagen }));
          if (S.on('snipq')) ring(ctx, x + 40, 520, 330, 140, S.p('snipq', 0.8), COLORS.blue, 7);
          if (S.on('outside')) withAlpha(ctx, S.p('outside', 0.4), () => chip(ctx, x + 40, 380, '切るのは細胞の外！', { size: 32, align: 'center', fill: COLORS.blue }));
        }
        if (i === 5) {
          const k = S.e('st6', 3);
          for (let r = 0; r < 5; r++) for (let m = 0; m < 3; m++) {
            const off = (r % 4) * 60;
            const tx = x - 300 + off + m * 250, ty = 420 + r * 40;
            const sx = lerp(tx + (m - 1) * 200 + (r - 2) * 50, tx, k), sy = lerp(ty + (r - 2) * 50, ty, k);
            ctx.strokeStyle = CH[(r + m) % 3]; ctx.lineWidth = 10; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 220, sy); ctx.stroke();
          }
          withAlpha(ctx, S.p('st6', 0.5, 3), () => chip(ctx, x, 700, '重合して 膠原細線維 collagen fibril', { size: 30, align: 'center', fill: COLORS.collagen }));
        }
        if (i === 6) {
          const k = S.e('st7', 3);
          for (let f = 0; f < 6; f++) {
            const yy = lerp(400 + f * 50, 500 + (f - 2.5) * 16, k);
            ctx.strokeStyle = f % 2 ? '#e0525a' : '#ec7a82'; ctx.lineWidth = 18; ctx.lineCap = 'round';
            ctx.beginPath(); for (let xx = x - 320; xx <= x + 320; xx += 10) { const y2 = yy + Math.sin(xx * 0.02 + f * 0.2) * 16 * k; xx === x - 320 ? ctx.moveTo(xx, y2) : ctx.lineTo(xx, y2); } ctx.stroke();
          }
          withAlpha(ctx, S.p('st7', 0.5, 2), () => {
            chip(ctx, x, 660, '束ねられて 膠原線維 collagen fiber', { size: 30, align: 'center', fill: COLORS.collagen });
            text(ctx, '主にI型コラーゲンの重合による', x, 730, { size: 28, align: 'center', weight: 800 });
          });
        }
      }
      ctx.restore();
    });

    // 完成：膠原線維
    const dA = S.vis('done', 'types');
    if (dA > 0) withAlpha(ctx, dA, () => {
      panel(ctx, 640, 90, 1240, 720, { title: '膠原線維 collagen fiber', color: COLORS.collagen, color2: '#f07a86', tsize: 34 });
      const col = S.on('stain') ? null : null;
      at(ctx, 900, 560, 1.2, () => drawCell(ctx, 'collagen', { t, mouth: S.mouth('collagen'), emo: 'happy' }));
      bullets3(ctx, S, 1120, 260);
      if (S.on('stain')) {
        const k = S.p('stain', 0.6);
        pop(ctx, k, 1300, 620, () => swatch(ctx, 'HE染色', '赤', '#e0475b', t));
        pop(ctx, S.p('stain', 0.6, 2), 1640, 620, () => swatch(ctx, 'AFMG染色', '緑', '#2fa45a', t));
      }
    });
    // コラーゲンの型
    const yA = S.vis('types');
    if (yA > 0) withAlpha(ctx, yA, () => {
      panel(ctx, 640, 90, 1240, 720, { title: 'コラーゲンの種類とその分布', color: COLORS.collagen, color2: '#f07a86', tsize: 34 });
      withAlpha(ctx, S.p('types', 0.5), () => text(ctx, 'α鎖のアミノ酸配列の組み合わせで、異なるcollagen fiberができる', 1260, 200, { size: 30, align: 'center', weight: 800 }));
      table(ctx, 700, 250, [200, 520, 400], 100, [['分類', '分布', '特徴'], [{ t: 'I型', c: COLORS.red }, '通常の結合組織 ＆ 骨', '重合度 大'], [{ t: 'II型', c: COLORS.red }, '軟骨', '重合度 小'],
        [{ t: 'III型', c: COLORS.red }, '細網線維', '重合度 小'], [{ t: 'IV型', c: COLORS.red }, '基底膜', '線維構造（−）']], { size: 32, p: (r) => S.p('types2', 0.4, (r - 1) * 2.4) + (r === 0 ? 1 : 0) });
      if (S.on('mnemonic')) pop(ctx, S.p('mnemonic', 0.5), 1260, 790, () => { chip(ctx, 0, 0, '覚え方：I 骨・II 軟骨・III 網・IV 膜', { size: 36, align: 'center', fill: COLORS.orange }); });
    });

    S.draw(ctx, fib, { hammer: true });
    S.draw(ctx, sapo);
    S.draw(ctx, shun);
  },
};

function swatch(ctx, name, col, c, t) {
  rr(ctx, -150, -120, 300, 230, 22); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#d5ddec'; ctx.lineWidth = 3; ctx.stroke();
  for (let f = 0; f < 3; f++) { ctx.strokeStyle = c; ctx.lineWidth = 14; ctx.beginPath(); for (let x = -120; x <= 120; x += 10) { const y = -50 + f * 30 + Math.sin(x * 0.05 + f) * 8; x === -120 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  text(ctx, name, 0, 60, { size: 30, align: 'center', weight: 800 });
  chip(ctx, 0, 140, col + 'に染まる', { size: 26, align: 'center', fill: c });
}

function bullets3(ctx, S, x, y) {
  const items = [['張力への抵抗力が強い', 0], ['波状', 2.2], ['枝分かれなし', 3.6]];
  items.forEach(([s, d], i) => withAlpha(ctx, S.p('done', 0.4, d), () => chip(ctx, x, y + i * 80, s, { size: 34, fill: COLORS.collagen })));
}

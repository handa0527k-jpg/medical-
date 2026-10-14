// SCENE 6：3種類の線維を見分けろ！（膠原線維・細網線維・弾性線維、染色性）
import { W, H, clamp, lerp, ease, easeOut, text, panel, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, circle, table, sparkle } from '../core.js';
import { arena } from '../bg.js';
import { drawCell } from '../chars.js';
import { reticularTissue } from '../tissue.js';

const F = [['collagen', '膠原線維', 'collagen fiber', '約10 μm', 'コラーゲン', COLORS.collagen],
  ['reticular', '細網線維', 'reticular fiber', '1 μm未満', 'コラーゲン（主にIII型）', '#555b6e'],
  ['elastic', '弾性線維', 'elastic fiber', '約1 μm', 'エラスチン', '#d08a12']];

function elastinNet(ctx, x, y, w, h, stretch, t) {
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    const yy = y + (r + 0.5) * h / rows;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const k = i / 120, xx = x + k * w;
      const amp = lerp(26, 4, stretch);
      const off = Math.sin(k * lerp(40, 10, stretch) + r * 1.7 + t * 0.5) * amp + Math.cos(k * 17 + r) * amp * 0.5;
      i ? ctx.lineTo(xx, yy + off) : ctx.moveTo(xx, yy + off);
    }
    ctx.strokeStyle = '#b07a3a'; ctx.lineWidth = 6; ctx.stroke();
  }
  // 架橋
  ctx.strokeStyle = '#2f5fd6'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (let r = 0; r < rows - 1; r++) for (let i = 0; i < 6; i++) {
    const xx = x + (i + 0.5 + (r % 2) * 0.3) * w / 6.3;
    const y1 = y + (r + 0.5) * h / rows, y2 = y + (r + 1.5) * h / rows;
    ctx.beginPath(); ctx.moveTo(xx, y1 + 8); ctx.lineTo(xx, y2 - 8); ctx.stroke();
  }
}

export default {
  draw(ctx, S) {
    const t = S.t;
    arena(ctx, t);
    const shun = S.actor('shun', [[0, { x: 200, y: 1010, s: 0.75, face: 1, d: 0.01 }], ['three', { x: 260, d: 0.6 }], ['battle', { x: 190 }], ['realize', { x: 270 }]]);
    const sapo = S.actor('sapo', [[0, { x: 430, y: 930, s: 0.8, face: 1, d: 0.01 }], ['coil', { x: 500, lift: 220 }], ['elaloc', { x: 430, lift: 0 }], ['battle', { x: 480, lift: 180 }], ['he', { x: 430, lift: 0 }], ['exam', { x: 500, lift: 200 }]]);

    // タイトル
    pop(ctx, S.p('intro', 0.5) * S.vis('intro', 'coll'), 1200, 300, () => {
      text(ctx, '線維 三大選手 登場！', 0, 0, { size: 100, align: 'center', weight: 800, color: '#ffe066', stroke: '#3b2a7a', strokeW: 24 });
    });
    // 3選手の紹介
    const fA = S.vis('coll', 'retstain');
    if (fA > 0) withAlpha(ctx, fA, () => {
      F.forEach(([k, n, en, th, comp, col], i) => {
        const lab = ['coll', 'ret', 'ela'][i];
        const p = S.p(lab, 0.6);
        if (p <= 0) return;
        const x = 820 + i * 430;
        const jump = S.speaking(k) ? -Math.abs(Math.sin(t * 5)) * 20 : 0;
        pop(ctx, p, x, 420 + jump, () => {
          ctx.save();
          if (S.speaking(k)) { ctx.shadowColor = col; ctx.shadowBlur = 60; }
          drawCell(ctx, k, { t, mouth: S.mouth(k), emo: 'happy', stretch: k === 'elastic' ? 1 + 0.35 * Math.sin(t * 6) : undefined });
          ctx.restore();
        });
        pop(ctx, S.p(lab, 0.5, 0.6), x, 720, () => {
          rr(ctx, -200, -95, 400, 190, 24); ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.stroke();
          text(ctx, n, 0, -50, { size: 42, align: 'center', weight: 800, color: col });
          text(ctx, en, 0, -10, { size: 22, align: 'center', color: COLORS.sub });
          text(ctx, `太さ：${th}`, 0, 30, { size: 28, align: 'center', weight: 800 });
          text(ctx, `成分：${comp}`, 0, 68, { size: 26, align: 'center', weight: 800 });
        });
      });
      if (S.on('three')) {
        const k = S.p('three', 0.5);
        [['ロープ', 820], ['網', 1250], ['バネ', 1680]].forEach(([s, x], i) => withAlpha(ctx, S.p('three', 0.4, i * 0.6), () => tatoe(ctx, 1, x, 140, s, { size: 32 })));
      }
    });

    // 細網線維の詳細
    const rA = S.vis('retstain', 'elastruct');
    if (rA > 0) withAlpha(ctx, rA, () => {
      panel(ctx, 620, 90, 1260, 740, { title: '細網線維 reticular fiber', color: '#555b6e', color2: '#7a8197', tsize: 34 });
      reticularTissue(ctx, 660, 180, 560, 620, t, { seed: 33 });
      chip(ctx, 940, 205, '鍍銀染色の見え方（模式図）', { size: 22, align: 'center', fill: '#333' });
      const L = [['主にIII型コラーゲン・重合度が低く細い', 'retstain', 0], ['HE染色：見えない', 'retstain', 3.5], ['鍍銀染色：黒く染まる', 'retstain', 5.5],
        ['網目状に分岐', 'retloc', 0], ['細網細胞（線維芽細胞の一種）にまとわりつく', 'retloc', 2.5], ['主な部位：細網組織（骨髄・リンパ系など）', 'retloc', 7]];
      L.forEach(([s, lab, d], i) => withAlpha(ctx, S.p(lab, 0.4, d), () => {
        chip(ctx, 1250, 230 + i * 96, s, { size: i === 2 ? 30 : 26, fill: i === 2 ? '#222' : i === 1 ? COLORS.gray : '#555b6e' });
      }));
    });

    // 弾性線維の詳細
    const eA = S.vis('elastruct', 'battle');
    if (eA > 0) withAlpha(ctx, eA, () => {
      panel(ctx, 620, 90, 1260, 740, { title: '弾性線維 elastic fiber', color: '#d08a12', color2: '#f2b632', tsize: 34 });
      const st = S.on('coil') ? 0.5 + 0.5 * Math.sin((t - S.L('coil')) * 1.8) : 0;
      ctx.save(); rr(ctx, 660, 170, 620, 440, 20); ctx.fillStyle = '#fff8ea'; ctx.fill(); ctx.clip();
      const w = lerp(440, 580, st);
      elastinNet(ctx, 970 - w / 2, 200, w, 380, st, t);
      ctx.restore();
      chip(ctx, 970, 640, st > 0.5 ? '(a) 引き伸ばし' : '(b) ゆるみ', { size: 28, align: 'center', fill: '#d08a12' });
      withAlpha(ctx, S.p('elastruct', 0.5, 1), () => { chip(ctx, 700, 720, '1本のエラスチン分子（コイル状の1本鎖蛋白質）', { size: 22, fill: '#b07a3a' }); chip(ctx, 700, 780, '架橋', { size: 22, fill: '#2f5fd6' }); });
      if (S.on('coil')) { arrow(ctx, 700, 400, 640, 400, { p: st, color: COLORS.red, w: 8 }); arrow(ctx, 1240, 400, 1300, 400, { p: st, color: COLORS.red, w: 8 }); }
      const L = [['直径 約0.2〜1 μm', 'elastruct', 4], ['引くと伸び、離すと戻る', 'coil', 0], ['HE：染まらない／AFMG：紫', 'coil', 2], ['直線的に走行し、分岐もある', 'elaloc', 0]];
      L.forEach(([s, lab, d], i) => withAlpha(ctx, S.p(lab, 0.4, d), () => chip(ctx, 1320, 220 + i * 90, s, { size: 26, fill: '#d08a12' })));
      if (S.on('elaloc')) withAlpha(ctx, S.p('elaloc', 0.5, 3), () => {
        text(ctx, '主な存在部位', 1320, 600, { size: 30, weight: 800 });
        ['血管壁（弾性板）・項靭帯・弾性軟骨', '疎性結合組織でも膠原線維に混じって存在'].forEach((s, i) => text(ctx, '・' + s, 1320, 650 + i * 50, { size: 26, weight: 700, maxW: 540 }));
      });
    });

    // 染色対決
    const bA = S.vis('battle');
    if (bA > 0) withAlpha(ctx, bA, () => {
      panel(ctx, 620, 90, 1260, 760, { title: '結合組織の染色（講義資料の表）', color: '#7a3ad0', color2: '#a35fe8', tsize: 34 });
      tag(ctx, 1860, 122, 'exam', { align: 'right' });
      text(ctx, 'AFMG染色＝Aldehyde fuchsin-Masson-Goldner stain', 1250, 190, { size: 24, align: 'center', color: COLORS.sub });
      const x0 = 680, y0 = 230, cw = [300, 290, 290, 290], rh = 140;
      const heads = ['', 'HE', 'AFMG', '鍍銀'];
      heads.forEach((h, c) => { if (c) { ctx.fillStyle = '#efe8ff'; ctx.fillRect(x0 + cw.slice(0, c).reduce((a, b) => a + b, 0), y0, cw[c], 70); text(ctx, h, x0 + cw.slice(0, c).reduce((a, b) => a + b, 0) + cw[c] / 2, y0 + 36, { size: 34, align: 'center', weight: 800 }); } });
      const cells = [[['赤', '#e0475b'], ['緑', '#2fa45a'], ['−', null]], [['−', null], ['−', null], ['黒', '#1d1d1f']], [['無色', '#ffffff'], ['紫', '#8b3ad6'], ['−', null]]];
      F.forEach(([k, n, en, th, comp, col], r) => {
        const y = y0 + 70 + r * rh;
        ctx.fillStyle = r % 2 ? '#fafbff' : '#fff'; ctx.fillRect(x0, y, cw.reduce((a, b) => a + b, 0), rh);
        ctx.strokeStyle = '#d7dcea'; ctx.lineWidth = 2; ctx.strokeRect(x0, y, cw.reduce((a, b) => a + b, 0), rh);
        at(ctx, x0 + 60, y + rh / 2, 0.3, () => drawCell(ctx, k, { t, mouth: 0 }));
        text(ctx, n, x0 + 120, y + rh / 2, { size: 34, weight: 800, color: col });
        ['he', 'afmg', 'silver'].forEach((lab, c) => {
          const p = S.p(lab, 0.5, r * 1.6);
          if (p <= 0) return;
          const cx = x0 + cw.slice(0, c + 1).reduce((a, b) => a + b, 0) + cw[c + 1] / 2;
          const [s, swc] = cells[r][c];
          pop(ctx, p, cx, y + rh / 2, () => {
            if (swc) {
              ctx.strokeStyle = swc === '#ffffff' ? '#cfd3dd' : swc; ctx.lineWidth = 14; ctx.lineCap = 'round';
              ctx.beginPath(); for (let x = -90; x <= 90; x += 10) { const yy = -18 + Math.sin(x * 0.06) * 8; x === -90 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke();
              if (swc === '#ffffff') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.stroke(); }
            }
            text(ctx, s, 0, 34, { size: 36, align: 'center', weight: 800, color: swc && swc !== '#ffffff' ? swc : COLORS.sub });
          });
        });
      });
      if (S.on('realize')) ring(ctx, x0 + 300 + 290 * 2 + 145, y0 + 70 + rh * 1.5, 130, 62, S.p('realize', 0.8), COLORS.red, 7);
      if (S.on('exam')) {
        ring(ctx, x0 + 300 + 145, y0 + 70 + rh * 0.5, 120, 60, S.p('exam', 0.6, 2), '#ffb703', 6);
        ring(ctx, x0 + 300 + 290 + 145, y0 + 70 + rh * 0.5, 120, 60, S.p('exam', 0.6, 3), '#ffb703', 6);
        ring(ctx, x0 + 300 + 290 + 145, y0 + 70 + rh * 2.5, 120, 60, S.p('exam', 0.6, 6.5), '#ffb703', 6);
      }
    });

    S.draw(ctx, sapo);
    S.draw(ctx, shun);
  },
};

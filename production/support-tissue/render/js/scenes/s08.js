// SCENE 8：基底膜の秘密（基底膜と基底板、IV型コラーゲン、接着）
import { W, H, clamp, lerp, ease, easeOut, measure, text, panel, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, circle, ellipse, rnd } from '../core.js';
import { soft } from '../bg.js';
import { epiCross } from '../tissue.js';

function emLayers(ctx, x, y, w, t, o = {}) {
  // 上皮細胞の底面（細胞膜）
  ctx.fillStyle = '#e3e7f3'; ctx.fillRect(x, y, w, 150);
  ctx.fillStyle = '#7b86a8'; ctx.fillRect(x, y + 150, w, 8);
  // 透明板
  ctx.fillStyle = '#f9fbff'; ctx.fillRect(x, y + 158, w, 60);
  // 緻密板
  ctx.fillStyle = '#7a6a9a'; ctx.fillRect(x, y + 218, w, 70);
  // 線維網状板（細網線維）
  ctx.fillStyle = '#f4eef8'; ctx.fillRect(x, y + 288, w, 190);
  const r = rnd(5);
  ctx.strokeStyle = '#2d2f3a'; ctx.lineWidth = 4;
  for (let i = 0; i < 22; i++) {
    const x0 = x + r() * w, y0 = y + 300 + r() * 170;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 60, y0 - 40 + r() * 80, x0 + 120 + r() * 80, y0 + (r() - 0.5) * 60); ctx.stroke();
  }
  if (o.comp) withAlpha(ctx, o.comp, () => {
    // IV型コラーゲンの網（緻密板の中）
    ctx.strokeStyle = '#d9c2ff'; ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) { const xx = x + i * w / 18; ctx.beginPath(); ctx.moveTo(xx, y + 222); ctx.lineTo(xx + 40, y + 284); ctx.moveTo(xx + 40, y + 222); ctx.lineTo(xx, y + 284); ctx.stroke(); }
    // ラミニン（十字）とプロテオグリカン
    for (let i = 0; i < 8; i++) {
      const xx = x + 60 + i * w / 8;
      ctx.strokeStyle = '#2fa45a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(xx, y + 168); ctx.lineTo(xx, y + 230); ctx.moveTo(xx - 18, y + 185); ctx.lineTo(xx + 18, y + 185); ctx.stroke();
      ctx.strokeStyle = '#f29a2e'; ctx.lineWidth = 3;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(xx + 50, y + 200 + k * 6); ctx.lineTo(xx + 70, y + 196 + k * 6); ctx.stroke(); }
    }
  });
}

function collagenIV(ctx, x, y, L, ang, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  for (let c = 0; c < 3; c++) {
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const k = i / 30; ctx.lineTo(k * L, Math.sin(k * 14 + c * 2.1 + t) * 6); }
    ctx.strokeStyle = ['#7b5bd6', '#a07ae8', '#5b3fb0'][c]; ctx.lineWidth = 4; ctx.stroke();
  }
  circle(ctx, L + 10, 0, 13); ctx.fillStyle = '#5b3fb0'; ctx.fill();
  ctx.restore();
}

function integrin(ctx, x, y, col) {
  ctx.strokeStyle = col || '#2fa45a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 9, y - 40); ctx.lineTo(x - 9, y + 40); ctx.moveTo(x + 9, y - 40); ctx.lineTo(x + 9, y + 40); ctx.stroke();
}

function chain(ctx, S, x, y, steps, lab, colr) {
  steps.forEach(([s, c], i) => {
    const p = S.p(lab, 0.5, i * 2.2);
    if (p <= 0) return;
    const yy = y + i * 105;
    pop(ctx, p, x, yy, () => { rr(ctx, -290, -38, 580, 76, 20); ctx.fillStyle = c; ctx.fill(); const sz = Math.min(28, 28 * 540 / measure(ctx, s, 28, 800)); text(ctx, s, 0, 2, { size: sz, align: 'center', weight: 800, color: '#fff' }); });
    if (i > 0) arrow(ctx, x, yy - 67, x, yy - 40, { p, color: colr, w: 6, head: 16 });
  });
}

export default {
  draw(ctx, S) {
    const t = S.t;
    soft(ctx, t, '#eef1ff', '#fffaf3');
    const shun = S.actor('shun', [[0, { x: 210, y: 1010, s: 0.78, face: 1, d: 0.01 }], ['q', { x: 300 }], ['ans', { x: 220 }], ['fence', { x: 300 }], ['hd', { x: 210 }]]);
    const sapo = S.actor('sapo', [[0, { x: 450, y: 930, s: 0.82, face: 1, d: 0.01 }], ['bm', { x: 520, lift: 250 }], ['func', { x: 450, lift: 0 }], ['ans', { x: 530, lift: 230 }], ['blcomp', { x: 450, lift: 0 }], ['sum', { x: 520, lift: 200 }]]);

    // 断面図
    const cA = S.vis(0, 'lm');
    if (cA > 0) withAlpha(ctx, cA, () => {
      panel(ctx, 620, 80, 1270, 790, { title: '基底膜 basement membrane', color: '#7a6a9a', color2: '#a08ccc', tsize: 36 });
      epiCross(ctx, 660, 170, 1190, 380, t, { epiH: 150, hiBM: S.on('bm') ? 1 : 0, seed: 12 });
      if (S.on('bm')) {
        ring(ctx, 1255, 338, 600, 22, S.p('bm', 0.8), COLORS.orange, 5);
        withAlpha(ctx, S.p('bm', 0.5, 0.8), () => {
          chip(ctx, 700, 300, '上皮', { size: 26, fill: '#5a7bd6' });
          chip(ctx, 700, 400, '結合組織', { size: 26, fill: '#d6608a' });
          chip(ctx, 1500, 300, '基底膜：上皮と結合組織の境界にあるECMの層', { size: 26, align: 'center', fill: COLORS.orange });
        });
      }
      const fun = [['上皮の支持', 0], ['物質の選択的透過', 1.5], ['上皮の増殖・移動・再生', 3]];
      fun.forEach(([s, d], i) => pop(ctx, S.p('func', 0.5, d), 840 + i * 420, 620, () => { rr(ctx, -190, -50, 380, 100, 24); ctx.fillStyle = '#7a6a9a'; ctx.fill(); text(ctx, s, 0, 2, { size: 30, align: 'center', weight: 800, color: '#fff' }); }));
      if (S.on('where')) withAlpha(ctx, S.p('where', 0.5), () => {
        text(ctx, '上皮細胞以外にも：', 680, 735, { size: 28, weight: 800 });
        ['平滑筋・骨格筋の細胞', '脂肪細胞', '末梢神経のシュワン細胞 など'].forEach((s, i) => withAlpha(ctx, S.p('where', 0.4, 1 + i * 1.4), () => chip(ctx, 960 + i * 300, 735, s, { size: 24, fill: '#a08ccc' })));
        withAlpha(ctx, S.p('where', 0.4, 6), () => text(ctx, 'の周囲にもある', 1360, 805, { size: 28, weight: 800 }));
      });
    });
    // 光学顕微鏡
    const lA = S.vis('lm', 'zoom');
    if (lA > 0) withAlpha(ctx, lA, () => {
      panel(ctx, 620, 80, 1270, 790, { title: '光学顕微鏡レベルの基底膜', color: '#7a6a9a', color2: '#a08ccc', tsize: 36 });
      const tiles = [['HE', '無構造に見える', '#e7b9d8', null, 0], ['PAS-H', '陽性：GAGによる', '#e9c6dc', '#c3247a', 3], ['鍍銀', '陽性：細網線維による', '#efe9df', '#1f1f22', 6]];
      tiles.forEach(([n, r2, bg, line, d], i) => pop(ctx, S.p('lm', 0.5, d), 840 + i * 420, 470, () => {
        rr(ctx, -180, -230, 360, 340, 22); ctx.fillStyle = bg; ctx.fill();
        for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(120,60,140,0.6)'; ellipse(ctx, -150 + k * 60, -150, 18, 40); ctx.fill(); }
        if (line) { ctx.strokeStyle = line; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-180, -90); ctx.bezierCurveTo(-60, -80, 60, -100, 180, -88); ctx.stroke(); }
        text(ctx, n, 0, 150, { size: 40, align: 'center', weight: 800 });
        text(ctx, r2, 0, 205, { size: 28, align: 'center', weight: 800, color: line || COLORS.sub });
      }));
    });
    // 電子顕微鏡の層
    const eA = S.vis('zoom', 'build');
    if (eA > 0) withAlpha(ctx, eA, () => {
      panel(ctx, 620, 80, 1270, 790, { title: '電子顕微鏡レベルの基底膜', color: '#7a6a9a', color2: '#a08ccc', tsize: 36 });
      const X = 700, Y = 170, WW = 700;
      ctx.save(); rr(ctx, X, Y, WW, 478, 16); ctx.clip();
      emLayers(ctx, X, Y, WW, t, { comp: S.p('blcomp', 0.6, 2) });
      ctx.restore();
      text(ctx, '上皮細胞', X + 20, Y + 70, { size: 26, weight: 800, color: '#5a6280' });
      const lab = (s, y, col, p, sub) => withAlpha(ctx, p, () => { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X + WW, y); ctx.lineTo(X + WW + 40, y); ctx.stroke(); text(ctx, s, X + WW + 50, y, { size: 28, weight: 800, color: col }); if (sub) text(ctx, sub, X + WW + 50, y + 34, { size: 22, color: COLORS.sub, weight: 700 }); });
      lab('透明板 lamina lucida', Y + 188, '#5b6886', S.p('bl', 0.5, 2));
      lab('緻密板 lamina densa', Y + 253, '#5a3f8a', S.p('bl', 0.5, 4), S.on('lf') ? '＝狭義の基底膜' : '');
      lab('線維網状板 lamina fibroreticularis', Y + 380, '#2d2f3a', S.p('lf', 0.5, 3));
      // 基底板の括弧
      if (S.on('bl', 5)) withAlpha(ctx, S.p('bl', 0.5, 5), () => {
        ctx.strokeStyle = COLORS.red; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(X - 10, Y + 160); ctx.lineTo(X - 30, Y + 160); ctx.lineTo(X - 30, Y + 286); ctx.lineTo(X - 10, Y + 286); ctx.stroke();
        chip(ctx, X + 350, Y + 520, '基底板 basal lamina（透明板＋緻密板）厚さ 約100 nm', { size: 26, align: 'center', fill: COLORS.red });
      });
      if (S.on('ans')) withAlpha(ctx, S.p('ans', 0.6), () => {
        ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(X - 10, Y + 158); ctx.lineTo(X - 52, Y + 158); ctx.lineTo(X - 52, Y + 478); ctx.lineTo(X - 10, Y + 478); ctx.stroke();
        chip(ctx, X + 350, Y + 600, '（電顕レベルの）基底膜 ＝ 基底板 ＋ 線維網状板', { size: 28, align: 'center', fill: COLORS.blue });
      });
      if (S.on('blcomp')) withAlpha(ctx, S.p('blcomp', 0.5) * S.vis('blcomp', 'build'), () => {
        rr(ctx, 1450, 470, 420, 180, 18); ctx.fillStyle = '#f7f2ff'; ctx.fill();
        text(ctx, '基底板：主に上皮が産生', 1470, 500, { size: 24, weight: 800, color: '#5a3f8a' });
        [['IV型コラーゲン', '#7b5bd6'], ['GAG/プロテオグリカン（ヘパラン硫酸など）', '#f29a2e'], ['接着蛋白質（ラミニン・フィブロネクチン）', '#2fa45a']]
          .forEach(([s, c], i) => withAlpha(ctx, S.p('blcomp', 0.4, 2 + i * 2.5), () => text(ctx, '・' + s, 1470, 545 + i * 36, { size: 20, weight: 800, color: c })));
      });
      if (S.on('lfcomp')) withAlpha(ctx, S.p('lfcomp', 0.5), () => {
        rr(ctx, 1450, 660, 420, 100, 18); ctx.fillStyle = '#f2f2f6'; ctx.fill();
        text(ctx, '線維網状板：主に結合組織が産生', 1470, 690, { size: 22, weight: 800, color: '#2d2f3a' });
        text(ctx, 'I型＋III型コラーゲンの細網線維', 1470, 728, { size: 22, weight: 800, color: '#2d2f3a' });
      });
    });
    // IV型コラーゲンの組み立て
    const bA = S.vis('build', 'hd');
    if (bA > 0) withAlpha(ctx, bA, () => {
      panel(ctx, 620, 80, 1270, 790, { title: '基底板の構築：IV型コラーゲン', color: '#5b3fb0', color2: '#8a6ae0', tsize: 36 });
      const step = (n, x, s, d, lab) => withAlpha(ctx, S.p(lab, 0.5, d), () => { chip(ctx, x, 210, `${n} ${s}`, { size: 26, align: 'center', fill: '#5b3fb0' }); });
      step('①', 840, 'IV型コラーゲン分子（3重らせん）', 0, 'iv');
      step('②', 1270, '2量体 → 4量体', 3.5, 'iv');
      step('③', 1680, '網目状に配列', 7, 'iv');
      withAlpha(ctx, S.p('iv', 0.5), () => collagenIV(ctx, 720, 400, 220, 0, t));
      withAlpha(ctx, S.p('iv', 0.5, 3.5), () => { collagenIV(ctx, 1150, 330, 200, 0.3, t); collagenIV(ctx, 1380, 470, 200, Math.PI + 0.3, t); collagenIV(ctx, 1150, 470, 160, -0.5, t); collagenIV(ctx, 1390, 330, 160, Math.PI - 0.5, t); });
      withAlpha(ctx, S.p('iv', 0.5, 7), () => {
        ctx.save(); rr(ctx, 1520, 260, 330, 280, 16); ctx.clip();
        for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) { const x = 1520 + i * 64 + (j % 2) * 30, y = 280 + j * 60; collagenIV(ctx, x, y, 54, 0.6 * (j % 2 ? 1 : -1), t + i); }
        ctx.restore();
      });
      withAlpha(ctx, S.p('iv', 0.5, 9), () => chip(ctx, 1270, 600, '線維構造はつくらない', { size: 32, align: 'center', fill: COLORS.red }));
      if (S.on('sheet')) withAlpha(ctx, S.p('sheet', 0.6), () => {
        ctx.save(); rr(ctx, 700, 660, 1110, 150, 20); ctx.fillStyle = '#efe9ff'; ctx.fill(); ctx.restore();
        text(ctx, '④ プロテオグリカン（ヘパラン硫酸など）＋ 接着蛋白質（ラミニン・フィブロネクチンなど）', 1255, 705, { size: 26, align: 'center', weight: 800, maxW: 1060 });
        text(ctx, '→ シート状の構造（基底板）', 1255, 765, { size: 32, align: 'center', weight: 800, color: '#5b3fb0' });
      });
      if (S.on('fence')) tatoe(ctx, S.p('fence', 0.5), 1680, 600, 'フェンスの金網', { size: 30 });
    });
    // 接着
    const hA = S.vis('hd', 'sum');
    if (hA > 0) withAlpha(ctx, hA, () => {
      panel(ctx, 620, 80, 1270, 790, { title: '上皮と基底板、基底板と結合組織の接着', color: '#2fa45a', color2: '#4cc276', tsize: 34 });
      text(ctx, 'ヘミデスモソーム', 920, 180, { size: 32, align: 'center', weight: 800, color: '#2f7d4a' });
      chain(ctx, S, 920, 250, [['細胞質の中間径フィラメント', '#8b5bd6'], ['アンカー', '#5b6886'], ['細胞膜のインテグリン', '#2fa45a'], ['基底板：ラミニン・フィブロネクチン・IV型コラーゲン', '#7a6a9a']], 'hd', '#2f7d4a');
      if (S.on('fa')) {
        text(ctx, '焦点接着', 1590, 180, { size: 32, align: 'center', weight: 800, color: '#c0392b' });
        chain(ctx, S, 1590, 250, [['細胞質のアクチンフィラメント', '#e0475b'], ['アンカー', '#5b6886'], ['細胞膜のインテグリン', '#2fa45a'], ['基底板のフィブロネクチン', '#7a6a9a']], 'fa', '#c0392b');
      }
      if (S.on('blct')) withAlpha(ctx, S.p('blct', 0.5), () => {
        ctx.save(); rr(ctx, 660, 690, 1190, 160, 20); ctx.fillStyle = '#fff3f6'; ctx.fill(); ctx.restore();
        text(ctx, '基底板 − 結合組織', 1255, 730, { size: 28, align: 'center', weight: 800, color: '#d6608a' });
        text(ctx, '基底板のフィブロネクチン → アンカー → 細網線維のIII型コラーゲン', 1255, 790, { size: 30, align: 'center', weight: 800 });
      });
    });
    // まとめ
    const sA = S.vis('sum');
    if (sA > 0) withAlpha(ctx, sA, () => {
      const nodes = [['上皮', '#5a7bd6', 860], ['基底板', '#7a6a9a', 1255], ['結合組織', '#d6608a', 1650]];
      nodes.forEach(([n, c, x], i) => pop(ctx, S.p('sum', 0.5, i * 0.7), x, 400, () => { circle(ctx, 0, 0, 130); ctx.fillStyle = c; ctx.fill(); text(ctx, n, 0, 2, { size: 44, align: 'center', weight: 800, color: '#fff' }); }));
      withAlpha(ctx, S.p('sum', 0.5, 2), () => {
        text(ctx, 'ヘミデスモソーム\n焦点接着', 1057, 590, { size: 26, align: 'center', weight: 800, vcenter: true });
        text(ctx, 'フィブロネクチン\n→ III型コラーゲン', 1452, 590, { size: 26, align: 'center', weight: 800, vcenter: true });
        ctx.strokeStyle = '#2fa45a'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(990, 400); ctx.lineTo(1125, 400); ctx.moveTo(1385, 400); ctx.lineTo(1520, 400); ctx.stroke();
      });
    });

    S.draw(ctx, sapo);
    S.draw(ctx, shun);
  },
};

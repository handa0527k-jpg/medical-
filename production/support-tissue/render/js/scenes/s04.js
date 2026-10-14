// SCENE 4：不思議なゼリーの正体（基質・GAG・プロテオグリカン・ECM）
import { W, H, clamp, lerp, ease, easeOut, text, panel, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, circle, ellipse, sparkle } from '../core.js';
import { ecm, water } from '../bg.js';

// GAG 鎖（二糖の繰り返し）。pts は曲線の関数 f(k) → [x,y]
function gagChain(ctx, f, n, o = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push(f(i / (n - 1)));
  ctx.strokeStyle = o.link || 'rgba(40,120,100,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  pts.forEach(([x, y], i) => {
    circle(ctx, x, y, o.r || 9);
    ctx.fillStyle = i % 2 ? (o.c2 || '#5ec7a8') : (o.c1 || '#a8e6d2');
    ctx.fill();
    if (o.charge && i % 2) { text(ctx, '−', x, y - (o.r || 9) - 12, { size: (o.r || 9) * 2.2, align: 'center', color: '#2156c9', weight: 800 }); }
  });
}

function hexagon(ctx, x, y, r, label, col) {
  ctx.beginPath();
  for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#333'; ctx.stroke();
  text(ctx, label, x, y + 2, { size: r * 0.8, align: 'center', color: col, weight: 800 });
}

// プロテオグリカン：コア蛋白質に GAG 鎖がクシの歯のように結合
function proteoglycan(ctx, x, y, ang, len, nb, grow, t, s = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  for (let i = 0; i < nb; i++) {
    const g = clamp(grow * nb - i);
    if (g <= 0) continue;
    const px = -len / 2 + (i + 0.5) * len / nb;
    for (const side of [-1, 1]) {
      gagChain(ctx, (k) => [px + Math.sin(k * 5 + t + i) * 6, side * (14 + k * 120 * g)], 7, { r: 6, c1: '#bfe9d9', c2: '#69c9a9' });
    }
  }
  ctx.lineWidth = 3;
  for (let i = 0; i < 22; i++) { circle(ctx, -len / 2 + i * len / 21, Math.sin(i * 0.8 + t) * 3, 9); ctx.fillStyle = '#23338f'; ctx.fill(); }
  ctx.restore();
}

function collagenFibril(ctx, x0, y0, x1, y1, w) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#e48a96'; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / 22);
  ctx.strokeStyle = 'rgba(160,50,70,0.35)'; ctx.lineWidth = 4;
  for (let i = 1; i < n; i++) {
    const k = i / n, x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * w / 2, y + Math.sin(a) * w / 2); ctx.lineTo(x - Math.cos(a) * w / 2, y - Math.sin(a) * w / 2); ctx.stroke();
  }
  ctx.restore();
}

export default {
  draw(ctx, S) {
    const t = S.t;
    ecm(ctx, t, { water: S.on('water') ? 110 : 60 });
    // 漂う GAG 鎖（背景）
    const chA = S.p('chain', 2) * (1 - 0.6 * S.vis('disacch', 'pgintro'));
    if (chA > 0) withAlpha(ctx, chA * 0.75, () => {
      for (let c = 0; c < 6; c++) {
        const y0 = 120 + c * 150;
        gagChain(ctx, (k) => [lerp(-80, W + 80, k), y0 + Math.sin(k * 6 + t * 0.6 + c) * 40 + Math.sin(k * 13 + c) * 12], 34, { r: 8, charge: S.on('charge') && c % 2 === 0 });
      }
    });
    const shun = S.actor('shun', [[0, { x: 760, y: 900, s: 0.82, face: 1, d: 0.01 }], ['disacch', { x: 230, y: 980, d: 1.2 }], ['repelq', { x: 300 }], ['pgintro', { x: 230 }], ['gym', { x: 330 }]]);
    shun.tilt = 0.08 * Math.sin(t * 1.3);
    shun.y += Math.sin(t * 1.6) * 12;
    if (!S.on('disacch')) shun.rot = 0.05 * Math.sin(t * 0.9);
    const sapo = S.actor('sapo', [[0, { x: 1150, y: 880, s: 0.9, face: -1, d: 0.01 }], ['disacch', { x: 500, y: 930, face: 1, d: 1.2 }],
      ['necklace', { x: 600, lift: 200 }], ['types', { x: 500, lift: 0 }], ['important', { x: 580, lift: 220 }], ['water', { x: 500, lift: 0 }],
      ['brush', { x: 590, lift: 220 }], ['aggregate', { x: 500, lift: 0 }], ['exam', { x: 560, lift: 180 }]]);

    // 基質のラベル
    pop(ctx, S.p('jelly', 0.6) * S.vis('jelly', 'disacch'), W / 2, 150, () => {
      panel(ctx, -560, -70, 1120, 140, { r: 30 });
      tag(ctx, -540, -44, 'med');
      text(ctx, '基質 ground substance', 0, -16, { size: 52, align: 'center', weight: 800, color: '#1d8aa0' });
      text(ctx, '光学顕微鏡では無構造に見える', 0, 40, { size: 30, align: 'center', color: COLORS.sub });
    });
    if (S.win('chain', 'disacch')) chip(ctx, W / 2, 300, '長いくさり＝グリコサミノグリカン（GAG）', { size: 34, align: 'center', fill: '#2a8a6e' });

    // 二糖の繰り返し
    const dA = S.vis('disacch', 'types');
    if (dA > 0) withAlpha(ctx, dA, () => {
      panel(ctx, 700, 90, 1180, 600, { title: '基質：グリコサミノグリカン glycosaminoglycan（GAG）', color: '#2a8a6e', color2: '#3fb59a', tsize: 32 });
      text(ctx, 'ウロン酸とアミノ糖（ヘキソサミン）からなる二糖の繰り返し', 1290, 200, { size: 32, align: 'center', weight: 800 });
      const k = S.e('disacch', 0.8, 0.5);
      at(ctx, 980, 370, 0.9, () => {
        text(ctx, '{', -180, 0, { size: 220, align: 'center', weight: 400, color: '#333' });
        hexagon(ctx, -60, 0, 70, 'A', '#1a9c3a');
        text(ctx, '−O−', 50, 0, { size: 38, align: 'center', weight: 800 });
        hexagon(ctx, 160, 0, 70, 'B', '#2156c9');
        text(ctx, '}', 280, 0, { size: 220, align: 'center', weight: 400, color: '#333' });
        text(ctx, 'n', 325, 70, { size: 60, weight: 800 });
        withAlpha(ctx, k, () => {
          text(ctx, 'COO⁻', -110, 110, { size: 34, align: 'center', weight: 800 });
          text(ctx, 'SO₃⁻', 170, 110, { size: 34, align: 'center', weight: 800 });
          text(ctx, 'CH₃CO−NH', 170, -110, { size: 30, align: 'center', weight: 800 });
        });
      });
      withAlpha(ctx, S.p('disacch', 0.6, 4), () => {
        text(ctx, 'A：ウロン酸（glucuronic acid など）', 1330, 320, { size: 25, color: '#1a9c3a', weight: 800 });
        text(ctx, 'B：アミノ糖（ヘキソサミン）', 1330, 370, { size: 25, color: '#2156c9', weight: 800 });
        text(ctx, '　 N-acetylglucosamine／N-acetylgalactosamine', 1330, 410, { size: 23, color: '#2156c9', weight: 800 });
        text(ctx, '（図は硫酸基がついたもの）', 1330, 460, { size: 24, color: COLORS.sub });
      });
      if (S.on('necklace')) {
        const p = S.p('necklace', 1.2);
        gagChain(ctx, (kk) => [lerp(760, lerp(760, 1820, p), kk), 610 + Math.sin(kk * 12 + t * 2) * 18], Math.max(2, Math.floor(30 * p)), { r: 13 });
        tatoe(ctx, S.p('necklace', 0.5, 0.4), 1290, 540, 'AとBが何度も繰り返す ネックレス', { size: 28 });
      }
    });

    // GAG の種類と電荷
    const tA = S.vis('types', 'repelq');
    if (tA > 0) withAlpha(ctx, tA, () => {
      panel(ctx, 700, 90, 1180, 640, { title: 'AとBの組み合わせで多数のGAG', color: '#2a8a6e', color2: '#3fb59a', tsize: 34 });
      const names = ['コンドロイチン硫酸', 'ヘパラン硫酸', 'ヘパリン', 'ヒアルロン酸'];
      names.forEach((n, i) => {
        const p = S.p('types', 0.4, 1 + i * 1.6);
        withAlpha(ctx, p, () => {
          text(ctx, n, 780, 220 + i * 110 + (i === 3 ? 40 : 0), { size: 44, weight: 800, color: i === 3 ? '#2a8a6e' : COLORS.ink });
          gagChain(ctx, (k) => [1180 + k * 260, 220 + i * 110 + (i === 3 ? 40 : 0) + Math.sin(k * 8 + t * 2 + i) * 8], 10, { r: 8, charge: S.on('charge') && i < 3 });
        });
      });
      if (S.on('charge')) {
        const p = S.p('charge', 0.6);
        withAlpha(ctx, p, () => {
          ctx.strokeStyle = COLORS.red; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(1490, 190); ctx.quadraticCurveTo(1530, 190, 1530, 300); ctx.quadraticCurveTo(1530, 350, 1560, 355); ctx.quadraticCurveTo(1530, 360, 1530, 410); ctx.quadraticCurveTo(1530, 520, 1490, 520); ctx.stroke();
          text(ctx, 'マイナス（−）', 1580, 330, { size: 40, weight: 800, color: COLORS.red });
          text(ctx, 'に荷電', 1600, 385, { size: 36, weight: 800, color: COLORS.red });
        });
        withAlpha(ctx, S.p('charge', 0.6, 6), () => {
          text(ctx, '── 荷電なし', 1490, 590, { size: 38, weight: 800, color: COLORS.gray });
          tag(ctx, 1500, 650, 'note', { size: 20 });
        });
      }
    });

    // 反発と水の保持
    const rA = S.vis('repelq', 'pgintro');
    if (rA > 0) withAlpha(ctx, rA, () => {
      panel(ctx, 700, 90, 1180, 720, { title: 'GAGはなぜ水を抱えられる？', color: '#2156c9', tsize: 34 });
      const spread = S.e('water', 3) * 70;
      const ys = [280, 450, 620];
      ys.forEach((y, c) => {
        const yy = y + (c - 1) * spread;
        gagChain(ctx, (k) => [780 + k * 1020, yy + Math.sin(k * 7 + t * 1.5 + c) * 18], 26, { r: 11, charge: true });
      });
      if (S.on('important')) {
        const k = S.p('important', 0.5);
        for (let c = 0; c < 2; c++) for (let i = 0; i < 4; i++) {
          const x = 900 + i * 260, y = (ys[c] + ys[c + 1]) / 2 + (c - 0.5) * spread;
          arrow(ctx, x, y, x, y - 50 - spread * 0.3, { p: k, color: COLORS.red, w: 6, head: 18 });
          arrow(ctx, x, y, x, y + 50 + spread * 0.3, { p: k, color: COLORS.red, w: 6, head: 18 });
        }
        withAlpha(ctx, k, () => chip(ctx, 1290, 170, '− と − は反発し合う', { size: 32, align: 'center', fill: COLORS.red }));
      }
      if (S.on('water')) {
        const k = S.p('water', 1.2);
        for (let i = 0; i < 40; i++) {
          const ph = (i * 0.137 + t * 0.06) % 1;
          const x = 780 + ph * 1020, y = (i % 2 ? (ys[0] + ys[1]) / 2 - spread * 0.5 : (ys[1] + ys[2]) / 2 + spread * 0.5) + Math.sin(i * 3 + t) * 30;
          withAlpha(ctx, k, () => water(ctx, x, y, 1.1, t + i));
        }
        withAlpha(ctx, S.p('water', 0.5, 2), () => chip(ctx, 1290, 760, 'すき間に水が入り込む → 組織液を保持', { size: 32, align: 'center', fill: '#1d8aa0' }));
      }
      if (S.on('sponge')) tatoe(ctx, S.p('sponge', 0.5), 1290, 250, 'スポンジのように水を抱え込む', { size: 30 });
    });

    // プロテオグリカン
    const pA = S.vis('pgintro', 'aggregate');
    if (pA > 0) withAlpha(ctx, pA, () => {
      panel(ctx, 700, 90, 1180, 720, { title: 'プロテオグリカン proteoglycan', color: '#23338f', color2: '#4a5fd0', tsize: 34 });
      const g = S.p('pg', 5);
      proteoglycan(ctx, 1290, 470, -0.12, 900, 11, g, t, 1);
      withAlpha(ctx, S.p('pg', 0.5, 1), () => { chip(ctx, 820, 600, 'コア蛋白質 core protein', { size: 28, fill: '#23338f' }); });
      withAlpha(ctx, S.p('pg', 0.5, 3), () => { chip(ctx, 1450, 200, 'GAG鎖（単糖80個以上の長さ）', { size: 28, fill: '#2a8a6e' }); });
      withAlpha(ctx, S.p('pg', 0.5, 6), () => { text(ctx, 'クシの歯のように結合', 1290, 760, { size: 34, align: 'center', weight: 800 }); });
      if (S.on('brush')) tatoe(ctx, S.p('brush', 0.5), 1600, 690, 'ブラシ：芯＝コア蛋白質、毛＝GAG鎖', { size: 28 });
    });

    // プロテオグリカン集合体・ヒアルロン酸・膠原線維
    const aA = S.vis('aggregate', 'exam');
    if (aA > 0) withAlpha(ctx, aA, () => {
      panel(ctx, 700, 90, 1180, 720, { title: '細胞外マトリックス extracellular matrix', color: '#d14d8a', color2: '#ef7aa8', tsize: 34 });
      ctx.save(); rr(ctx, 700, 154, 1180, 656, 0); ctx.clip();
      if (S.on('hacoll')) {
        const k = S.e('hacoll', 1.0);
        withAlpha(ctx, k, () => {
          collagenFibril(ctx, 740, 250 + (1 - k) * 80, 1840, 760 + (1 - k) * 80, 46);
          collagenFibril(ctx, 980, 790 - (1 - k) * 80, 1720, 190 - (1 - k) * 80, 40);
        });
      }
      // ヒアルロン酸
      const hy = 470;
      ctx.strokeStyle = '#3c9a3c'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); for (let x = 740; x <= 1840; x += 10) { const y = hy + Math.sin(x * 0.01 + t * 0.6) * 20; x === 740 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      const n = 7;
      for (let i = 0; i < n; i++) {
        const p = S.p('aggregate', 0.5, 0.8 + i * 0.5);
        if (p <= 0) continue;
        const x = 800 + i * 160, y = hy + Math.sin(x * 0.01 + t * 0.6) * 20;
        withAlpha(ctx, p, () => proteoglycan(ctx, x, y, Math.PI / 2 + 0.1 * Math.sin(t + i), 300, 6, 1, t + i, 0.5));
      }
      ctx.restore();
      withAlpha(ctx, S.p('aggregate', 0.5, 1), () => chip(ctx, 760, 420, 'ヒアルロン酸（荷電なしのGAG）', { size: 26, fill: '#3c9a3c' }));
      withAlpha(ctx, S.p('aggregate', 0.5, 4), () => chip(ctx, 1560, 200, 'プロテオグリカン → 巨大な網状構造', { size: 26, align: 'center', fill: '#23338f' }));
      if (S.on('hacoll')) withAlpha(ctx, S.p('hacoll', 0.5, 1), () => chip(ctx, 1290, 770, 'ヒアルロン酸は膠原線維と結びつく', { size: 28, align: 'center', fill: '#d14d8a' }));
      if (S.on('ecm')) pop(ctx, S.p('ecm', 0.6), 1290, 300, () => {
        rr(ctx, -560, -60, 1120, 120, 30); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); ctx.strokeStyle = '#d14d8a'; ctx.lineWidth = 5; ctx.stroke();
        text(ctx, '多糖類と蛋白質による三次元構造＝細胞外マトリックス', 0, 4, { size: 36, align: 'center', weight: 800, color: '#d14d8a' });
      });
      if (S.on('gym')) tatoe(ctx, S.p('gym', 0.5), 1290, 640, '立体の巨大ジャングルジム', { size: 32 });
    });

    // 試験ポイント
    const xA = S.vis('exam');
    if (xA > 0) withAlpha(ctx, xA, () => pop(ctx, S.p('exam', 0.6), 1290, 440, () => {
      panel(ctx, -590, -300, 1180, 600, { title: '試験ポイント：基質', color: COLORS.red, color2: '#f07a86', tsize: 36 });
      tag(ctx, 570, -268, 'exam', { align: 'right' });
      const L = [['GAG＝ウロン酸＋アミノ糖（ヘキソサミン）の二糖の繰り返し', COLORS.ink], ['コンドロイチン硫酸・ヘパラン硫酸・ヘパリン：マイナスに荷電', COLORS.red],
        ['ヒアルロン酸：荷電なし（講義資料の表記）', COLORS.gray], ['− 同士の反発 → すき間に水 → 組織液を保持', '#1d8aa0'],
        ['プロテオグリカン＝コア蛋白質＋GAG鎖（クシの歯）', '#23338f'], ['→ ヒアルロン酸に結合（網状）→ 膠原線維と結合', '#d14d8a']];
      L.forEach(([s, c], i) => withAlpha(ctx, S.p('exam', 0.4, 0.5 + i * 0.6), () => text(ctx, s, -550, -190 + i * 78, { size: 32, weight: 800, color: c })));
    }));

    S.draw(ctx, sapo);
    S.draw(ctx, shun);
    if (S.win('float', 'jelly')) for (let i = 0; i < 6; i++) sparkle(ctx, shun.x - 200 + i * 80, shun.y - 600 + Math.sin(t * 2 + i) * 40, 10, t + i, '#ffffff');
  },
};

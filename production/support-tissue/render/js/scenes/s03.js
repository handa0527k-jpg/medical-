// SCENE 3：人体を支える4つの仕事（支持作用・物質交換・生体防御・貯蔵）
import { W, H, clamp, lerp, ease, easeOut, text, panel, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, circle, ellipse, table, rnd } from '../core.js';
import { soft } from '../bg.js';
import { drawCell } from '../chars.js';
import { looseCT, denseIrregular, capillary } from '../tissue.js';

const JOBS = [['支持作用', '線維やGAG', '#2f7de1'], ['物質交換', '組織液', '#14a39a'], ['生体防御', '細胞成分', '#e0475b'], ['貯蔵', '脂肪細胞・骨や歯の基質', '#f29a2e']];

function icon(ctx, i, t) {
  ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff';
  if (i === 0) { for (const x of [-40, 0, 40]) { ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, -30); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(60, -40); ctx.stroke(); }
  if (i === 1) { arrow(ctx, -50, -20, 50, -20, { color: '#fff', w: 9 }); arrow(ctx, 50, 25, -50, 25, { color: '#fff', w: 9 }); }
  if (i === 2) { ctx.beginPath(); ctx.moveTo(0, -55); ctx.lineTo(48, -35); ctx.quadraticCurveTo(45, 30, 0, 55); ctx.quadraticCurveTo(-45, 30, -48, -35); ctx.closePath(); ctx.stroke(); }
  if (i === 3) { rr(ctx, -50, -30, 100, 75, 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-58, -30); ctx.lineTo(0, -60); ctx.lineTo(58, -30); ctx.stroke(); }
}

function tooth(ctx) {
  ctx.beginPath();
  ctx.moveTo(-50, -50); ctx.quadraticCurveTo(-25, -70, 0, -55); ctx.quadraticCurveTo(25, -70, 50, -50);
  ctx.quadraticCurveTo(62, 0, 40, 30); ctx.lineTo(28, 80); ctx.quadraticCurveTo(18, 90, 10, 70); ctx.lineTo(0, 30); ctx.lineTo(-10, 70); ctx.quadraticCurveTo(-18, 90, -28, 80); ctx.lineTo(-40, 30); ctx.quadraticCurveTo(-62, 0, -50, -50);
  ctx.fillStyle = '#fffdf6'; ctx.fill(); ctx.strokeStyle = '#c2b691'; ctx.lineWidth = 4; ctx.stroke();
}

export default {
  draw(ctx, S) {
    const t = S.t;
    const sec = S.on('sum') ? -1 : S.on('sto') ? 3 : S.on('def') ? 2 : S.on('ex') ? 1 : S.on('sup') ? 0 : -1;
    const bgc = ['#e6f0ff', '#e3fbf6', '#ffe8eb', '#fff3e0'];
    soft(ctx, t, sec >= 0 ? bgc[sec] : '#eef6ff', '#ffffff');
    const shun = S.actor('shun', [[0, { x: 230, y: 1010, s: 0.8, face: 1, d: 0.01 }], ['ex', { x: 300, d: 0.8 }], ['def', { x: 200, d: 0.8 }], ['vault', { x: 300, d: 0.8 }], ['sum', { x: 230, d: 0.8 }]]);
    const sapo = S.actor('sapo', [[0, { x: 480, y: 930, s: 0.85, face: 1, d: 0.01 }], ['four', { lift: 160, d: 0.9 }], ['sup', { lift: 0, d: 0.9 }],
      ['arrows', { x: 560, lift: 230, d: 0.9 }], ['def', { x: 480, lift: 0, d: 0.9 }], ['innate', { x: 560, lift: 200, d: 0.9 }], ['acquired', { x: 480, lift: 40 }],
      ['fatca', { x: 560, lift: 200 }], ['sum', { x: 480, lift: 0 }]]);

    // 4枚のカード
    const fA = S.vis('four', 'sup');
    if (fA > 0) withAlpha(ctx, fA, () => {
      JOBS.forEach(([n, by, col], i) => {
        const p = S.p('four', 0.5, 0.8 + i * 1.2);
        const cx = 960 + (i % 2) * 560, cy = 290 + Math.floor(i / 2) * 330;
        pop(ctx, p, cx, cy, () => {
          ctx.save(); rr(ctx, -250, -140, 500, 280, 30); ctx.fillStyle = col; ctx.fill(); ctx.restore();
          at(ctx, -150, -10, 1, () => icon(ctx, i, t));
          text(ctx, `${i + 1}`, -215, -95, { size: 44, color: 'rgba(255,255,255,0.75)', weight: 800 });
          text(ctx, n, 60, -10, { size: 56, align: 'center', color: '#fff', weight: 800 });
          text(ctx, ['支える', '交換する', '守る', 'ためる'][i], 60, 60, { size: 32, align: 'center', color: 'rgba(255,255,255,0.9)', weight: 800 });
        });
      });
    });

    // ① 支持作用
    const sA = S.vis('sup', 'ex');
    if (sA > 0) withAlpha(ctx, sA, () => {
      panel(ctx, 640, 80, 1240, 780, { title: '① 支持作用 … 線維やGAGによる', color: JOBS[0][2], tsize: 36 });
      const row = (k, lab, y, draw, res, ex) => {
        const p = S.p(lab, 0.6);
        if (p <= 0) return;
        withAlpha(ctx, p, () => {
          ctx.save(); rr(ctx, 680, y - 95, 1160, 200, 20); ctx.fillStyle = k % 2 ? '#f4f8ff' : '#ffffff'; ctx.fill(); ctx.strokeStyle = '#d5ddec'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
          draw(y);
          text(ctx, ex, 1130, y - 30, { size: 30, weight: 800, maxW: 520 });
          chip(ctx, 1130, y + 50, res, { size: 30, fill: JOBS[0][2] });
        });
      };
      row(0, 'locomotor', 255, (y) => {
        at(ctx, 760, y, 0.32, () => drawCell(ctx, 'bone', { t, mouth: 0 }));
        at(ctx, 860, y, 0.36, () => drawCell(ctx, 'cartilage', { t, mouth: 0 }));
        ctx.strokeStyle = '#e46a74'; ctx.lineWidth = 16; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(940, y - 60); ctx.bezierCurveTo(960, y - 20, 930, y + 20, 950, y + 60); ctx.stroke();
        ctx.fillStyle = '#d4505c'; rr(ctx, 985, y - 70, 90, 140, 40); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
        for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(995, y - 50 + k * 20); ctx.lineTo(1065, y - 50 + k * 20); ctx.stroke(); }
        text(ctx, '筋', 1030, y + 92, { size: 22, align: 'center', color: COLORS.sub });
      }, '筋とともに運動器を形成', '骨・軟骨・靭帯・腱');
      row(1, 'surface', 480, (y) => {
        ctx.fillStyle = '#f2c6a8'; ctx.fillRect(740, y - 75, 330, 40);
        denseIrregular(ctx, 740, y - 35, 330, 110, t, { r: 6 });
        text(ctx, '表皮', 760, y - 55, { size: 22, color: '#8a5a3b' });
        chip(ctx, 905, y + 22, '真皮', { size: 22, align: 'center', fill: '#c74a5a', shadow: false });
      }, '表面の補強', '皮膚の真皮・筋膜・臓器の被膜');
      row(0, 'gap', 705, (y) => {
        looseCT(ctx, 740, y - 85, 330, 170, t, { r: 10, seed: 8 });
        capillary(ctx, 820, y, 32, t);
        circle(ctx, 960, y - 10, 34); ctx.fillStyle = '#fff6c8'; ctx.fill(); ctx.strokeStyle = '#d8b44a'; ctx.lineWidth = 6; ctx.stroke();
        text(ctx, '神経', 960, y + 50, { size: 22, align: 'center', color: COLORS.sub });
      }, '隙間を埋める', '皮下・粘膜下・臓器や神経・血管の周囲');
    });

    // ② 物質交換
    const eA = S.vis('ex', 'def');
    if (eA > 0) withAlpha(ctx, eA, () => {
      panel(ctx, 640, 80, 1240, 780, { title: '② 物質交換 … 組織液による', color: JOBS[1][2], color2: '#3cc7b8', tsize: 36 });
      // 毛細血管
      const y0 = 270;
      ctx.save(); rr(ctx, 680, y0 - 55, 1160, 110, 55); ctx.fillStyle = '#f7c6cf'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#d97a8c'; ctx.stroke(); ctx.restore();
      for (let i = 0; i < 8; i++) { const x = 700 + ((i * 160 + t * 120) % 1140); at(ctx, x, y0, 0.8, () => drawCell(ctx, 'rbc', { t, noBob: true })); }
      text(ctx, '毛細血管', 700, y0 - 85, { size: 28, weight: 800, color: '#c0475e' });
      // 組織液と細胞
      ctx.fillStyle = 'rgba(160,225,240,0.45)'; ctx.fillRect(680, y0 + 60, 1160, 520);
      text(ctx, '組織液（細胞間質）', 700, y0 + 95, { size: 28, weight: 800, color: '#1d8aa0' });
      for (const [x, y] of [[860, 640], [1260, 690], [1640, 620]]) at(ctx, x, y, 0.5, () => drawCell(ctx, 'fibro', { t, plain: true, mouth: 0 }));
      const k = S.p('arrows', 0.6);
      if (k > 0) {
        const particles = (x0, x1, down, col, lab, seed) => {
          for (let i = 0; i < 6; i++) {
            const ph = ((t * 0.35 + i / 6 + seed) % 1);
            const y = down ? lerp(y0 + 50, 600, ph) : lerp(600, y0 + 50, ph);
            const x = lerp(x0, x1, (i % 3) / 2) + Math.sin(ph * 6 + i) * 14;
            withAlpha(ctx, k * Math.sin(ph * Math.PI), () => { circle(ctx, x, y, 11); ctx.fillStyle = col; ctx.fill(); });
          }
          arrow(ctx, x0 + 60, down ? y0 + 70 : 590, x0 + 60, down ? 590 : y0 + 70, { p: k, color: col, w: 8 });
          withAlpha(ctx, k, () => chip(ctx, x0 + 100, down ? 420 : 360, lab, { size: 28, fill: col }));
        };
        particles(760, 900, true, '#e0475b', '酸素 O₂', 0);
        particles(1000, 1140, true, '#f29a2e', '栄養', 0.3);
        particles(1300, 1440, false, '#5b6886', '二酸化炭素 CO₂', 0.1);
        particles(1560, 1700, false, '#8a6a3a', '老廃物', 0.5);
      }
    });

    // ③ 生体防御
    const dA = S.vis('def', 'sto');
    if (dA > 0) withAlpha(ctx, dA, () => {
      panel(ctx, 640, 80, 1240, 780, { title: '③ 生体防御 … 細胞成分による', color: JOBS[2][2], color2: '#f07a86', tsize: 36 });
      withAlpha(ctx, S.p('innate', 0.5), () => {
        ctx.save(); rr(ctx, 680, 170, 560, 650, 24); ctx.fillStyle = '#fff4f5'; ctx.fill(); ctx.restore();
        text(ctx, '自然免疫', 960, 215, { size: 40, align: 'center', weight: 800, color: COLORS.red });
        const eat = S.p('eat', 1.4);
        const bx = lerp(1150, 900, ease(eat)), by = lerp(330, 470, ease(eat));
        if (eat < 0.95) at(ctx, bx, by, 0.7 * (1 - eat * 0.6), () => drawCell(ctx, 'bacteria', { t }));
        at(ctx, 860, 480, 0.85 + 0.06 * Math.sin(eat * Math.PI), () => drawCell(ctx, 'macro', { t, mouth: S.mouth('macro'), emo: 'happy' }));
        text(ctx, '大食細胞（マクロファージ）', 880, 650, { size: 30, align: 'center', weight: 800 });
        at(ctx, 1140, 560, 0.75, () => drawCell(ctx, 'neutro', { t }));
        text(ctx, '好中球', 1140, 650, { size: 30, align: 'center', weight: 800 });
        if (S.on('eat')) withAlpha(ctx, S.p('eat', 0.5, 0.6), () => chip(ctx, 960, 740, '異物を貪食して処理', { size: 30, align: 'center', fill: COLORS.red }));
      });
      withAlpha(ctx, S.p('acquired', 0.5), () => {
        ctx.save(); rr(ctx, 1280, 170, 560, 650, 24); ctx.fillStyle = '#f6f2ff'; ctx.fill(); ctx.restore();
        text(ctx, '獲得免疫', 1560, 215, { size: 40, align: 'center', weight: 800, color: COLORS.purple });
        at(ctx, 1420, 400, 0.6, () => drawCell(ctx, 'plasma', { t, plain: true }));
        text(ctx, '形質細胞', 1420, 500, { size: 30, align: 'center', weight: 800 });
        at(ctx, 1700, 400, 0.75, () => drawCell(ctx, 'tcell', { t }));
        text(ctx, 'リンパ球', 1700, 500, { size: 30, align: 'center', weight: 800 });
        at(ctx, 1560, 640, 0.55, () => drawCell(ctx, 'mast', { t, plain: true }));
        text(ctx, '肥満細胞 など', 1560, 750, { size: 30, align: 'center', weight: 800 });
      });
    });

    // ④ 貯蔵
    const oA = S.vis('sto', 'sum');
    if (oA > 0) withAlpha(ctx, oA, () => {
      panel(ctx, 640, 80, 1240, 780, { title: '④ 貯蔵', color: JOBS[3][2], color2: '#f5c542', tsize: 36 });
      const p1 = S.p('fatca', 0.6), p2 = S.p('fatca', 0.6, 2.8);
      pop(ctx, p1, 960, 430, () => {
        drawCell(ctx, 'white', { t, mouth: 0, plain: true });
        text(ctx, '脂肪', 0, 200, { size: 44, align: 'center', weight: 800, color: '#c18a12' });
        text(ctx, '脂肪細胞の細胞質に', 0, 260, { size: 32, align: 'center' });
      });
      pop(ctx, p2, 1560, 430, () => {
        at(ctx, -80, 0, 0.6, () => drawCell(ctx, 'bone', { t, mouth: 0 }));
        at(ctx, 90, 10, 1, () => tooth(ctx));
        for (let i = 0; i < 6; i++) { const a = t + i; chip(ctx, Math.cos(a) * 170, -120 + Math.sin(a * 1.3) * 40 + (i % 2) * 40, 'Ca²⁺', { size: 22, align: 'center', fill: '#8a94a8', shadow: false }); }
        text(ctx, 'カルシウム', 0, 200, { size: 44, align: 'center', weight: 800, color: '#5b6886' });
        text(ctx, '骨や歯の基質に', 0, 260, { size: 32, align: 'center' });
      });
      if (S.on('vault')) { tatoe(ctx, S.p('vault', 0.5), 960, 760, 'エネルギー倉庫', { size: 30 }); tatoe(ctx, S.p('vault', 0.5, 0.8), 1560, 760, 'カルシウムの金庫', { size: 30 }); }
    });

    // まとめ
    const mA = S.vis('sum');
    if (mA > 0) withAlpha(ctx, mA, () => {
      panel(ctx, 640, 120, 1240, 640, { title: 'まとめ：支持組織の4つの機能', color: COLORS.blue, tsize: 36 });
      tag(ctx, 1860, 152, 'exam', { align: 'right' });
      const rows = [['機能', '担い手']].concat(JOBS.map(([n, by, c]) => [{ t: n, c, size: 34 }, { t: by, size: 32 }]));
      table(ctx, 700, 220, [420, 700], 104, rows, { p: (r, c) => (c === 0 ? S.p('sum', 0.4, r * 1.2) : S.p('sum2', 0.4, (r - 1) * 1.4)) });
    });

    S.draw(ctx, sapo);
    S.draw(ctx, shun);
  },
};

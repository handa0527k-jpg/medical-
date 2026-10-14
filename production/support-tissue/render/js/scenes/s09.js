// SCENE 9：脂肪細胞のエネルギー倉庫（白色・褐色脂肪組織、脂肪の蓄積と動員、発達）
import { W, H, clamp, lerp, ease, easeOut, text, panel, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, circle, ellipse, sparkle } from '../core.js';
import { warehouse } from '../bg.js';
import { drawCell } from '../chars.js';
import { adiposeTissue } from '../tissue.js';

function items(ctx, S, x, y, list, o = {}) {
  list.forEach(([lab, d, s, col], i) => withAlpha(ctx, S.p(lab, 0.45, d), () => {
    circle(ctx, x + 10, y + i * (o.gap || 62), 8); ctx.fillStyle = col || COLORS.orange; ctx.fill();
    text(ctx, s, x + 32, y + i * (o.gap || 62), { size: o.size || 29, weight: 800, color: col || COLORS.ink, maxW: o.maxW || 720 });
  }));
}

function flame(ctx, x, y, s, t) {
  for (let i = 0; i < 3; i++) {
    const fx = x + (i - 1) * 16 * s, h = (40 + 12 * Math.sin(t * 9 + i * 2)) * s;
    ctx.beginPath(); ctx.moveTo(fx - 12 * s, y); ctx.quadraticCurveTo(fx - 14 * s, y - h * 0.6, fx, y - h); ctx.quadraticCurveTo(fx + 14 * s, y - h * 0.6, fx + 12 * s, y); ctx.closePath();
    ctx.fillStyle = i === 1 ? '#ffb53b' : '#ff6a2b'; ctx.fill();
  }
}

export default {
  draw(ctx, S) {
    const t = S.t;
    warehouse(ctx, t, { cam: t * 4 });
    const shun = S.actor('shun', [[0, { x: -200, y: 1010, s: 0.78, face: 1, d: 0.01 }], ['arrive', { x: 220, d: 1.4 }], ['hole', { x: 300 }], ['metab', { x: 210 }], ['signal', { x: 300 }], ['brown', { x: 210 }], ['tank', { x: 300 }]]);
    const sapo = S.actor('sapo', [[0, { x: -300, y: 930, s: 0.82, face: 1, d: 0.01 }], ['arrive', { x: 460, d: 1.6, fly: true }], ['metab', { x: 530, lift: 220 }], ['store', { x: 460, lift: 0 }],
      ['role', { x: 540, lift: 200 }], ['brownloc', { x: 460, lift: 0 }], ['dev', { x: 540, lift: 200 }], ['dev2', { x: 460, lift: 0 }]]);

    // 脂肪組織の割合
    const pA = S.vis('intro', 'white');
    if (pA > 0) withAlpha(ctx, pA, () => {
      panel(ctx, 620, 90, 1270, 720, { title: '脂肪組織 adipose tissue（疎性結合組織の一種）', color: '#d9a21c', color2: '#f5c542', tsize: 34 });
      adiposeTissue(ctx, 660, 180, 520, 380, t, {});
      const bar = (y, lab, a, b, col, d) => withAlpha(ctx, S.p('pct', 0.5, d), () => {
        text(ctx, lab, 1230, y, { size: 32, weight: 800 });
        ctx.fillStyle = '#eef1f6'; rr(ctx, 1340, y - 22, 480, 44, 22); ctx.fill();
        const k = S.e('pct', 1.2, d);
        ctx.fillStyle = col; rr(ctx, 1340 + a / 30 * 480, y - 22, (b - a) / 30 * 480 * k, 44, 22); ctx.fill();
        text(ctx, `${a}〜${b}％`, 1580, y + 46, { size: 28, align: 'center', weight: 800, color: col });
      });
      text(ctx, '体重に占める割合', 1230, 220, { size: 28, weight: 800, color: COLORS.sub });
      bar(300, '男性', 10, 20, '#2f7de1', 0.5);
      bar(430, '女性', 15, 25, '#e0475b', 3);
      withAlpha(ctx, S.p('pct', 0.5, 7), () => {
        chip(ctx, 700, 640, '白色脂肪組織 white a.t.（WAT）', { size: 28, fill: '#d9a21c' });
        chip(ctx, 1260, 640, '褐色脂肪組織 brown a.t.（BAT）', { size: 28, fill: COLORS.brown });
      });
    });

    // 白色脂肪細胞
    const wA = S.vis('white', 'metab');
    if (wA > 0) withAlpha(ctx, wA, () => {
      panel(ctx, 620, 90, 1270, 760, { title: '白色脂肪細胞 white adipocyte', color: '#d9a21c', color2: '#f5c542', tsize: 34 });
      at(ctx, 830, 330, 0.9, () => drawCell(ctx, 'white', { t, mouth: S.mouth('white'), emo: 'happy' }));
      items(ctx, S, 1060, 190, [['white2', 0, '直径 50〜100 μm'], ['white2', 2.5, '単胞性脂肪滴 unilocular lipid droplet'], ['white2', 5.5, '色素：カロテン'],
        ['white3', 0, '一種の細網細胞'], ['white3', 2, '基底膜あり・周囲の細胞間質に細網線維']], { maxW: 800 });
      if (S.on('white4')) {
        withAlpha(ctx, S.p('white4', 0.5), () => {
          adiposeTissue(ctx, 680, 520, 520, 220, t, { seed: 3 });
          text(ctx, '通常の標本：脂肪滴が有機溶媒に溶出', 940, 780, { size: 26, align: 'center', weight: 800 });
        });
        withAlpha(ctx, S.p('white4', 0.5, 6), () => {
          adiposeTissue(ctx, 1290, 520, 540, 220, t, { seed: 3, frozen: true });
          text(ctx, '凍結切片の脂肪染色（オイルレッド・ズダンブラック）', 1560, 780, { size: 24, align: 'center', weight: 800, color: '#c0392b' });
        });
        if (S.on('hole')) { ring(ctx, 940, 630, 280, 130, S.p('hole', 0.8), COLORS.blue, 7); chip(ctx, 940, 470, '白く抜けて見える', { size: 28, align: 'center', fill: COLORS.blue }); }
      }
    });

    // 蓄積と動員
    const mA = S.vis('metab', 'brown');
    if (mA > 0) withAlpha(ctx, mA, () => {
      panel(ctx, 620, 90, 1270, 760, { title: '脂肪細胞における脂肪の代謝', color: '#d9a21c', color2: '#f5c542', tsize: 34 });
      // 毛細血管
      ctx.save(); rr(ctx, 680, 170, 150, 640, 70); ctx.fillStyle = '#f7c6cf'; ctx.fill(); ctx.strokeStyle = '#d97a8c'; ctx.lineWidth = 8; ctx.stroke(); ctx.restore();
      for (let i = 0; i < 6; i++) at(ctx, 755, 180 + ((i * 110 + t * 60) % 620), 0.7, () => drawCell(ctx, 'rbc', { t, noBob: true }), Math.PI / 2);
      text(ctx, '毛細血管', 755, 840, { size: 24, align: 'center', weight: 800, color: '#c0475e' });
      // 脂肪細胞
      circle(ctx, 1560, 470, 270); ctx.fillStyle = '#ffeaa0'; ctx.fill(); ctx.strokeStyle = '#d4ad3c'; ctx.lineWidth = 6; ctx.stroke();
      const drop = 210 + 20 * Math.sin(t) + (S.on('mob') ? -30 * S.e('mob', 3) : 0);
      circle(ctx, 1580, 480, drop); ctx.fillStyle = '#fff6d2'; ctx.fill();
      text(ctx, '脂肪（トリグリセリド）', 1580, 480, { size: 28, align: 'center', weight: 800, color: '#a07b10' });
      const storeOn = S.vis('store', 'mob', 0.6), mobOn = S.on('mob') ? S.p('mob', 0.6) : 0;
      if (storeOn > 0) withAlpha(ctx, storeOn, () => {
        pop(ctx, S.p('store', 0.5), 1560, 190, () => chip(ctx, 0, 0, '蓄積：インスリンで促進 ＋', { size: 30, align: 'center', fill: '#2f7de1' }));
        const rows = [['1) 腸・肝臓からのリポ蛋白質 → リポ蛋白リパーゼ（内皮）→ 脂肪酸 → 拡散', 'store2', 0, 300], ['2) 血中の遊離脂肪酸 → 拡散で取り込み', 'store2', 9, 470], ['3) 血中グルコース → 輸送体 → 細胞内で脂肪酸に変換', 'store3', 0, 640]];
        rows.forEach(([s, lab, d, y]) => {
          const p = S.p(lab, 0.8, d);
          arrow(ctx, 840, y, 1290, y, { p, color: '#2f7de1', w: 8 });
          withAlpha(ctx, p, () => text(ctx, s, 860, y - 62, { size: 21, weight: 800, maxW: 430, lh: 1.25 }));
        });
      });
      if (mobOn > 0) withAlpha(ctx, mobOn, () => {
        pop(ctx, S.p('mob', 0.5), 1560, 190, () => chip(ctx, 0, 0, '動員：グルカゴン・アドレナリン ＋ ／ インスリン −', { size: 28, align: 'center', fill: '#e0475b' }));
        const p = S.p('mob2', 0.8);
        arrow(ctx, 1290, 420, 840, 420, { p, color: '#e0475b', w: 10 });
        withAlpha(ctx, p, () => { text(ctx, '細胞内のリパーゼで分解', 860, 380, { size: 24, weight: 800 }); text(ctx, '2) 多く：遊離脂肪酸として血中へ（栄養源）', 860, 470, { size: 24, weight: 800, color: '#e0475b' }); });
        withAlpha(ctx, S.p('mob2', 0.6, 2), () => {
          chip(ctx, 1560, 700, '1) 一部：β酸化 → ATP と 熱', { size: 26, align: 'center', fill: '#f29a2e' });
          flame(ctx, 1760, 690, 0.7, t);
        });
      });
      if (S.on('signal')) { tatoe(ctx, S.p('signal', 0.5), 1060, 760, 'インスリン＝ためろ', { size: 28 }); tatoe(ctx, S.p('signal', 0.5, 1), 1560, 790, 'グルカゴン・アドレナリン＝出せ', { size: 28 }); }
    });

    // 褐色脂肪細胞
    const bA = S.vis('brown', 'dev');
    if (bA > 0) withAlpha(ctx, bA, () => {
      panel(ctx, 620, 90, 1270, 760, { title: '褐色脂肪細胞 brown adipocyte', color: COLORS.brown, color2: '#d07a3f', tsize: 34 });
      at(ctx, 820, 320, 1.0, () => drawCell(ctx, 'brown', { t, mouth: S.mouth('brown'), emo: 'happy', fire: S.on('ucp') || S.speaking('brown') }));
      const early = S.vis('brown2', 'brown3');
      if (early > 0) withAlpha(ctx, early, () => items(ctx, S, 1060, 210, [['brown2', 0, '直径 20〜30 μm 程度で小さい'], ['brown2', 3, '多胞性脂肪滴 multilocular lipid droplet'], ['brown2', 6.5, 'ミトコンドリアが多い'], ['brown2', 9.5, '色素：リポクロム']], { size: 28 }));
      const fl = S.vis('brown3', 'role');
      if (fl > 0) withAlpha(ctx, fl, () => {
        const steps = [['交感神経の刺激', 0, 'brown3'], ['貯蔵脂肪の代謝が急速に増加', 1.5, 'brown3'], ['遊離脂肪酸は分泌されない', 6.5, 'brown3'], ['ミトコンドリアで β酸化', 9.5, 'brown3'], ['脱共役蛋白質 UCP-1 の作用', 0, 'ucp'], ['ATP産生より 熱の産生', 4, 'ucp']];
        steps.forEach(([s, d, lab], i) => {
          const p = S.p(lab, 0.5, d);
          const y = 190 + i * 100;
          if (p <= 0) return;
          pop(ctx, p, 1420, y, () => { rr(ctx, -330, -38, 660, 76, 20); ctx.fillStyle = i === 4 ? COLORS.red : i === 5 ? '#ff6a2b' : COLORS.brown; ctx.fill(); text(ctx, s, 0, 2, { size: 30, align: 'center', weight: 800, color: '#fff' }); });
          if (i) arrow(ctx, 1420, y - 62, 1420, y - 40, { p, color: COLORS.brown, w: 6, head: 14 });
        });
        if (S.on('ucp', 4)) for (let i = 0; i < 5; i++) flame(ctx, 1150 + i * 140, 830, 1, t + i);
      });
      if (S.on('role')) withAlpha(ctx, S.vis('role'), () => {
        pop(ctx, S.p('role', 0.5), 1180, 260, () => { rr(ctx, -200, -60, 400, 120, 24); ctx.fillStyle = '#fff1e6'; ctx.fill(); ctx.strokeStyle = COLORS.brown; ctx.lineWidth = 4; ctx.stroke(); text(ctx, '新生児の体温維持', 0, 2, { size: 32, align: 'center', weight: 800 }); });
        pop(ctx, S.p('role', 0.5, 2), 1640, 260, () => { rr(ctx, -230, -60, 460, 120, 24); ctx.fillStyle = '#fff1e6'; ctx.fill(); ctx.strokeStyle = COLORS.brown; ctx.lineWidth = 4; ctx.stroke(); text(ctx, '冬眠動物の覚醒時の体温上昇', 0, 2, { size: 30, align: 'center', weight: 800 }); });
      });
      if (S.on('brownloc')) {
        const tl = [['胎児の初期に分化', 0], ['胎児期〜新生児期に多い', 3], ['成人ではごく少ない（心臓と大血管の周囲など）', 6]];
        ctx.strokeStyle = COLORS.brown; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(700, 560); ctx.lineTo(1840, 560); ctx.stroke();
        tl.forEach(([s, d], i) => withAlpha(ctx, S.p('brownloc', 0.5, d), () => { circle(ctx, 760 + i * 380, 560, 18); ctx.fillStyle = COLORS.brown; ctx.fill(); text(ctx, s, 740 + i * 380, 620, { size: 26, weight: 800, maxW: 340 }); }));
        withAlpha(ctx, S.p('brownloc', 0.5, 9), () => text(ctx, '冬眠動物では背中から首までに多い', 760, 760, { size: 24, color: COLORS.sub, weight: 800 }));
      }
    });

    // 発達と肥満
    const dA = S.vis('dev');
    if (dA > 0) withAlpha(ctx, dA, () => {
      panel(ctx, 620, 90, 1270, 760, { title: '脂肪組織の発達と肥満 obesity', color: '#d9a21c', color2: '#f5c542', tsize: 34 });
      const cells = [['未分化間葉細胞', 0], ['脂肪前駆細胞', 0.1], ['未熟脂肪細胞', 0.45], ['成熟脂肪細胞', 1]];
      cells.forEach(([n, fat], i) => withAlpha(ctx, S.p('dev2', 0.5, i * 3.5), () => {
        const x = 740 + i * 330, y = 330;
        circle(ctx, x, y, 60 + fat * 50); ctx.fillStyle = i ? '#ffeaa0' : '#d8cdf0'; ctx.fill(); ctx.strokeStyle = '#b89a3a'; ctx.lineWidth = 4; ctx.stroke();
        if (fat > 0.3) { circle(ctx, x, y, (60 + fat * 50) * 0.8 * fat); ctx.fillStyle = '#fff6d2'; ctx.fill(); }
        if (i === 2) for (let k = 0; k < 6; k++) { circle(ctx, x + Math.cos(k) * 30, y + Math.sin(k * 2) * 30, 10); ctx.fillStyle = '#fff6d2'; ctx.fill(); }
        text(ctx, n, x, y + 140, { size: 26, align: 'center', weight: 800 });
        if (i) arrow(ctx, x - 270, y, x - 130, y, { color: '#b89a3a', w: 6 });
      }));
      const lab = [['① 胎児期', 905], ['② 乳児期（生後1〜2年）と思春期：増殖', 1235], ['③ 脂肪が蓄積', 1565]];
      lab.forEach(([s, x], i) => withAlpha(ctx, S.p('dev2', 0.5, 1 + i * 3.5), () => text(ctx, s, x, 220, { size: 22, align: 'center', weight: 800, color: '#a07b10', maxW: 320 })));
      if (S.on('dev3')) {
        withAlpha(ctx, S.p('dev3', 0.5), () => {
          ctx.save(); rr(ctx, 680, 540, 560, 280, 20); ctx.fillStyle = '#eef6ff'; ctx.fill(); ctx.restore();
          text(ctx, '③は可逆的', 960, 580, { size: 32, align: 'center', weight: 800, color: '#2f7de1' });
          const s2 = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.5));
          circle(ctx, 960, 690, 80); ctx.fillStyle = '#ffeaa0'; ctx.fill(); circle(ctx, 960, 690, 66 * s2); ctx.fillStyle = '#fff6d2'; ctx.fill();
          text(ctx, '脂肪量は減る', 960, 800, { size: 24, align: 'center', weight: 800 });
        });
        withAlpha(ctx, S.p('dev3', 0.5, 6), () => {
          ctx.save(); rr(ctx, 1280, 540, 560, 280, 20); ctx.fillStyle = '#fff1f1'; ctx.fill(); ctx.restore();
          text(ctx, '②は不可逆的', 1560, 580, { size: 32, align: 'center', weight: 800, color: COLORS.red });
          for (let i = 0; i < 6; i++) { const x = 1360 + i * 80; circle(ctx, x, 690, 32); ctx.fillStyle = '#ffeaa0'; ctx.fill(); ctx.strokeStyle = '#d4ad3c'; ctx.lineWidth = 3; ctx.stroke(); }
          text(ctx, '細胞の数は減らない（寿命が長い）', 1560, 790, { size: 24, align: 'center', weight: 800 });
        });
      }
      if (S.on('tank')) tatoe(ctx, S.p('tank', 0.5), 1260, 480, '中身は減らせても、タンクの数は減らない', { size: 30 });
    });

    S.draw(ctx, sapo);
    S.draw(ctx, shun);
  },
};

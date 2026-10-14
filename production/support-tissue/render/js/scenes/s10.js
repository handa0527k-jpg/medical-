// SCENE 10：最終試験！ 支持組織の秘密を解き明かせ（8問のクイズ → エンディング）
import { W, H, clamp, lerp, ease, easeOut, back, text, panel, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, circle, sparkle, confetti, measure } from '../core.js';
import { quiz, city } from '../bg.js';
import { drawCell } from '../chars.js';

const QS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];
const ABCD = ['A', 'B', 'C', 'D'];

function board(ctx, S, qi, a) {
  const id = QS[qi], Q = S.quiz[id], n = qi + 1, t = S.t;
  const ans = S.on(`a${n}`) ? Q.answer : -1;
  const wrongPick = n === 4 && S.win('a4w', 'a4') ? 2 : -1;
  const correct = S.on(`c${n}`);
  withAlpha(ctx, a, () => {
    panel(ctx, 470, 70, 1150, 590, { title: `第${n}問　${Q.topic}`, color: '#2c4fae', color2: '#5b86e8', tsize: 36 });
    text(ctx, Q.q, 1045, 195, { size: 40, align: 'center', weight: 800, maxW: 1060 });
    Q.choices.forEach((c, i) => {
      const x = 510 + (i % 2) * 545, y = 300 + Math.floor(i / 2) * 160;
      const p = S.p(id, 0.4, 1.5 + i * 0.35);
      let fill = '#f3f6ff', stroke = '#c5d2ef', tc = COLORS.ink;
      if (i === wrongPick) { fill = '#ffe1e5'; stroke = COLORS.red; }
      if (n === 4 && S.on('w4') && i === 2) { fill = '#ffe1e5'; stroke = COLORS.red; tc = COLORS.gray; }
      if (i === ans) { fill = correct ? '#dff7e6' : '#fff2d6'; stroke = correct ? COLORS.green : COLORS.orange; }
      withAlpha(ctx, p, () => {
        ctx.save(); rr(ctx, x, y, 525, 140, 24); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = i === ans || i === wrongPick ? 7 : 3; ctx.strokeStyle = stroke; ctx.stroke(); ctx.restore();
        circle(ctx, x + 50, y + 70, 32); ctx.fillStyle = i === ans && correct ? COLORS.green : '#2c4fae'; ctx.fill();
        text(ctx, ABCD[i], x + 50, y + 72, { size: 36, align: 'center', color: '#fff', weight: 800 });
        const sz = measure(ctx, c, 34, 800) > 410 ? 28 : 34;
        text(ctx, c, x + 100, y + 70, { size: sz, weight: 800, color: tc, maxW: 410, vcenter: true, lh: 1.2 });
        if (n === 4 && S.on('w4') && i === 2) { ctx.strokeStyle = COLORS.red; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 440, y + 30); ctx.lineTo(x + 500, y + 110); ctx.moveTo(x + 500, y + 30); ctx.lineTo(x + 440, y + 110); ctx.stroke(); }
        if (i === ans && correct) { for (let k = 0; k < 5; k++) sparkle(ctx, x + 80 + k * 100, y + 10 + Math.sin(t * 4 + k) * 10, 14, t + k, '#ffd23f'); }
      });
    });
    // 考える時間
    const th = S.d.thinks[qi];
    if (th && t >= th.t0 && t < th.t1 + 0.3) {
      const left = Math.max(0, Math.ceil(th.t1 - t));
      const k = clamp((t - th.t0) / (th.t1 - th.t0));
      ctx.save();
      circle(ctx, 1580, 102, 54); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(1580, 102, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.lineWidth = 11; ctx.strokeStyle = COLORS.orange; ctx.stroke();
      text(ctx, `${left}`, 1580, 105, { size: 46, align: 'center', weight: 800, color: COLORS.orange });
      ctx.restore();
      chip(ctx, 1045, 640, '考えてみよう！', { size: 32, align: 'center', fill: COLORS.orange });
    }
    // 解説
    if (S.on(`e${n}`)) pop(ctx, S.p(`e${n}`, 0.5), 1045, 760, () => {
      ctx.save(); rr(ctx, -575, -90, 1150, 180, 24); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = COLORS.green; ctx.stroke(); ctx.restore();
      chip(ctx, -555, -62, `正解 ${ABCD[Q.answer]}　なぜ？`, { size: 24, fill: COLORS.green });
      text(ctx, Q.why, -545, 16, { size: 28, weight: 800, maxW: 1100, lh: 1.3 });
      text(ctx, `出典：講義資料「${Q.slide}」`, 560, 68, { size: 18, align: 'right', color: COLORS.sub });
    });
  });
}

export default {
  draw(ctx, S) {
    const t = S.t;
    const ending = S.on('reflect');
    if (!ending) quiz(ctx, t);
    else {
      const k = S.e('reflect', 1.5);
      city(ctx, t, { cam: 400 + t * 5, warm: 1, people: false });
      withAlpha(ctx, 1 - k, () => quiz(ctx, t));
    }
    // 現在の問題
    let qi = -1;
    QS.forEach((q, i) => { if (S.on(q)) qi = i; });
    if (!S.on('clear') && qi >= 0) {
      const next = qi + 1 < QS.length ? QS[qi + 1] : 'clear';
      board(ctx, S, qi, S.vis(QS[qi], next, 0.5));
    }
    // 正解したらキャラクター登場
    if (qi >= 0 && !S.on('clear')) {
      const n = qi + 1, Q = S.quiz[QS[qi]];
      const next = qi + 1 < QS.length ? QS[qi + 1] : 'clear';
      const k = S.vis(`c${n}`, next, 0.4);
      if (k > 0 && Q.char !== 'sapo') pop(ctx, S.p(`c${n}`, 0.6), 1760, 420, () => at(ctx, 0, 0, 0.75, () => drawCell(ctx, Q.char, { t, mouth: S.mouth(Q.char), emo: 'happy', fire: true })));
    }
    // オープニング
    if (!S.on('q1')) pop(ctx, S.p('start', 0.6), W / 2 + 120, 330, () => {
      text(ctx, '最終試験', 0, -50, { size: 140, align: 'center', weight: 800, color: '#ffe066', stroke: '#1d2c6b', strokeW: 30 });
      text(ctx, '支持組織の秘密を解き明かせ！', 0, 90, { size: 64, align: 'center', weight: 800, color: '#fff', stroke: '#1d2c6b', strokeW: 18 });
    });
    // クリア
    const cl = S.vis('clear', 'reflect', 0.5);
    if (cl > 0) {
      pop(ctx, S.p('clear', 0.5), W / 2 + 100, 380, () => text(ctx, '全問クリア！', 0, 0, { size: 160, align: 'center', weight: 800, color: '#ffe066', stroke: '#e0475b', strokeW: 30 }));
    }
    confetti(ctx, t, S.L('clear'));
    // エンディング：住人のパレード
    if (ending) {
      const kinds = ['fibro', 'macro', 'plasma', 'mast', 'collagen', 'reticular', 'elastic', 'white', 'brown', 'bone', 'cartilage', 'blood'];
      const k = S.e('reflect', 2, 1);
      kinds.forEach((kd, i) => {
        const x = lerp(-200 - i * 170, 180 + i * 140, k) + Math.sin(t * 2 + i) * 6;
        const y = 760 + (i % 2) * 40 + Math.abs(Math.sin(t * 4 + i)) * -14;
        at(ctx, x, y, 0.42, () => drawCell(ctx, kd, { t: t + i, mouth: 0, emo: 'happy', plain: kd !== 'fibro' && kd !== 'macro' }));
      });
      if (S.on('team')) withAlpha(ctx, S.vis('team', 'summary'), () => tatoe(ctx, S.p('team', 0.5, 2), W / 2 + 200, 200, '支える・つなぐ・守る・ためる ＝ 最高のチーム', { size: 40 }));
      if (S.on('summary')) withAlpha(ctx, S.vis('summary', 'bye'), () => pop(ctx, S.p('summary', 0.6), W / 2 + 230, 330, () => {
        panel(ctx, -560, -250, 1120, 500, { title: '今日のまとめ（講義資料で確認しよう）', color: COLORS.blue, tsize: 34 });
        const L = ['分類：疎性・密性（不規則性／規則性）・軟骨・骨・血液とリンパ', '細胞外マトリックス：線維＋基質（GAG・プロテオグリカン）', '線維：膠原（I型）・細網（III型・鍍銀で黒）・弾性（エラスチン）',
          '細胞：線維芽細胞・マクロファージ・形質細胞・肥満細胞', '基底膜：基底板（IV型コラーゲン）＋線維網状板', '脂肪組織：白色（単胞性）・褐色（多胞性・UCP-1）'];
        L.forEach((s, i) => withAlpha(ctx, S.p('summary', 0.4, 1 + i * 1.6), () => text(ctx, `${i + 1}. ${s}`, -520, -160 + i * 66, { size: 29, weight: 800, maxW: 1060 })));
      }));
      if (S.on('bye')) {
        const k2 = S.p('bye', 0.8);
        withAlpha(ctx, k2 * 0.25, () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); });
        pop(ctx, k2, W / 2 + 200, 230, () => {
          text(ctx, '人体は巨大な街だった！', 0, -60, { size: 84, align: 'center', weight: 800, color: '#1e66d8', stroke: '#fff', strokeW: 22 });
          text(ctx, '支持組織の秘密を探れ！', 0, 40, { size: 72, align: 'center', weight: 800, color: '#e8487a', stroke: '#fff', strokeW: 20 });
          text(ctx, '一緒に学ぼう、人体のすごさを！', 0, 130, { size: 44, align: 'center', weight: 800, color: COLORS.ink, stroke: '#fff', strokeW: 12 });
        });
        withAlpha(ctx, S.p('bye', 1, 4), () => {
          const cr = ['原作・一次資料：2026 第6回 組織学総論「支持組織」講義資料', '音声：Style-Bert-VITS2（JVNVモデル／CC BY-SA 4.0）', 'BGM・効果音：本作のためのオリジナル（プログラムで合成）', 'たとえ話は理解のための比喩です。医学用語と機序は講義資料で確認してください'];
          cr.forEach((s, i) => text(ctx, s, W / 2 + 200, 470 + i * 40, { size: 24, align: 'center', weight: 700, color: COLORS.ink, stroke: 'rgba(255,255,255,0.85)', strokeW: 8 }));
        });
      }
    }
    const shun = S.actor('shun', [[0, { x: 250, y: 1010, s: 0.8, face: 1, d: 0.01 }], ['clear', { x: 330, d: 0.6 }], ['reflect', { x: 260, s: 0.85, face: 1, d: 1.2 }]]);
    if (S.on('c1') && !S.on('reflect')) { const c = QS.map((q, i) => `c${i + 1}`).filter((l) => S.win(l, l) || (S.on(l) && S.t - S.L(l) < 1.6)); if (c.length) shun.pose = 'cheer'; }
    const sapo = S.actor('sapo', [[0, { x: 1760, y: 930, s: 0.85, face: -1, d: 0.01 }], ['c1', { x: 1760 }], ['clear', { x: 520, face: -1, d: 1.0 }], ['reflect', { x: 500, face: -1, d: 1.0 }], ['bye', { pose: 'wave', face: -1 }]]);
    // 正解キャラが出ている間はサポちゃんを少し右へ
    S.draw(ctx, sapo);
    S.draw(ctx, shun);
  },
};

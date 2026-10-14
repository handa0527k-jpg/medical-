// SCENE 2：支持組織の街づくり会社（分類）
import { W, H, clamp, lerp, ease, easeOut, text, panel, term, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, table, bullets } from '../core.js';
import { site } from '../bg.js';
import { drawCell } from '../chars.js';
import { looseCT, denseIrregular, denseRegular, gelatinous, reticularTissue, adiposeTissue, tendonCross } from '../tissue.js';

function tile(ctx, fn, x, y, w, h, t, label, sub, color, o = {}) {
  ctx.save();
  rr(ctx, x - 8, y - 8, w + 16, h + 70, 26); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.lineWidth = o.hi ? 8 : 3; ctx.strokeStyle = o.hi ? COLORS.red : '#d5ddec'; ctx.stroke();
  ctx.restore();
  fn(ctx, x, y, w, h, t, o);
  text(ctx, label, x + w / 2, y + h + 32, { size: o.lsize || 34, align: 'center', weight: 800, color: color || COLORS.ink });
  if (sub) chip(ctx, x + w / 2, y - 6, sub, { size: 24, align: 'center', fill: color || COLORS.blue });
}

export default {
  draw(ctx, S) {
    const t = S.t;
    site(ctx, t, { cam: t * 6 });
    const shun = S.actor('shun', [[0, { x: -200, y: 1010, s: 0.8, face: 1, d: 0.01 }], ['q', { x: 230, d: 1.6 }],
      ['compare', { x: 330, d: 0.8 }], ['loosesub', { x: 220, d: 0.9 }], ['rope', { x: 300, d: 0.8 }], ['elasticreg', { x: 210, d: 0.9 }],
      ['winged', { x: 260, d: 0.8 }]]);
    const sapo = S.actor('sapo', [[0, { x: -300, y: 930, s: 0.85, face: 1, d: 0.01 }], ['q', { x: 480, d: 1.8, fly: true }],
      ['big', { x: 520, lift: 120, d: 1.0 }], ['loosedense', { x: 560, lift: 260, d: 1.0 }], ['compare', { x: 470, lift: 0, d: 1.0 }],
      ['gel', { x: 560, lift: 220, d: 0.9 }], ['densesub', { x: 470, lift: 0, d: 0.9 }], ['irreg', { x: 560, lift: 200, d: 0.9 }],
      ['cloth', { x: 470, lift: 40, d: 0.9 }], ['reg', { x: 560, lift: 220, d: 0.9 }], ['rope', { x: 470, lift: 0, d: 0.9 }],
      ['exam', { x: 540, lift: 160, d: 0.9 }]]);

    // 会社の看板（たとえ）
    const cA = S.vis('company', 'big');
    pop(ctx, S.p('company', 0.6) * cA, 1260, 420, () => {
      panel(ctx, -520, -280, 1040, 560, { r: 34 });
      ctx.fillStyle = '#4a6fb8'; rr(ctx, -470, -230, 940, 300, 20); ctx.fill();
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = 'rgba(230,248,255,0.85)'; rr(ctx, -420 + i * 220, -200 + j * 90, 160, 60, 10); ctx.fill(); }
      text(ctx, '支持組織 街づくり株式会社', 0, 140, { size: 60, align: 'center', weight: 800, color: COLORS.ink });
      text(ctx, '部署：結合組織・軟骨・骨・血液とリンパ', 0, 215, { size: 32, align: 'center', color: COLORS.sub });
      tag(ctx, -500, -258, 'tatoe');
    });

    // 大分類の組織図
    const bA = S.vis('big', 'loosedense');
    if (bA > 0) withAlpha(ctx, bA, () => {
      panel(ctx, 640, 90, 1240, 720, { title: '支持組織の分類', en: '講義資料の分類', color: COLORS.blue, tsize: 36 });
      pop(ctx, S.p('big', 0.5), 1260, 230, () => { chip(ctx, 0, 0, '支持組織（結合組織・広義）', { size: 40, align: 'center', fill: COLORS.ink }); });
      const kids = [['結合組織', '（狭義）', 'ct', 790], ['軟骨', 'cartilage', 'cartilage', 1080], ['骨', 'bone', 'bone', 1370], ['血液とリンパ', 'blood・lymph', 'blood', 1660]];
      kids.forEach(([n, en, ic, x], i) => {
        const p = S.p('big', 0.5, 0.8 + i * 0.6);
        if (p <= 0) return;
        arrow(ctx, 1260, 265, x, 360, { p: easeOut(p), color: '#9aa8c4', w: 4, head: 16 });
        pop(ctx, p, x, 560, () => {
          rr(ctx, -130, -170, 260, 330, 24); ctx.fillStyle = '#f5f8ff'; ctx.fill(); ctx.strokeStyle = '#c8d4ea'; ctx.lineWidth = 3; ctx.stroke();
          if (ic === 'ct') looseCT(ctx, -105, -150, 210, 170, t, { r: 16, seed: 2 });
          else at(ctx, 0, -60, 0.5, () => drawCell(ctx, ic, { t: t + i, mouth: 0 }));
          text(ctx, n, 0, 70, { size: 38, align: 'center', weight: 800 });
          text(ctx, en, 0, 118, { size: 26, align: 'center', color: COLORS.sub });
        });
      });
      if (S.on('narrow')) { ring(ctx, 790, 560, 165, 200, S.p('narrow', 0.8), COLORS.red, 7); chip(ctx, 790, 330, 'ここを詳しく', { size: 28, align: 'center', fill: COLORS.red }); }
    });

    // 疎性 vs 密性
    const ldA = S.vis('loosedense', 'loosesub');
    if (ldA > 0) withAlpha(ctx, ldA, () => {
      panel(ctx, 640, 90, 1240, 720, { title: '結合組織（狭義） connective tissue', color: COLORS.blue, tsize: 34 });
      const sway = S.on('compare') ? Math.sin(t * 1.5) * 0.4 : 0;
      pop(ctx, S.p('loosedense', 0.5, 0.5), 960, 470, () => tile(ctx, (c, x, y, w, h, tt) => looseCT(c, x, y, w, h, tt + sway, { seed: 4 }), -270, -250, 540, 440, t, '疎性結合組織 loose c.t.', '線維がまばら', COLORS.teal));
      pop(ctx, S.p('loosedense', 0.5, 4.5), 1560, 470, () => tile(ctx, (c, x, y, w, h, tt) => denseIrregular(c, x, y, w, h, tt + sway), -270, -250, 540, 440, t, '密性（緻密）結合組織 dense c.t.', '線維が緻密', COLORS.red));
    });

    // 疎性結合組織の下位分類
    const lsA = S.vis('loosesub', 'densesub');
    if (lsA > 0) withAlpha(ctx, lsA, () => {
      panel(ctx, 640, 90, 1240, 760, { title: '疎性結合組織 loose c.t.（線維がまばら）', color: COLORS.teal, color2: '#3cc7b8', tsize: 34 });
      const cards = [['通常の疎性結合組織', looseCT, '', 0], ['膠様組織 gelatinous tissue', gelatinous, '胎児性結合組織', 1], ['脂肪組織 adipose tissue', adiposeTissue, '', 2], ['細網組織 reticular tissue', reticularTissue, '', 3]];
      cards.forEach(([n, fn, sub, i]) => {
        const p = S.p('loosesub', 0.5, 0.8 + i * 1.6);
        const cx = 960 + (i % 2) * 600, cy = 330 + Math.floor(i / 2) * 290;
        const hi = (i === 1 && S.win('gel', 'retic')) || (i === 3 && S.on('retic'));
        pop(ctx, p, cx, cy, () => tile(ctx, fn, -260, -110, 520, 170, t, n, sub, i === 1 || i === 3 ? COLORS.purple : COLORS.teal, { hi, lsize: 30, seed: 5 + i }));
      });
      if (S.on('gel') && !S.on('retic')) {
        const k = S.p('gel', 0.5);
        withAlpha(ctx, k, () => { chip(ctx, 1290, 790, '臍帯（へその緒）', { size: 28, fill: COLORS.purple }); chip(ctx, 1560, 790, '成人：椎間板の髄核', { size: 28, fill: COLORS.purple }); });
        tatoe(ctx, S.p('gel', 0.5, 1.5), 900, 790, '寒天みたい', { size: 30 });
      }
      if (S.on('retic')) withAlpha(ctx, S.p('retic', 0.5), () => chip(ctx, 1360, 790, '骨髄・リンパ系（造血器官）', { size: 28, fill: COLORS.purple }));
    });

    // 密性結合組織
    const dA = S.vis('densesub', 'elasticreg');
    if (dA > 0) withAlpha(ctx, dA, () => {
      panel(ctx, 640, 90, 1240, 760, { title: '密性（緻密）結合組織 dense c.t.', color: COLORS.red, color2: '#f07a86', tsize: 34 });
      withAlpha(ctx, S.p('densesub', 0.5), () => text(ctx, '線維が多く、基質は少ない。細胞は主に線維芽細胞', 1260, 190, { size: 32, align: 'center', weight: 800 }));
      const ten = S.on('rope') ? 0.5 + 0.5 * Math.sin((t - S.L('rope')) * 2.2) : 0;
      const pi = S.p('irreg', 0.6), pr = S.p('reg', 0.6);
      pop(ctx, Math.max(S.p('densesub', 0.5, 4), pi), 960, 470, () => tile(ctx, denseIrregular, -260, -200, 520, 330, t, '密性不規則性結合組織', '膠原線維が不規則', COLORS.red, { hi: S.win('irreg', 'reg') }));
      pop(ctx, Math.max(S.p('densesub', 0.5, 5), pr), 1560, 470, () => tile(ctx, (c, x, y, w, h, tt) => denseRegular(c, x, y, w, h, tt, { tension: ten }), -260, -200, 520, 330, t, '密性規則性結合組織', '膠原線維が規則的', COLORS.red, { hi: S.on('reg') }));
      if (S.on('irreg')) {
        const k = S.p('irreg', 0.6, 2);
        bullets(ctx, 720, 725, ['例：真皮・角膜・強膜・筋膜・内臓被膜'], { size: 30, p: () => k, markColor: COLORS.red });
        if (S.win('irreg', 'reg')) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 0.3; arrow(ctx, 960 + Math.cos(a) * 230, 440 + Math.sin(a) * 160, 960 + Math.cos(a) * 320, 440 + Math.sin(a) * 230, { p: k, color: COLORS.orange, w: 6 }); }
      }
      if (S.on('cloth') && !S.on('reg')) tatoe(ctx, S.p('cloth', 0.5), 1260, 795, '布を、向きを変えて何枚も重ねたイメージ', { size: 30 });
      if (S.on('reg')) bullets(ctx, 1330, 725, ['例：腱・靭帯'], { size: 30, p: () => S.p('reg', 0.6, 2), markColor: COLORS.red });
      if (S.on('rope')) {
        const k = S.p('rope', 0.6);
        arrow(ctx, 1290, 440, 1180 - ten * 30, 440, { p: k, color: COLORS.orange, w: 10, head: 30 });
        arrow(ctx, 1830, 440, 1940 + ten * 30, 440, { p: k, color: COLORS.orange, w: 10, head: 30 });
        tatoe(ctx, S.p('rope', 0.5, 1), 1560, 800, '一方向にそろったロープの束', { size: 30 });
      }
    });

    // 膠原線維性・弾性線維性
    const eA = S.vis('elasticreg', 'winged');
    if (eA > 0) withAlpha(ctx, eA, () => {
      panel(ctx, 640, 120, 1240, 560, { title: '密性規則性結合組織の例', color: COLORS.red, color2: '#f07a86', tsize: 34 });
      table(ctx, 700, 230, [380, 740], 120, [['種類', '例'], [{ t: '膠原線維性 collagenous', c: COLORS.red, size: 28 }, '腱・靭帯（膠原線維が多い）'], [{ t: '弾性線維性 elastic', c: '#c07a10', size: 28 }, '太い動脈の壁・頸椎の項靭帯（弾性線維が多い）']],
        { size: 28, p: (r) => S.p('elasticreg', 0.5, r * 3) });
    });

    // 腱の横断面と翼細胞
    const wA = S.vis('winged', 'exam');
    if (wA > 0) withAlpha(ctx, wA, () => {
      panel(ctx, 640, 90, 1240, 760, { title: '腱（密性規則性結合組織）の横断面', color: COLORS.red, color2: '#f07a86', tsize: 34 });
      tendonCross(ctx, 700, 180, 640, 620, t, { hi: S.p('winged', 0.5, 6) });
      withAlpha(ctx, S.p('winged', 0.5, 1), () => {
        chip(ctx, 1380, 260, '膠原線維 collagen fiber', { size: 30, fill: '#d6614f' });
        text(ctx, '多数の膠原細線維 collagen fibril からなる', 1380, 320, { size: 26, color: COLORS.sub });
        arrow(ctx, 1370, 260, 1200, 330, { color: '#e39a3a', w: 5 });
      });
      withAlpha(ctx, S.p('winged', 0.5, 5), () => {
        chip(ctx, 1380, 470, '線維芽細胞 fibroblast', { size: 30, fill: '#3a5fd6' });
        text(ctx, '膠原線維により細胞質が圧平', 1380, 530, { size: 26, color: COLORS.sub });
        arrow(ctx, 1370, 470, 1050, 450, { color: '#3a5fd6', w: 5 });
      });
      pop(ctx, S.p('winged', 0.5, 8), 1600, 660, () => { chip(ctx, 0, 0, '別名：翼細胞 winged cell', { size: 36, align: 'center', fill: COLORS.red }); });
    });

    // 試験ポイント
    const xA = S.vis('exam');
    if (xA > 0) withAlpha(ctx, xA, () => {
      pop(ctx, S.p('exam', 0.6), 1260, 440, () => {
        panel(ctx, -600, -300, 1200, 600, { title: '試験ポイント：密性結合組織', color: COLORS.red, color2: '#f07a86', tsize: 36 });
        tag(ctx, 580, -268, 'exam', { align: 'right' });
        text(ctx, '不規則性（膠原線維が不規則）', -550, -150, { size: 36, weight: 800, color: COLORS.red });
        text(ctx, '真皮・角膜・強膜・筋膜・内臓被膜', -520, -86, { size: 36 });
        text(ctx, '規則性（膠原線維が規則的）', -550, 30, { size: 36, weight: 800, color: COLORS.red });
        text(ctx, '膠原線維性：腱・靭帯', -520, 96, { size: 36 });
        text(ctx, '弾性線維性：太い動脈の壁・項靭帯', -520, 156, { size: 36 });
        text(ctx, '腱の線維芽細胞＝翼細胞', -550, 240, { size: 34, weight: 800, color: '#3a5fd6' });
      });
    });

    S.draw(ctx, sapo);
    S.draw(ctx, shun);
  },
};

// SCENE 1：人体シティへようこそ！
import { W, H, clamp, lerp, ease, easeOut, back, text, panel, term, tatoe, tag, chip, arrow, ring, lens, pop, withAlpha, at, sparkle, COLORS, rr, measure } from '../core.js';
import { city } from '../bg.js';
import { drawCell } from '../chars.js';
import { epiCross, mesenchyme } from '../tissue.js';

function titleLogo(ctx, t) {
  const a = clamp((8.6 - t) / 0.6);
  if (a <= 0) return;
  withAlpha(ctx, a, () => {
    const p1 = clamp((t - 0.6) / 0.7), p2 = clamp((t - 1.9) / 0.7), p3 = clamp((t - 3.1) / 0.6), p4 = clamp((t - 4.0) / 0.6);
    withAlpha(ctx, 0.5 * Math.max(p1, 0), () => { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 150, W, 560); });
    pop(ctx, p1, W / 2, 300, () => {
      ctx.rotate(-0.03);
      text(ctx, '人体は巨大な街だった！', 0, 0, { size: 128, align: 'center', weight: 800, color: '#1e66d8', stroke: '#fff', strokeW: 30 });
    });
    pop(ctx, p2, W / 2, 470, () => {
      ctx.rotate(-0.03);
      text(ctx, '支持組織の秘密を探れ！', 0, 0, { size: 112, align: 'center', weight: 800, color: '#e8487a', stroke: '#fff', strokeW: 28 });
    });
    withAlpha(ctx, p3, () => text(ctx, '〜 体を支え、つなぎ、守り、未来をつくる 〜', W / 2, 600, { size: 52, align: 'center', weight: 800, color: COLORS.ink, stroke: '#fff', strokeW: 14 }));
    withAlpha(ctx, p4, () => chip(ctx, W / 2, 680, 'ANIME MEDICAL STUDIO ｜ 医学部 組織学「支持組織」', { size: 30, align: 'center', fill: '#1f2a44' }));
    for (let i = 0; i < 10; i++) sparkle(ctx, 300 + i * 150, 200 + (i % 3) * 180 + Math.sin(t * 2 + i) * 20, 14 * p2, t + i, '#ffe066');
  });
}

export default {
  draw(ctx, S) {
    const t = S.t;
    const [sx, sy] = S.shake('arrive', 1.4, 18);
    const [sx2, sy2] = S.shake('stumble', 1.0, 10);
    ctx.save();
    ctx.translate(sx + sx2, sy + sy2);
    const cam = t < 9 ? t * 70 : 630 + (t - 9) * 8;
    const zoomK = S.e('zoom', 1.2);
    city(ctx, t, { cam });
    titleLogo(ctx, t);

    // キャラクター
    const shunKeys = [[0, { x: 760, y: -300, s: 0.95, face: 1, pose: 'panic', d: 0.01 }],
      ['arrive', { y: 1010, d: 0.6, fly: true }], ['stumble', { tilt: 0.0, pose: 'panic', d: 0.2 }], ['sapo', { tilt: 0, pose: 'idle', d: 0.4 }],
      ['zoom', { x: 250, s: 0.8, face: 1, d: 1.1 }], ['go', { x: 2300, d: 2.4 }]];
    const sapoKeys = [[0, { x: 2200, y: 930, s: 1.0, face: -1, d: 0.01 }], ['sapo', { x: 1060, d: 0.7, fly: true }],
      ['between', { x: 1180, face: -1, d: 0.8 }], ['zoom', { x: 620, s: 0.82, face: -1, d: 1.1 }], ['go', { x: 2400, face: 1, d: 2.2 }]];
    const shun = S.actor('shun', shunKeys);
    // 着地のときに少しつぶれる
    const land = S.since('arrive');
    if (land > 0.55 && land < 0.9) shun.s *= 1 - 0.06 * Math.sin((land - 0.55) / 0.35 * Math.PI);
    if (S.win('stumble', 'sapo')) { shun.tilt = 0.22 * Math.sin(S.since('stumble') * 9); shun.rot = 0; }
    const sapo = S.actor('sapo', sapoKeys);
    if (S.win('sapo', 'welcome')) sapo.pose = 'catch';

    // 「人体シティへようこそ」看板とたとえラベル
    const pw = S.vis('welcome', 'today');
    pop(ctx, S.p('welcome', 0.6) * pw, W / 2, 140, () => {
      rr(ctx, -430, -64, 860, 128, 64); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#ef7aa8'; ctx.stroke();
      text(ctx, 'ようこそ 人体シティへ！', 0, 4, { size: 64, align: 'center', weight: 800, color: '#e8487a' });
    });
    if (pw > 0) {
      const lab = (x, y, s, k) => withAlpha(ctx, S.p('welcome', 0.6, 0.6 + k * 0.35) * pw, () => {
        const w = measure(ctx, s, 30, 800) + 130;
        rr(ctx, x - w / 2, y - 30, w, 60, 30); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; ctx.stroke();
        tag(ctx, x - w / 2 + 10, y, 'tatoe', { size: 18 });
        text(ctx, s, x + 42, y + 2, { size: 30, align: 'center', weight: 800, color: '#8a4b07' });
      });
      lab(1520, 300, '血管 ＝ 交通網', 0);
      lab(1500, 520, '赤血球 ＝ 配送車', 1);
      lab(380, 640, '細胞 ＝ 街の住人', 2);
    }
    // 名札
    if (S.t >= S.d.lines[5].t0) {
      const k = clamp((S.t - S.d.lines[5].t0) / 0.5) * clamp((S.L('bone') - S.t) / 0.4);
      pop(ctx, k, shun.x - 160, 300, () => {
        rr(ctx, -210, -52, 420, 104, 24); ctx.fillStyle = COLORS.shun; ctx.fill();
        text(ctx, '主人公：蒼井 俊', 0, -14, { size: 38, align: 'center', color: '#fff', weight: 800 });
        text(ctx, '医学部1年生', 0, 28, { size: 26, align: 'center', color: '#dbe8ff', weight: 700 });
      });
      const k2 = clamp((S.t - S.d.lines[4].t0) / 0.5) * clamp((S.L('bone') - S.t) / 0.4);
      pop(ctx, k2, sapo.x + 260, 420, () => {
        rr(ctx, -200, -52, 400, 104, 24); ctx.fillStyle = COLORS.sapo; ctx.fill();
        text(ctx, '案内役：サポちゃん', 0, -14, { size: 36, align: 'center', color: '#fff', weight: 800 });
        text(ctx, 'AIガイド', 0, 28, { size: 26, align: 'center', color: '#e3f6ff', weight: 700 });
      });
    }
    // 今日のテーマ
    pop(ctx, S.p('today', 0.6) * S.vis('today', 'zoom'), W / 2, 150, () => {
      panel(ctx, -360, -70, 720, 140, { r: 30 });
      text(ctx, '今日のテーマ', 0, -28, { size: 30, align: 'center', color: COLORS.sub });
      text(ctx, '支持組織', 0, 26, { size: 66, align: 'center', color: COLORS.blue, weight: 800 });
    });
    // 考えごとの吹き出し（骨？）
    const bub = S.vis('bone', 'between');
    if (bub > 0) {
      const bx = shun.x + 300, by = 420;
      withAlpha(ctx, bub, () => {
        for (const [dx, dy, r] of [[-170, 140, 14], [-130, 100, 22]]) { ctx.beginPath(); ctx.arc(bx + dx, by + dy, r, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); }
        ctx.beginPath(); ctx.ellipse(bx, by - 40, 190, 120, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#c8d4ea'; ctx.lineWidth = 4; ctx.stroke();
        at(ctx, bx - 70, by - 40, 0.42, () => drawCell(ctx, 'bone', { t, mouth: 0 }), -0.5);
        if (S.on(S.d.lines[9].t0)) chip(ctx, bx + 60, by - 40, '＋筋肉？', { size: 30, align: 'center', fill: COLORS.red });
        else text(ctx, '？', bx + 70, by - 40, { size: 80, align: 'center', color: COLORS.blue, weight: 800 });
        const half = clamp((S.t - S.d.lines[8].t0) / 0.4);
        if (S.t >= S.d.lines[8].t0) pop(ctx, half, bx + 140, by - 150, () => { ctx.rotate(0.15); chip(ctx, 0, 0, '△ 半分正解', { size: 34, align: 'center', fill: COLORS.orange }); });
      });
    }
    // 細胞と細胞の間
    const gp = S.vis('between', 'zoom', 0.4);
    if (gp > 0) {
      withAlpha(ctx, gp, () => {
        ring(ctx, 1560, 700, 130, 80, S.p('between', 0.9), COLORS.red, 7);
        chip(ctx, 1560, 580, '細胞と細胞の「間」', { size: 34, align: 'center', fill: COLORS.red });
        at(ctx, 1490, 730, 0.3, () => drawCell(ctx, 'fibro', { t, plain: true }));
        at(ctx, 1640, 700, 0.28, () => drawCell(ctx, 'macro', { t, plain: true }));
      });
      if (S.on('akichi')) tatoe(ctx, S.p('akichi', 0.5) * gp, 1560, 470, 'ただの空き地？', { size: 34 });
    }
    // ズーム：顕微鏡の窓
    const LX = 1290, LY = 450, LR = 390;
    lens(ctx, LX, LY, LR, zoomK * S.vis('zoom', 'go', 0.6), (r) => {
      const hiEpi = S.vis('epi', 'vessel');
      const hiECM = S.vis('feat', 'epi', 0.4) * S.p('feat', 0.5, 3.5);
      epiCross(ctx, LX - r, LY - r, r * 2, r * 2, t, { r: 0, epiH: 150, hiEpi, hiECM, seed: 3 });
      // 細胞の丸囲み（まばら）
      if (S.win('feat', 'epi')) {
        const k = S.p('feat', 0.8);
        for (const [x, y] of [[-150, 120], [120, 40], [40, 250]]) ring(ctx, LX + x, LY + y, 60, 40, k, COLORS.blue, 5);
      }
      if (S.win('vessel', 'fibgs')) ring(ctx, LX - r + r * 2 * 0.72, LY - r + 170 + (r * 2 - 170) * 0.62, 70, 70, S.p('vessel', 0.8), COLORS.red, 7);
    }, { ringColor: '#7fa8e8' });
    // レンズのラベル
    if (S.on('zoom')) {
      const v = S.vis('zoom', 'go', 0.5) * S.p('zoom', 0.5, 1);
      withAlpha(ctx, v, () => {
        chip(ctx, LX, LY - LR - 10, '結合組織（支持組織）の模式図', { size: 26, align: 'center', fill: '#4a6fb8' });
        if (S.win('feat', 'epi')) {
          chip(ctx, LX - 220, LY + 200, '細胞：まばら・極性なし', { size: 28, align: 'center', fill: COLORS.blue });
          if (S.p('feat', 0.5, 3.5) > 0) withAlpha(ctx, S.p('feat', 0.5, 3.5), () => chip(ctx, LX + 120, LY + 320, '細胞間質：豊富', { size: 30, align: 'center', fill: '#d18b00' }));
        }
        if (S.win('epi', 'vessel')) chip(ctx, LX, LY - LR + 120, '上皮組織：細胞がぎっしり・極性あり', { size: 28, align: 'center', fill: '#5a7bd6' });
        if (S.win('vessel', 'fibgs')) chip(ctx, LX + 140, LY + 330, '細胞間質中に血管あり', { size: 28, align: 'center', fill: COLORS.red });
      });
    }
    // 左側：用語カード
    const leftA = S.vis('def', 'fibgs');
    if (leftA > 0) withAlpha(ctx, leftA, () => {
      term(ctx, S.p('def', 0.6), 50, 160, 820, '支持組織', 'Stützgewebe（ドイツ語）', '＝ 結合組織 connective tissue（広義）', { tag: 'med', size: 44 });
      if (S.on('mesen')) {
        term(ctx, S.p('mesen', 0.6), 50, 340, 820, '間葉 由来', 'mesenchyme', '細胞がまばらな胎児性組織', { tag: 'med', color: COLORS.purple });
      }
    });
    // 細胞間質＝線維＋基質 のツリー（左上パネル）
    const treeA = S.vis('fibgs', 'ecm');
    if (treeA > 0) withAlpha(ctx, treeA, () => {
      panel(ctx, 40, 90, 830, 400, { title: '細胞間質 intercellular substance', color: '#d18b00', color2: '#f2b632', tsize: 30 });
      const k1 = S.e('fibgs', 0.6, 0.3);
      arrow(ctx, 150, 180, 150, 230, { p: k1, color: COLORS.sub, w: 5, head: 16 });
      text(ctx, '線維 fiber', 100, 262, { size: 36, weight: 800, color: COLORS.red });
      text(ctx, '基質 ground substance', 100, 330, { size: 36, weight: 800, color: COLORS.teal });
      if (S.on('lm')) {
        withAlpha(ctx, S.p('lm', 0.5), () => {
          text(ctx, '… 光顕でも見える', 380, 262, { size: 30, color: COLORS.ink });
          text(ctx, '… 光顕では無構造', 560, 330, { size: 30, color: COLORS.ink });
          tag(ctx, 840, 140, 'med', { align: 'right' });
        });
      }
      if (S.on('em')) {
        withAlpha(ctx, S.p('em', 0.6), () => {
          ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(130, 352); ctx.lineTo(130, 450); ctx.moveTo(130, 395); ctx.lineTo(160, 395); ctx.moveTo(130, 450); ctx.lineTo(160, 450); ctx.stroke();
          text(ctx, '多糖類 GAG', 170, 395, { size: 32, weight: 800, color: COLORS.teal });
          text(ctx, '… 電顕で見える', 400, 395, { size: 28, color: COLORS.red, weight: 800 });
          text(ctx, '組織液 tissue fluid', 170, 450, { size: 32, weight: 800, color: '#3d8fd1' });
          text(ctx, '… 電顕でも無構造', 480, 450, { size: 28, color: COLORS.sub, weight: 800 });
        });
      }
    });
    S.draw(ctx, sapo);
    S.draw(ctx, shun);
    // 細胞外マトリックス（ECM）
    const ecmA = S.vis('ecm', 'go', 0.5);
    if (ecmA > 0) withAlpha(ctx, ecmA, () => {
      withAlpha(ctx, 0.35, () => { ctx.fillStyle = '#0d1b3a'; ctx.fillRect(0, 0, W, H); });
      pop(ctx, S.p('ecm', 0.6), W / 2, 230, () => {
        panel(ctx, -640, -120, 1280, 240, { r: 34 });
        tag(ctx, -620, -90, 'med');
        text(ctx, '細胞外マトリックス', 0, -26, { size: 84, align: 'center', weight: 800, color: '#d14d8a' });
        text(ctx, 'extracellular matrix（ECM）／ 細胞外基質', 0, 60, { size: 36, align: 'center', color: COLORS.sub });
      });
      if (S.on('ecm2')) {
        pop(ctx, S.p('ecm2', 0.6), 560, 560, () => {
          panel(ctx, -330, -140, 660, 280, { title: '広義', color: '#4a6fb8', tsize: 34 });
          text(ctx, '細胞間質と同義', 0, 0, { size: 44, align: 'center', weight: 800 });
          text(ctx, '＝ 空間的な概念', 0, 70, { size: 36, align: 'center', color: COLORS.sub });
        });
        pop(ctx, S.p('ecm2', 0.6, 3.5), 1360, 560, () => {
          panel(ctx, -330, -140, 660, 280, { title: '狭義', color: '#d14d8a', tsize: 34 });
          text(ctx, '線維 ＋ 基質の多糖類', 0, 0, { size: 44, align: 'center', weight: 800 });
          text(ctx, '＝ 物質的な概念', 0, 70, { size: 36, align: 'center', color: COLORS.sub });
        });
      }
      if (S.on('infra')) tatoe(ctx, S.p('infra', 0.5), W / 2, 800, '空き地じゃない！ 街を支えるインフラ', { size: 38 });
    });
    if (S.win('sapo', 'welcome')) for (let i = 0; i < 8; i++) sparkle(ctx, sapo.x + 80 + i * 40, sapo.y - 200 + Math.sin(i + t * 3) * 40, 12, t + i, '#7fdcff');
    ctx.restore();
  },
};

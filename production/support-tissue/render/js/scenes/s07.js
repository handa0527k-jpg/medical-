// SCENE 7：結合組織の住人たち（細胞の由来・線維芽細胞・マクロファージ・形質細胞・肥満細胞）
import { W, H, clamp, lerp, ease, easeOut, text, panel, tatoe, tag, chip, arrow, ring, pop, withAlpha, at, COLORS, rr, circle, ellipse, sparkle } from '../core.js';
import { plaza } from '../bg.js';
import { drawCell } from '../chars.js';
import { spindle } from '../tissue.js';

function items(ctx, S, x, y, list, o = {}) {
  let yy = y;
  for (const [lab, d, s, col] of list) {
    const p = S.p(lab, 0.45, d);
    if (p > 0) withAlpha(ctx, p, () => {
      const dx = (1 - easeOut(p)) * 30;
      circle(ctx, x + dx + 10, yy, 8); ctx.fillStyle = col || o.color || COLORS.blue; ctx.fill();
      text(ctx, s, x + dx + 32, yy, { size: o.size || 29, weight: 800, color: col || COLORS.ink, maxW: o.maxW || 700 });
    });
    yy += o.gap || 62;
  }
}

function profile(ctx, S, who, name, en, color, a) {
  if (a <= 0) return;
  withAlpha(ctx, a, () => {
    panel(ctx, 620, 80, 1270, 790, { title: name, en, color, tsize: 38 });
  });
}

function presentation(ctx, t, k) {
  // マクロファージが抗原を組織適合抗原（MHC）にのせて T 細胞に見せる
  at(ctx, 0, 0, 0.55, () => drawCell(ctx, 'macro', { t, plain: true, mouth: 0 }));
  const tx = lerp(330, 210, ease(k));
  at(ctx, tx, 0, 0.8, () => drawCell(ctx, 'tcell', { t, mouth: 0 }));
  ctx.fillStyle = '#2fa45a'; rr(ctx, 70, -16, 34, 32, 6); ctx.fill();
  ctx.fillStyle = '#f29a2e'; ctx.beginPath(); ctx.moveTo(104, -14); ctx.lineTo(126, 0); ctx.lineTo(104, 14); ctx.closePath(); ctx.fill();
  text(ctx, '組織適合抗原＋抗原', 90, 70, { size: 22, align: 'center', weight: 800, color: '#2fa45a' });
}

export default {
  draw(ctx, S) {
    const t = S.t;
    plaza(ctx, t);
    const shun = S.actor('shun', [[0, { x: 210, y: 1010, s: 0.78, face: 1, d: 0.01 }], ['resident', { x: 290 }], ['fibro', { x: 200 }], ['rer', { x: 300 }], ['fat', { x: 330, d: 0.6 }], ['mast2', { x: 200 }]]);
    const sapo = S.actor('sapo', [[0, { x: 450, y: 930, s: 0.82, face: 1, d: 0.01 }], ['macro4', { x: 520, lift: 230 }], ['macro5', { x: 450, lift: 0 }], ['notfat', { x: 520, lift: 160 }], ['mast2', { x: 450, lift: 0 }], ['mast7', { x: 520, lift: 200 }]]);

    // ───── 由来 ─────
    const oA = S.vis('origin', 'fibro');
    if (oA > 0) withAlpha(ctx, oA, () => {
      panel(ctx, 620, 80, 1270, 790, { title: '支持組織の細胞の由来', color: COLORS.teal, color2: '#3cc7b8', tsize: 36 });
      withAlpha(ctx, S.p('origin', 0.5), () => chip(ctx, 1255, 200, '発生初期の間葉細胞から分化する', { size: 30, align: 'center', fill: COLORS.teal }));
      // 右：固定細胞
      const kf = S.p('fixed', 0.5);
      withAlpha(ctx, kf, () => {
        chip(ctx, 1570, 290, '未分化間葉細胞', { size: 32, align: 'center', fill: '#8b5bd6' });
        text(ctx, '（胎生期＋生後も存在？）', 1570, 340, { size: 22, align: 'center', color: COLORS.sub });
        arrow(ctx, 1570, 365, 1570, 430, { p: S.p('fixed', 0.5, 1), color: '#8b5bd6', w: 6 });
      });
      withAlpha(ctx, S.p('fixed', 0.5, 2), () => {
        chip(ctx, 1570, 470, '結合組織の固定細胞', { size: 32, align: 'center', fill: '#8b5bd6' });
        [['fibro', '線維芽細胞'], ['reticular', '細網細胞'], ['white', '脂肪細胞']].forEach(([k, n], i) => {
          at(ctx, 1400 + i * 170, 590, 0.32, () => drawCell(ctx, k, { t: t + i, plain: true, mouth: 0 }));
          text(ctx, n, 1400 + i * 170, 670, { size: 24, align: 'center', weight: 800 });
        });
      });
      withAlpha(ctx, S.p('fixed', 0.5, 9), () => text(ctx, '骨細胞・軟骨細胞・血管の内皮細胞・周皮細胞 も', 1570, 760, { size: 26, align: 'center', weight: 800, color: '#8b5bd6' }));
      // 左：自由細胞
      withAlpha(ctx, S.p('free', 0.5), () => {
        chip(ctx, 940, 290, '骨髄の造血幹細胞', { size: 32, align: 'center', fill: COLORS.red });
        arrow(ctx, 940, 320, 940, 370, { p: S.p('free', 0.5, 0.8), color: COLORS.red, w: 6 });
        text(ctx, '末梢血球', 940, 400, { size: 28, align: 'center', weight: 800 });
        arrow(ctx, 940, 425, 940, 455, { p: S.p('free', 0.5, 1.6), color: COLORS.red, w: 6 });
      });
      withAlpha(ctx, S.p('free', 0.5, 2.5), () => {
        chip(ctx, 940, 490, '結合組織の自由細胞', { size: 32, align: 'center', fill: COLORS.red });
        [['macro', '大食細胞'], ['mast', '肥満細胞'], ['plasma', '形質細胞']].forEach(([k, n], i) => {
          const wob = Math.sin(t * 2 + i) * 20;
          at(ctx, 770 + i * 170 + wob, 610, 0.32, () => drawCell(ctx, k, { t: t + i, plain: true, mouth: 0 }));
          text(ctx, n, 770 + i * 170, 690, { size: 24, align: 'center', weight: 800 });
        });
        text(ctx, 'など（毛細血管から遊走）', 940, 740, { size: 24, align: 'center', color: COLORS.sub });
      });
      if (S.on('resident')) { tatoe(ctx, S.p('resident', 0.5), 1570, 820, 'ずっと住む人', { size: 26 }); tatoe(ctx, S.p('resident', 0.5, 1.5), 940, 820, '外から来て動き回る人', { size: 26 }); }
    });

    // ───── 線維芽細胞 ─────
    const fA = S.vis('fibro', 'macro');
    profile(ctx, S, 'fibro', '固定細胞：線維芽細胞', 'fibroblast', COLORS.fibro, fA);
    if (fA > 0) withAlpha(ctx, fA, () => {
      at(ctx, 830, 330, 0.95, () => drawCell(ctx, 'fibro', { t, mouth: S.mouth('fibro'), emo: 'happy', hammer: S.speaking('fibro') }));
      items(ctx, S, 1080, 220, [['fibro', 2, '線維と基質（細胞外マトリックス成分）を産生', COLORS.fibro], ['fibro2', 0, '未分化間葉細胞に由来'], ['fibro2', 2.5, '増殖能あり'], ['fibro2', 4.5, '特殊化 → 細網細胞・脂肪細胞', COLORS.purple]], { maxW: 770 });
      if (S.on('fibro3')) {
        withAlpha(ctx, S.p('fibro3', 0.5), () => {
          ctx.save(); rr(ctx, 660, 500, 590, 340, 20); ctx.fillStyle = '#fff3f7'; ctx.fill(); rr(ctx, 1270, 500, 590, 340, 20); ctx.fillStyle = '#f4f4f8'; ctx.fill(); ctx.restore();
          // 若い線維芽細胞：多角形、明るい核、核小体明瞭
          ctx.beginPath(); [[-90, -40], [-20, -80], [80, -50], [100, 30], [20, 70], [-80, 50]].forEach(([x, y], i) => (i ? ctx.lineTo(760 + x, 640 + y) : ctx.moveTo(760 + x, 640 + y))); ctx.closePath();
          ctx.fillStyle = '#c99ad6'; ctx.fill(); ellipse(ctx, 765, 640, 34, 24); ctx.fillStyle = '#f3e3ff'; ctx.fill(); circle(ctx, 770, 636, 7); ctx.fillStyle = '#5a2e7a'; ctx.fill();
          text(ctx, '若い線維芽細胞', 1060, 550, { size: 30, align: 'center', weight: 800, color: COLORS.fibro });
          ['多角形・核が明るく核小体明瞭', '細胞質は塩基好性', '増殖能・基質産生能 高い'].forEach((s, i) => text(ctx, s, 880, 620 + i * 50, { size: 24, weight: 800 }));
        });
        withAlpha(ctx, S.p('fibro3', 0.5, 9), () => {
          spindle(ctx, 1380, 650, 90, 16, -0.15, '#c7bfd0', '#3a2e4a');
          text(ctx, '線維細胞 fibrocyte（老朽化）', 1660, 550, { size: 28, align: 'center', weight: 800, color: '#5b5b6e' });
          ['細長い・核が暗い', '小器官が乏しい', '増殖能・基質産生能 低い'].forEach((s, i) => text(ctx, s, 1490, 620 + i * 50, { size: 24, weight: 800 }));
        });
      }
    });

    // ───── マクロファージ ─────
    const mA = S.vis('macro', 'plasma');
    profile(ctx, S, 'macro', '自由細胞：大食細胞（マクロファージ）', 'macrophage', COLORS.macro, mA);
    if (mA > 0) withAlpha(ctx, mA, () => {
      at(ctx, 820, 340, 0.95, () => drawCell(ctx, 'macro', { t, mouth: S.mouth('macro'), emo: 'happy' }));
      items(ctx, S, 1060, 210, [['macro2', 0, 'やや不規則な卵形の細胞'], ['macro2', 2.5, '電顕：空豆形の核・多数の細胞質突起'], ['macro3', 0, 'リソソーム・食胞が発達（酸性フォスファターゼ）'],
        ['macro3', 6, 'Fc受容体：抗体と結合／C3結合体：補体と結合']], { maxW: 800, size: 27, gap: 58 });
      const fnA = S.p('macro4', 0.5) * (1 - S.p('macro6', 0.5));
      if (fnA > 0) withAlpha(ctx, fnA, () => {
        ctx.save(); rr(ctx, 660, 470, 1200, 380, 20); ctx.fillStyle = '#f2f5ff'; ctx.fill(); ctx.restore();
        text(ctx, '機能', 690, 505, { size: 30, weight: 800, color: COLORS.macro });
        items(ctx, S, 690, 560, [['macro4', 0, '① 貪食による生体防御（自然免疫）', COLORS.macro], ['macro4', 4, '② 抗原を組織適合抗原とともにT細胞に提示（抗原提示細胞）', COLORS.macro],
          ['macro5', 0, '③ 抗原-抗体-補体の複合体を結合させて貪食（活性化大食細胞）', COLORS.macro], ['macro5', 4.5, '④ T細胞増殖因子や補体の産生', COLORS.macro]], { size: 25, gap: 56, maxW: 780 });
        if (S.on('macro4', 4) && !S.on('macro6')) at(ctx, 1580, 640, 1, () => presentation(ctx, t, S.p('macro4', 2, 4)));
      });
      if (S.on('macro6')) pop(ctx, S.p('macro6', 0.5), 1260, 650, () => {
        rr(ctx, -270, -120, 540, 240, 20); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = COLORS.macro; ctx.lineWidth = 4; ctx.stroke();
        text(ctx, '由来', 0, -80, { size: 28, align: 'center', weight: 800, color: COLORS.macro });
        text(ctx, '組織に常在：卵黄嚢の造血幹細胞', 0, -20, { size: 24, align: 'center', weight: 800 });
        text(ctx, '炎症時：骨髄の造血幹細胞', 0, 30, { size: 24, align: 'center', weight: 800 });
        text(ctx, '（細網組織などでは常在し固定細胞とも扱われる）', 0, 80, { size: 18, align: 'center', color: COLORS.sub });
      });
    });

    // ───── 形質細胞 ─────
    const pA = S.vis('plasma', 'mast');
    profile(ctx, S, 'plasma', '自由細胞：形質細胞', 'plasma cell', COLORS.plasma, pA);
    if (pA > 0) withAlpha(ctx, pA, () => {
      at(ctx, 820, 330, 1.0, () => drawCell(ctx, 'plasma', { t, mouth: S.mouth('plasma'), emo: 'happy' }));
      items(ctx, S, 1060, 210, [['plasma2', 0, '円形〜楕円形・偏心性の核'], ['plasma2', 3, '核の異染色質が放射状＝車軸核（Radkern）', COLORS.plasma],
        ['plasma3', 0, 'rERが非常に発達 → 細胞質は塩基好性'], ['plasma3', 4, 'ゴルジ野が明瞭（明るく抜けて見える）'], ['plasma4', 0, 'Bリンパ球が抗原刺激で変化 → 抗体を産生（液性免疫）', COLORS.plasma]], { size: 27, gap: 60, maxW: 800 });
      if (S.on('plasma2', 3)) pop(ctx, S.p('plasma2', 0.6, 3) * S.vis('plasma2', 'plasma4'), 820, 680, () => {
        circle(ctx, 0, 0, 120); ctx.fillStyle = '#efe2ff'; ctx.fill(); ctx.strokeStyle = '#5a2e9c'; ctx.lineWidth = 5; ctx.stroke();
        ctx.fillStyle = '#5a2e9c';
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + t * 0.2; ellipse(ctx, Math.cos(a) * 82, Math.sin(a) * 82, 22, 13, a); ctx.fill(); }
        circle(ctx, 0, 0, 24); ctx.fill();
        text(ctx, '車軸核', 0, 150, { size: 30, align: 'center', weight: 800, color: COLORS.plasma });
      });
      if (S.on('plasma4')) {
        const k = S.p('plasma4', 3);
        withAlpha(ctx, S.p('plasma4', 0.5), () => {
          ctx.save(); rr(ctx, 660, 560, 1200, 290, 20); ctx.fillStyle = '#f6f2ff'; ctx.fill(); ctx.restore();
          at(ctx, 780, 690, 0.8, () => drawCell(ctx, 'tcell', { t, mouth: 0 }));
          text(ctx, 'Bリンパ球', 780, 790, { size: 24, align: 'center', weight: 800 });
          ctx.fillStyle = '#f29a2e'; ctx.beginPath(); ctx.moveTo(900, 640); ctx.lineTo(930, 660); ctx.lineTo(900, 680); ctx.closePath(); ctx.fill();
          text(ctx, '抗原の刺激', 930, 610, { size: 22, align: 'center', color: COLORS.sub, weight: 800 });
          arrow(ctx, 900, 700, 1080, 700, { p: k * 2, color: COLORS.plasma, w: 7 });
          at(ctx, 1200, 700, 0.6, () => drawCell(ctx, 'plasma', { t, mouth: 0, plain: true }));
          text(ctx, '形質細胞', 1200, 800, { size: 24, align: 'center', weight: 800 });
          for (let i = 0; i < 6; i++) {
            const ph = (t * 0.4 + i / 6) % 1;
            const x = 1300 + ph * 480, y = 700 + Math.sin(i * 2 + ph * 6) * 70;
            withAlpha(ctx, clamp(k * 2 - 1) * Math.sin(ph * Math.PI), () => {
              ctx.strokeStyle = '#ff9f43'; ctx.lineWidth = 7; ctx.lineCap = 'round';
              ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x, y); ctx.lineTo(x - 13, y - 16); ctx.moveTo(x, y); ctx.lineTo(x + 13, y - 16); ctx.stroke();
            });
          }
          text(ctx, '抗体（免疫グロブリン）', 1640, 610, { size: 24, align: 'center', weight: 800, color: '#d97706' });
        });
      }
      if (S.on('rer')) tatoe(ctx, S.p('rer', 0.5), 1260, 520, '抗体の大量生産ライン＝rERがいっぱい', { size: 28 });
    });

    // ───── 肥満細胞 ─────
    const sA = S.vis('mast');
    profile(ctx, S, 'mast', '自由細胞：肥満細胞', 'mast cell', COLORS.mast, sA);
    if (sA > 0) withAlpha(ctx, sA, () => {
      const burst = S.on('mast5') ? clamp(S.since('mast5') / 1.2) * clamp((S.L('mast6') - S.t) / 1) : 0;
      at(ctx, 820, 330, 0.95, () => drawCell(ctx, 'mast', { t, mouth: S.mouth('mast'), emo: S.speaking('mast') ? 'surprised' : 'happy', alarm: S.win('mast', 'fat'), burst }));
      if (S.win('fat', 'mast2')) {
        pop(ctx, S.p('notfat', 0.5), 1300, 380, () => {
          at(ctx, -120, 0, 0.6, () => drawCell(ctx, 'white', { t, plain: true, mouth: 0 }));
          ctx.strokeStyle = COLORS.red; ctx.lineWidth = 16; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-200, -80); ctx.lineTo(-40, 80); ctx.moveTo(-40, -80); ctx.lineTo(-200, 80); ctx.stroke();
          text(ctx, '脂肪をためる細胞ではない', 160, -20, { size: 34, weight: 800, color: COLORS.red, align: 'center' });
          text(ctx, '顆粒でいっぱいの細胞', 160, 40, { size: 34, weight: 800, align: 'center' });
        });
      }
      const step2 = S.vis('mast2', 'mast4');
      if (step2 > 0) withAlpha(ctx, step2, () => {
        items(ctx, S, 1060, 210, [['mast2', 0, '多角形〜楕円形の大きい細胞（20〜30 μm）'], ['mast2', 4, '円形で中央にある核'], ['mast2', 6, '無数の分泌顆粒（200〜800 nm）'], ['mast2', 10, 'AFMG染色で紫色〜赤紫', '#8b3ad6']], { size: 27, gap: 60, maxW: 800 });
        if (S.on('mast3')) {
          ctx.save(); rr(ctx, 660, 500, 1200, 340, 20); ctx.fillStyle = '#fdf2ff'; ctx.fill(); ctx.restore();
          withAlpha(ctx, S.p('mast3', 0.5), () => {
            chip(ctx, 700, 550, 'ヒスタミン histamine', { size: 30, fill: COLORS.mast });
            ['血管平滑筋の弛緩', '血管透過性の上昇', '内臓平滑筋の収縮'].forEach((s, i) => text(ctx, '・' + s, 720, 620 + i * 54, { size: 28, weight: 800 }));
          });
          withAlpha(ctx, S.p('mast3', 0.5, 7), () => {
            chip(ctx, 1300, 550, 'ヘパリン heparin', { size: 30, fill: '#5b6886' });
            text(ctx, '・血液凝固の阻害', 1320, 620, { size: 28, weight: 800 });
          });
        }
      });
      // シグナルの流れ
      const flow = S.vis('mast4', 'mast6');
      if (flow > 0) withAlpha(ctx, flow, () => {
        const steps = ['抗原', 'IgEに結合', 'IgE受容体', 'cAMPに始まる\nシグナル伝達', 'Ca²⁺ 放出', '顆粒の放出\n（調節的分泌経路）'];
        const dl = [0, 1.5, 3.5, 8, 13, 0];
        steps.forEach((s, i) => {
          const lab = i === 5 ? 'mast5' : 'mast4';
          const p = S.p(lab, 0.5, dl[i]);
          const x = 1110 + (i % 3) * 260, y = 260 + Math.floor(i / 3) * 190;
          if (p <= 0) return;
          pop(ctx, p, x, y, () => {
            rr(ctx, -115, -60, 230, 120, 20); ctx.fillStyle = i === 5 ? COLORS.mast : '#fff'; ctx.fill(); ctx.strokeStyle = COLORS.mast; ctx.lineWidth = 4; ctx.stroke();
            text(ctx, s, 0, 2, { size: 24, align: 'center', weight: 800, color: i === 5 ? '#fff' : COLORS.ink, vcenter: true });
          });
          if (i > 0 && i !== 3) arrow(ctx, x - 260 + 118, y, x - 118, y, { p, color: COLORS.mast, w: 5, head: 14 });
          if (i === 3) arrow(ctx, 1110 + 2 * 260, 322, 1110, 198 + 190 - 2, { p, color: COLORS.mast, w: 5, head: 14 });
        });
        if (S.on('mast5', 5)) withAlpha(ctx, S.p('mast5', 0.5, 5), () => {
          ctx.save(); rr(ctx, 660, 600, 1200, 240, 20); ctx.fillStyle = '#fdf2ff'; ctx.fill(); ctx.restore();
          text(ctx, 'ヒスタミン → 血管平滑筋の弛緩・血管透過性の上昇・気道平滑筋の収縮', 1260, 700, { size: 28, align: 'center', weight: 800, maxW: 1140 });
        });
        if (S.on('mast5')) for (let i = 0; i < 24; i++) {
          const k = clamp(S.since('mast5') / 2.5), a = i * 0.9;
          withAlpha(ctx, 1 - k, () => { circle(ctx, 820 + Math.cos(a) * (120 + k * 260), 330 + Math.sin(a) * (110 + k * 200), 8); ctx.fillStyle = '#9b3aa8'; ctx.fill(); });
        }
      });
      const hyp = S.vis('mast6', 'mast7');
      if (hyp > 0) withAlpha(ctx, hyp, () => {
        pop(ctx, S.p('mast6', 0.5), 1360, 330, () => {
          rr(ctx, -470, -150, 940, 300, 24); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = COLORS.mast; ctx.lineWidth = 5; ctx.stroke();
          text(ctx, '即時型過敏症', 0, -95, { size: 40, align: 'center', weight: 800, color: COLORS.mast });
          text(ctx, 'じんましん・アレルギー性鼻炎（局所性）', 0, -20, { size: 30, align: 'center', weight: 800 });
          text(ctx, 'アナフィラキシー（全身性）など', 0, 40, { size: 30, align: 'center', weight: 800 });
          tag(ctx, 450, -120, 'exam', { align: 'right' });
        });
        withAlpha(ctx, S.p('mast6', 0.5, 9), () => chip(ctx, 1360, 580, 'ロイコトリエン（細胞膜脂質から）もヒスタミンと同様の作用', { size: 26, align: 'center', fill: '#5b6886' }));
      });
      if (S.on('mast7')) withAlpha(ctx, S.p('mast7', 0.5), () => {
        items(ctx, S, 1060, 230, [['mast7', 0, '細胞膜にIgE受容体'], ['mast7', 0.8, '由来：骨髄の多能性幹細胞'], ['mast7', 2, '血管から結合組織に出て、増殖・分化する'], ['mast7', 6, '分類：結合組織型と粘膜型', COLORS.mast]], { size: 28, gap: 64 });
        // 4人そろって
        [['fibro', 760], ['macro', 980], ['plasma', 1200], ['mast', 1420]].forEach(([k, x], i) => pop(ctx, S.p('mast7', 0.5, 9 + i * 0.4), x, 690, () => at(ctx, 0, 0, 0.5, () => drawCell(ctx, k, { t: t + i, mouth: 0, emo: 'happy', plain: true }))));
      });
    });

    S.draw(ctx, sapo);
    S.draw(ctx, shun);
  },
};

// キャラクター素材シート：?page=shun|sapo|cells
import { text, COLORS, at, W, H } from './core.js';
import { drawShun, drawSapo, drawCell, nameplate } from './chars.js';
const ctx = document.getElementById('c').getContext('2d');
const page = new URLSearchParams(location.search).get('page') || 'shun';
async function main() {
  await Promise.all([400, 700, 800].map((w) => document.fonts.load(`${w} 40px MR`, '支持組織')));
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#eaf5ff'); g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (page === 'shun' || page === 'sapo') {
    const items = page === 'shun'
      ? [['normal', 'idle', 0], ['happy', 'open', 0.6], ['surprised', 'surprise', 0.5], ['confused', 'shrug', 0], ['think', 'think', 0], ['panic', 'panic', 0.4], ['laugh', 'cheer', 0.7], ['wink', 'point', 0.3]]
      : [['happy', 'idle', 0], ['happy', 'open', 0.6], ['wink', 'wave', 0.3], ['point', 'point', 0.5], ['wag', 'wag', 0.3], ['surprised', 'surprise', 0.5], ['laugh', 'cheer', 0.7], ['think', 'think', 0]];
    text(ctx, page === 'shun' ? '主人公：蒼井 俊（あおい しゅん）— 表情とポーズ' : '案内役：サポちゃん — 表情とポーズ', 40, 50, { size: 40, weight: 800 });
    items.forEach(([emo, pose, m], i) => {
      const x = 130 + i * 236, y = page === 'shun' ? 900 : 760;
      at(ctx, x, y, page === 'shun' ? 1.12 : 1.25, () => (page === 'shun' ? drawShun : drawSapo)(ctx, { t: 1.3 + i, emo, pose, mouth: m, face: i % 2 ? -1 : 1 }));
      text(ctx, `${emo} / ${pose}`, x, 1030, { size: 24, align: 'center', color: COLORS.sub });
    });
  } else {
    const list = [['fibro', '線維芽細胞', '建築職人', COLORS.fibro], ['macro', 'マクロファージ', '警備員', COLORS.macro], ['plasma', '形質細胞', '抗体工場の工場長', COLORS.plasma],
      ['mast', '肥満細胞', '緊急警報係', COLORS.mast], ['collagen', '膠原線維', 'ロープ', COLORS.collagen], ['reticular', '細網線維', '網', COLORS.reticular],
      ['elastic', '弾性線維', 'バネ', COLORS.elastic], ['white', '白色脂肪細胞', 'タンク', COLORS.white], ['brown', '褐色脂肪細胞', 'ヒーター', COLORS.brown],
      ['bone', '骨', '', '#a99a78'], ['cartilage', '軟骨', '', '#3f86c9'], ['blood', '血液・リンパ', '', '#c33']];
    text(ctx, '細胞・線維などのキャラクター（たとえ役の小物つき）', 40, 50, { size: 40, weight: 800 });
    list.forEach(([k, n, sub, c], i) => {
      const x = 170 + (i % 6) * 316, y = 300 + Math.floor(i / 6) * 470;
      at(ctx, x, y, 0.85, () => drawCell(ctx, k, { t: 1 + i, mouth: 0.2, alarm: true, fire: true }));
      nameplate(ctx, x, y + 170, n, sub, c);
    });
  }
  window.ready = true;
}
main();

// 素材の書き出し用：?who=shun&emo=happy&pose=open（透過PNG）／?bg=city（1920×1080 の背景）
import { at } from './core.js';
import { drawShun, drawSapo, drawCell } from './chars.js';
import * as BG from './bg.js';
const q = new URLSearchParams(location.search);
const c = document.getElementById('c'), ctx = c.getContext('2d');
await Promise.all([700, 800].map((w) => document.fonts.load(`${w} 40px MR`, '支持組織')));
if (q.get('bg')) {
  c.width = 1920; c.height = 1080;
  const f = BG[q.get('bg')];
  f(ctx, +(q.get('t') || 3), { cam: 200, warm: q.get('warm') ? 1 : 0 });
} else {
  const who = q.get('who'), o = { t: 1.2, emo: q.get('emo') || 'normal', pose: q.get('pose') || 'idle', mouth: +(q.get('mouth') || 0), face: 1, blink: 0, alarm: true, fire: true };
  ctx.clearRect(0, 0, 900, 900);
  if (who === 'shun') at(ctx, 450, 860, 1.12, () => drawShun(ctx, o));
  else if (who === 'sapo') at(ctx, 450, 860, 1.7, () => drawSapo(ctx, o));
  else at(ctx, 450, 470, 1.5, () => drawCell(ctx, who, { ...o, emo: 'happy', noBob: true }));
}
window.ready = true;

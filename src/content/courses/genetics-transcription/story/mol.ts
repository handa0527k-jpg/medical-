/**
 * Molecular pictures for the "実際の細胞では" inserts, shared by several scenes. Conventions (same as the
 * mechanism animations): non-template strand yellow on top (5' left → 3' right), template strand blue below
 * (3' left → 5' right), RNA pink, growing 5' → 3' to the right; the polymerase moves left → right.
 */
import { CL, L, g } from '../../../../engine/story/kit';
import { COL, GOTHIC, baseTile, endTag, plate, polymerase, txt, arrowP } from './sets';

export interface BubbleOpt {
  /** y of the top / bottom strand outside the bubble */
  y?: number;
  /** strand x range */
  x0?: number; x1?: number;
  /** bubble half width and opening (0 closed … 1 open) */
  open?: number;
  /** polymerase label, alpha */
  pol?: string; polA?: number;
  /** show 5'/3' labels */
  ends?: number;
  /** strand labels */
  names?: number;
  /** RNA alpha */
  rnaA?: number;
}

/**
 * The transcription bubble at polymerase position bx: DNA opened around it, RNA paired with the template inside
 * and peeling off up-left, its 5' end leading. rnaLen = length of the free RNA (px).
 */
export function bubble(bx: number, rnaLen: number, o: BubbleOpt = {}) {
  const y = o.y ?? 320, x0 = o.x0 ?? 80, x1 = o.x1 ?? 1200, open = CL(o.open ?? 1), gap = 66;
  const yt = y, yb = y + gap, hw = 120;
  const top = (x: number) => { const k = Math.max(0, 1 - Math.abs(x - bx) / hw); return yt - open * 70 * Math.sin((k * Math.PI) / 2) ** 2; };
  const bot = (x: number) => { const k = Math.max(0, 1 - Math.abs(x - bx) / hw); return yb + open * 40 * Math.sin((k * Math.PI) / 2) ** 2; };
  const line = (f: (x: number) => number, col: string) => { g.strokeStyle = col; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); for (let x = x0; x <= x1; x += 6) { if (x === x0) g.moveTo(x, f(x)); else g.lineTo(x, f(x)); } g.stroke(); };
  // base-pair rungs where the DNA is closed
  for (let x = x0 + 10; x < x1; x += 22) { const k = Math.max(0, 1 - Math.abs(x - bx) / hw); if (k * open > 0.08) continue; g.strokeStyle = 'rgba(31,42,58,.28)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, top(x) + 6); g.lineTo(x, bot(x) - 6); g.stroke(); }
  line(top, COL.nontemp); line(bot, COL.temp);
  // RNA: hybrid on the template inside the bubble, then up-left out of the enzyme
  const ra = o.rnaA ?? 1;
  if (ra > 0 && open > 0.3) {
    g.save(); g.globalAlpha *= ra;
    const hx1 = bx + 36, hx0 = bx - 60;
    g.strokeStyle = COL.rna; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath();
    g.moveTo(hx1, bot(hx1) - 18);
    for (let x = hx1; x >= hx0; x -= 6) g.lineTo(x, bot(x) - 18);
    // free part: a smooth curve up-left, length rnaLen
    let px = hx0, py = bot(hx0) - 18, ang = Math.PI * 1.08, len = 0;
    const pts: [number, number][] = [];
    while (len < rnaLen) { ang += 0.0026; px += Math.cos(ang) * 4; py += Math.sin(ang) * 4 - 1.6; len += 4; pts.push([px, py]); g.lineTo(px, py); }
    g.stroke();
    // RNA rungs to the template inside the hybrid
    for (let x = hx0 + 6; x < hx1; x += 16) { g.strokeStyle = 'rgba(194,24,91,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, bot(x) - 12); g.lineTo(x, bot(x) - 4); g.stroke(); }
    const tip = pts.length ? pts[pts.length - 1] : [hx0, bot(hx0) - 18];
    if ((o.ends ?? 1) > 0) { endTag("5'", tip[0] - 22, tip[1] - 6, '#c2185b', o.ends ?? 1); endTag("3'", hx1 + 26, bot(hx1) - 34, '#c2185b', o.ends ?? 1); }
    g.restore();
  }
  polymerase(bx - 4, y + 30, 150, 110, (o.polA ?? 1) * 0.95, o.pol ?? 'RNAポリメラーゼ', -1);
  const ea = o.ends ?? 1;
  if (ea > 0) {
    endTag("5'", x0 - 26, yt, '#9a7a10', ea); endTag("3'", x1 + 26, yt, '#9a7a10', ea);
    endTag("3'", x0 - 26, yb, '#1f6ea8', ea); endTag("5'", x1 + 26, yb, '#1f6ea8', ea);
  }
  const na = o.names ?? 0;
  if (na > 0) {
    plate('非鋳型鎖', x0 + 70, yt - 34, 18, '#5a4508', 'rgba(255,240,190,.95)', na, 'left');
    plate('鋳型鎖（3\'→5\'に読む）', x0 + 70, yb + 46, 18, '#ffffff', '#1f6ea8', na, 'left');
  }
  return { top, bot };
}

/** a row of DNA letters on a strand (template reading) */
export function letterRow(seq: string, x0: number, y: number, step: number, s: number, a = 1, hl = -1) {
  [...seq].forEach((ch, i) => baseTile(ch, x0 + i * step, y, s, a, i === hl ? 1 : 0));
}

/** "転写の方向 →" above a picture */
export function dirArrow(x: number, y: number, a: number, label = '転写の方向（RNAは5\'→3\'に伸びる）') {
  arrowP(x - 140, y, x + 140, y, '#c2185b', a, 5);
  txt(label, x, y - 16, 20, '#c2185b', a, 'center', GOTHIC, 800);
}
export { L };

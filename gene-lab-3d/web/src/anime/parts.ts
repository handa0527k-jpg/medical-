/**
 * 2D anime toolkit for the lecture films: a 1920x1080 stage of absolutely
 * placed sprites (HTML/SVG), chibi characters whose eyes, mouth, arms and legs
 * move with the clock, and the props of the restaurant story. Everything is
 * set from the time t only, so a frame can be drawn in any order (render mode).
 */
export const W = 1920, H = 1080;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
export const ease = (x: number) => { const t = clamp01(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const ramp = (t: number, a: number, d = 0.6) => ease((t - a) / d);
export const win = (t: number, a: number, b: number, f = 0.35) => Math.min(ramp(t, a - f, f), 1 - ramp(t, b, f));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** springy pop-in (0 -> overshoot -> 1) */
export const pop = (t: number, a: number, d = 0.45) => {
  const x = clamp01((t - a) / d);
  return x <= 0 ? 0 : 1 + Math.sin(x * Math.PI) * 0.18 * (1 - x) - (1 - x) * (1 - x) * (1 - x) * 0;
};

// ---------------------------------------------------------------- sprites

export interface Pose { x?: number; y?: number; s?: number; r?: number; o?: number; flip?: boolean; sx?: number; sy?: number }

/** an absolutely placed element; (x, y) is its centre in stage pixels */
export class Sprite {
  readonly el: HTMLDivElement;
  private last = '';
  private pose: Pose = {};
  constructor(parent: HTMLElement, html: string, readonly w: number, readonly h: number, cls = '') {
    this.el = document.createElement('div');
    this.el.className = 'sp ' + cls;
    this.el.style.width = w + 'px';
    this.el.style.height = h + 'px';
    this.el.innerHTML = html;
    parent.append(this.el);
  }
  set(q: Pose) {
    const p = (this.pose = { ...this.pose, ...q });
    const o = p.o ?? 1;
    const vis = o > 0.002;
    const sx = (p.s ?? 1) * (p.sx ?? 1) * (p.flip ? -1 : 1), sy = (p.s ?? 1) * (p.sy ?? 1);
    const tr = `translate(${(p.x ?? 0) - this.w / 2}px,${(p.y ?? 0) - this.h / 2}px) rotate(${p.r ?? 0}deg) scale(${sx},${sy})`;
    const key = tr + o.toFixed(3) + vis;
    if (key === this.last) return this;
    this.last = key;
    this.el.style.transform = tr;
    this.el.style.opacity = String(clamp01(o));
    this.el.style.display = vis ? '' : 'none';
    return this;
  }
  hide() { return this.set({ o: 0 }); }
  html(h: string) { if (this.el.dataset.h !== h) { this.el.innerHTML = h; this.el.dataset.h = h; } return this; }
  q<T extends Element = SVGElement>(sel: string) { return this.el.querySelector(sel) as T; }
}

/** a layer that holds one scene's sprites and can be faded as a whole */
export class Layer {
  readonly el: HTMLDivElement;
  constructor(parent: HTMLElement, cls = '') {
    this.el = document.createElement('div');
    this.el.className = 'layer ' + cls;
    parent.append(this.el);
  }
  show(o: number) {
    this.el.style.opacity = String(clamp01(o));
    this.el.style.display = o > 0.002 ? '' : 'none';
  }
  sprite(html: string, w: number, h: number, cls = '') { return new Sprite(this.el, html, w, h, cls); }
}

// ---------------------------------------------------------------- characters

export interface CharaOpts {
  body: string; // apron / clothes colour
  skin?: string;
  hair?: string;
  hat?: 'chef' | 'cap' | 'band' | 'crown' | 'beret' | 'helmet' | 'none';
  hatColor?: string;
  item?: 'pen' | 'flag' | 'bell' | 'broom' | 'scissors' | 'mega' | 'letter' | 'knife' | 'glass' | 'loupe' | 'cloth' | 'cart' | 'none';
  badge?: string;
  badgeColor?: string;
  tail?: boolean; // CTD ribbon on the back
}

export interface CharaState { talk?: boolean; walk?: number; armL?: number; armR?: number; happy?: boolean; blinkSeed?: number; surprise?: boolean; sad?: boolean }

/** a chibi character (SVG, 200 x 260 design units) */
export class Chara extends Sprite {
  private mouth: SVGPathElement;
  private eyes: SVGGElement;
  private armL: SVGGElement;
  private armR: SVGGElement;
  private legL: SVGRectElement;
  private legR: SVGRectElement;
  private body: SVGGElement;
  private tailP: SVGGElement | null;
  constructor(parent: HTMLElement | Layer, readonly opts: CharaOpts, size = 200) {
    super(parent instanceof Layer ? parent.el : parent, charaSvg(opts), size, size * 1.3, 'chara');
    this.mouth = this.q('.mouth') as SVGPathElement;
    this.eyes = this.q('.eyes') as SVGGElement;
    this.armL = this.q('.armL') as SVGGElement;
    this.armR = this.q('.armR') as SVGGElement;
    this.legL = this.q('.legL') as SVGRectElement;
    this.legR = this.q('.legR') as SVGRectElement;
    this.body = this.q('.bodyg') as SVGGElement;
    this.tailP = this.q('.ctdP');
  }
  /** pose the character at time t */
  act(t: number, p: Pose, st: CharaState = {}) {
    const seed = st.blinkSeed ?? 0;
    const walk = st.walk ?? 0;
    const bob = walk ? Math.abs(Math.sin(t * 9 + seed)) * 10 * walk : Math.sin(t * 2.2 + seed) * 2.5;
    this.set({ ...p, y: (p.y ?? 0) - bob });
    // blink every ~3.3 s
    const ph = (t * 0.3 + seed * 0.17) % 1;
    const blink = ph > 0.965 ? 0.1 : 1;
    this.eyes.setAttribute('transform', `translate(0 ${92 * (1 - blink)}) scale(1 ${blink})`);
    // mouth: open/close while talking
    let m: string;
    if (st.surprise) m = 'M92 122 q8 -10 16 0 q-8 12 -16 0 z';
    else if (st.talk) { const o = 3 + Math.abs(Math.sin(t * 17 + seed)) * 11; m = `M86 118 q14 ${o + 4} 28 0 q-14 ${-2} -28 0 z`; }
    else if (st.sad) m = 'M88 126 q12 -8 24 0';
    else m = st.happy === false ? 'M90 120 h20' : 'M86 117 q14 12 28 0';
    this.mouth.setAttribute('d', m);
    const sw = walk ? Math.sin(t * 9 + seed) * 28 * walk : 0;
    this.armL.setAttribute('transform', `rotate(${(st.armL ?? 0) + sw} 62 160)`);
    this.armR.setAttribute('transform', `rotate(${-(st.armR ?? 0) - sw} 138 160)`);
    this.legL.setAttribute('transform', `rotate(${sw * 0.6} 85 228)`);
    this.legR.setAttribute('transform', `rotate(${-sw * 0.6} 115 228)`);
    this.body.setAttribute('transform', `rotate(${walk ? Math.sin(t * 9 + seed) * 2 : 0} 100 200)`);
    return this;
  }
  /** show the phosphates on the CTD tail (0..3) */
  ctd(n: number) { if (this.tailP) this.tailP.setAttribute('opacity', String(clamp01(n))); }
}

function hatSvg(o: CharaOpts) {
  const c = o.hatColor ?? '#ffffff';
  switch (o.hat) {
    case 'chef': return `<g><rect x="62" y="22" width="76" height="26" rx="6" fill="${c}" stroke="#2b2b3a" stroke-width="4"/><circle cx="72" cy="20" r="18" fill="${c}" stroke="#2b2b3a" stroke-width="4"/><circle cx="100" cy="10" r="22" fill="${c}" stroke="#2b2b3a" stroke-width="4"/><circle cx="128" cy="20" r="18" fill="${c}" stroke="#2b2b3a" stroke-width="4"/><rect x="64" y="26" width="72" height="18" fill="${c}"/></g>`;
    case 'cap': return `<path d="M44 66 q56 -60 112 0 z" fill="${c}" stroke="#2b2b3a" stroke-width="4"/><path d="M140 62 q30 2 34 12 l-40 -2 z" fill="${c}" stroke="#2b2b3a" stroke-width="4"/>`;
    case 'band': return `<rect x="40" y="52" width="120" height="16" rx="8" fill="${c}" stroke="#2b2b3a" stroke-width="4"/><path d="M158 60 l20 -8 l-4 18 z" fill="${c}" stroke="#2b2b3a" stroke-width="3"/>`;
    case 'crown': return `<path d="M58 50 l10 -36 l20 22 l12 -28 l12 28 l20 -22 l10 36 z" fill="${c}" stroke="#2b2b3a" stroke-width="4" stroke-linejoin="round"/>`;
    case 'beret': return `<ellipse cx="96" cy="40" rx="62" ry="22" fill="${c}" stroke="#2b2b3a" stroke-width="4"/><circle cx="96" cy="18" r="6" fill="${c}" stroke="#2b2b3a" stroke-width="3"/>`;
    case 'helmet': return `<path d="M40 70 q60 -84 120 0 z" fill="${c}" stroke="#2b2b3a" stroke-width="4"/><rect x="34" y="64" width="132" height="12" rx="6" fill="${c}" stroke="#2b2b3a" stroke-width="4"/>`;
    default: return '';
  }
}

function itemSvg(o: CharaOpts) {
  // drawn in the right hand at (160, 196)
  switch (o.item) {
    case 'pen': return `<g transform="translate(160 196) rotate(-30)"><rect x="-5" y="-46" width="10" height="44" rx="3" fill="#ffd166" stroke="#2b2b3a" stroke-width="3"/><path d="M-5 -2 l5 12 l5 -12 z" fill="#2b2b3a"/></g>`;
    case 'flag': return `<g transform="translate(160 196)"><rect x="-3" y="-80" width="6" height="84" fill="#8d6e63" stroke="#2b2b3a" stroke-width="2"/><path d="M3 -80 l44 12 l-44 14 z" fill="#ff6b6b" stroke="#2b2b3a" stroke-width="3"/></g>`;
    case 'bell': return `<g transform="translate(160 192)"><path d="M-18 4 q0 -34 18 -34 q18 0 18 34 z" fill="#ffd166" stroke="#2b2b3a" stroke-width="3"/><circle cx="0" cy="8" r="5" fill="#2b2b3a"/></g>`;
    case 'broom': return `<g transform="translate(160 196) rotate(20)"><rect x="-3" y="-70" width="6" height="80" fill="#a1887f" stroke="#2b2b3a" stroke-width="2"/><path d="M-16 10 h32 l6 28 h-44 z" fill="#ffcc80" stroke="#2b2b3a" stroke-width="3"/></g>`;
    case 'scissors': return `<g transform="translate(160 190) rotate(-20)"><circle cx="-8" cy="10" r="8" fill="none" stroke="#e84393" stroke-width="5"/><circle cx="8" cy="10" r="8" fill="none" stroke="#e84393" stroke-width="5"/><path d="M-4 2 l14 -40 M4 2 l-14 -40" stroke="#90a4ae" stroke-width="6" stroke-linecap="round"/></g>`;
    case 'mega': return `<g transform="translate(160 186)"><path d="M-6 -10 l40 -18 v48 l-40 -18 z" fill="#4fc3f7" stroke="#2b2b3a" stroke-width="3"/><rect x="-14" y="-12" width="10" height="24" rx="3" fill="#0288d1" stroke="#2b2b3a" stroke-width="3"/></g>`;
    case 'letter': return `<g transform="translate(162 190)"><rect x="-22" y="-16" width="44" height="30" rx="4" fill="#fff" stroke="#2b2b3a" stroke-width="3"/><path d="M-22 -16 l22 16 l22 -16" fill="none" stroke="#2b2b3a" stroke-width="3"/></g>`;
    case 'knife': return `<g transform="translate(160 196) rotate(-40)"><rect x="-4" y="-8" width="8" height="22" rx="3" fill="#6d4c41"/><path d="M-6 -8 h12 l-2 -46 q-4 -6 -10 0 z" fill="#cfd8dc" stroke="#2b2b3a" stroke-width="3"/></g>`;
    case 'glass': return `<g transform="translate(162 186)"><path d="M-14 -24 h28 l-4 40 h-20 z" fill="#ffffff" stroke="#2b2b3a" stroke-width="3"/><path d="M-12 -12 h24 l-3 28 h-18 z" fill="#fff3e0"/></g>`;
    case 'loupe': return `<g transform="translate(166 182)"><circle cx="0" cy="-10" r="18" fill="#e0f7fa" fill-opacity=".6" stroke="#2b2b3a" stroke-width="5"/><rect x="-4" y="6" width="8" height="26" rx="3" fill="#6d4c41" transform="rotate(-30 0 6)"/></g>`;
    case 'cloth': return `<g transform="translate(162 196)"><path d="M-18 -10 q18 -14 36 0 l-6 24 q-12 6 -24 0 z" fill="#b2ebf2" stroke="#2b2b3a" stroke-width="3"/></g>`;
    default: return '';
  }
}

export function charaSvg(o: CharaOpts) {
  const skin = o.skin ?? '#ffe3cc', hair = o.hair ?? '#4a3428', ink = '#2b2b3a';
  const badge = o.badge ? `<circle cx="100" cy="190" r="20" fill="${o.badgeColor ?? '#ffffff'}" stroke="${ink}" stroke-width="4"/><text x="100" y="${o.badge.length > 2 ? 197 : 200}" text-anchor="middle" font-size="${o.badge.length > 2 ? 15 : o.badge.length > 1 ? 20 : 27}" font-weight="900" fill="${ink}">${o.badge}</text>` : '';
  const tail = o.tail ? `<g class="ctd"><path d="M58 210 q-40 10 -52 40" fill="none" stroke="#b39ddb" stroke-width="10" stroke-linecap="round"/><g class="ctdP" opacity="0"><circle cx="30" cy="226" r="11" fill="#ffd54f" stroke="${ink}" stroke-width="3"/><text x="30" y="231" text-anchor="middle" font-size="13" font-weight="900">P</text><circle cx="12" cy="246" r="11" fill="#ffd54f" stroke="${ink}" stroke-width="3"/><text x="12" y="251" text-anchor="middle" font-size="13" font-weight="900">P</text></g></g>` : '';
  return `<svg viewBox="0 0 200 260" width="100%" height="100%" overflow="visible">
  <ellipse cx="100" cy="252" rx="56" ry="8" fill="#000" opacity=".18"/>
  ${tail}
  <rect class="legL" x="74" y="222" width="22" height="30" rx="10" fill="#5d4f72" stroke="${ink}" stroke-width="4"/>
  <rect class="legR" x="104" y="222" width="22" height="30" rx="10" fill="#5d4f72" stroke="${ink}" stroke-width="4"/>
  <g class="bodyg">
    <g class="armL"><path d="M62 160 q-26 18 -22 46" fill="none" stroke="${ink}" stroke-width="18" stroke-linecap="round"/><path d="M62 160 q-26 18 -22 46" fill="none" stroke="${o.body}" stroke-width="11" stroke-linecap="round"/><circle cx="40" cy="206" r="10" fill="${skin}" stroke="${ink}" stroke-width="4"/></g>
    <path d="M58 150 q42 -18 84 0 l8 76 q-50 12 -100 0 z" fill="${o.body}" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M74 158 q26 -8 52 0 l4 62 q-30 6 -60 0 z" fill="#ffffff" opacity=".55"/>
    ${badge}
    <g class="armR"><path d="M138 160 q26 18 22 36" fill="none" stroke="${ink}" stroke-width="18" stroke-linecap="round"/><path d="M138 160 q26 18 22 36" fill="none" stroke="${o.body}" stroke-width="11" stroke-linecap="round"/>${itemSvg(o)}<circle cx="160" cy="196" r="10" fill="${skin}" stroke="${ink}" stroke-width="4"/></g>
    <circle cx="100" cy="88" r="62" fill="${skin}" stroke="${ink}" stroke-width="5"/>
    <path d="M40 84 q4 -56 60 -58 q56 2 60 58 q-14 -22 -34 -28 q-20 12 -54 6 q-18 6 -32 22 z" fill="${hair}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    <g class="eyes"><ellipse cx="78" cy="94" rx="8" ry="11" fill="${ink}"/><ellipse cx="122" cy="94" rx="8" ry="11" fill="${ink}"/><circle cx="81" cy="89" r="3.2" fill="#fff"/><circle cx="125" cy="89" r="3.2" fill="#fff"/></g>
    <ellipse cx="64" cy="112" rx="10" ry="6" fill="#ff8fab" opacity=".55"/><ellipse cx="136" cy="112" rx="10" ry="6" fill="#ff8fab" opacity=".55"/>
    <path class="mouth" d="M86 117 q14 12 28 0" fill="#c2185b" stroke="${ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${hatSvg(o)}
  </g>
</svg>`;
}

// ---------------------------------------------------------------- props

const INK = '#2b2b3a';

/** the precious recipe book (closed or open); `glow` adds a golden aura */
export function bookSvg(open = true, glow = false) {
  const aura = glow ? `<ellipse cx="160" cy="110" rx="170" ry="120" fill="url(#ga)" />` : '';
  const defs = `<defs><radialGradient id="ga"><stop offset="0" stop-color="#ffe082" stop-opacity=".9"/><stop offset="1" stop-color="#ffe082" stop-opacity="0"/></radialGradient></defs>`;
  if (!open) return `<svg viewBox="0 0 320 220" width="100%" height="100%" overflow="visible">${defs}${aura}<rect x="70" y="30" width="180" height="160" rx="12" fill="#8e2430" stroke="${INK}" stroke-width="6"/><rect x="70" y="30" width="26" height="160" rx="8" fill="#6d1a24"/><rect x="118" y="70" width="110" height="40" rx="8" fill="#ffd166" stroke="${INK}" stroke-width="4"/><text x="173" y="98" text-anchor="middle" font-size="22" font-weight="900" fill="${INK}">秘伝</text></svg>`;
  return `<svg viewBox="0 0 320 220" width="100%" height="100%" overflow="visible">${defs}${aura}<path d="M20 40 q70 -20 140 6 v150 q-70 -24 -140 -6 z" fill="#fffaf0" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M300 40 q-70 -20 -140 6 v150 q70 -24 140 -6 z" fill="#fff4e0" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M40 ${72 + i * 22} q50 -8 100 4" stroke="#b0a090" stroke-width="5" fill="none"/><path d="M180 ${76 + i * 22} q50 -12 100 -4" stroke="#b0a090" stroke-width="5" fill="none"/>`).join('')}</svg>`;
}

/** a memo sheet with text */
export function memoSvg(text: string, w = 260, color = '#fffef6') {
  return `<div class="memo" style="width:${w}px;background:${color}"><span>${text}</span></div>`;
}

export function stickySvg(text = 'ここから→', color = '#ffe066') {
  return `<div class="sticky" style="background:${color}">${text}</div>`;
}

export function vaultSvg(open = 0) {
  return `<svg viewBox="0 0 300 300" width="100%" height="100%"><rect x="10" y="10" width="280" height="280" rx="24" fill="#7f8c9a" stroke="${INK}" stroke-width="8"/><g transform="rotate(${open * -100} 150 150)"><circle cx="150" cy="150" r="110" fill="#b0bec5" stroke="${INK}" stroke-width="8"/>${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="146" y="70" width="8" height="40" rx="4" fill="${INK}" transform="rotate(${a} 150 150)"/>`).join('')}<circle cx="150" cy="150" r="22" fill="#ffd166" stroke="${INK}" stroke-width="6"/></g></svg>`;
}

export function kitchenSvg() {
  return `<svg viewBox="0 0 420 300" width="100%" height="100%"><rect x="10" y="150" width="400" height="140" rx="14" fill="#cfd8dc" stroke="${INK}" stroke-width="6"/><rect x="10" y="150" width="400" height="26" rx="10" fill="#eceff1" stroke="${INK}" stroke-width="6"/><ellipse cx="120" cy="140" rx="60" ry="18" fill="#455a64" stroke="${INK}" stroke-width="5"/><rect x="66" y="96" width="108" height="46" rx="10" fill="#607d8b" stroke="${INK}" stroke-width="5"/><ellipse cx="300" cy="146" rx="56" ry="14" fill="#8d6e63" stroke="${INK}" stroke-width="5"/><path d="M90 86 q-10 -24 6 -40 M120 82 q-12 -26 4 -44 M150 86 q-10 -24 6 -40" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"/><circle cx="60" cy="230" r="16" fill="#ff7043" stroke="${INK}" stroke-width="4"/><circle cx="110" cy="230" r="16" fill="#ff7043" stroke="${INK}" stroke-width="4"/></svg>`;
}

export function dishSvg(color = '#ff8a65') {
  return `<svg viewBox="0 0 120 70" width="100%" height="100%"><ellipse cx="60" cy="46" rx="56" ry="18" fill="#fff" stroke="${INK}" stroke-width="5"/><ellipse cx="60" cy="38" rx="34" ry="16" fill="${color}" stroke="${INK}" stroke-width="4"/><circle cx="50" cy="32" r="6" fill="#aed581"/><path d="M50 14 q-6 -10 2 -14 M66 14 q-6 -10 2 -14" stroke="#bbb" stroke-width="3" fill="none"/></svg>`;
}

export function doorSvg(open = 0, label = '金庫室のドア') {
  return `<svg viewBox="0 0 220 320" width="100%" height="100%"><rect x="10" y="10" width="200" height="300" rx="14" fill="#5d4037" stroke="${INK}" stroke-width="7"/><rect x="26" y="26" width="168" height="270" rx="8" fill="#1b1b28"/><g transform="translate(26 26) scale(${1 - open * 0.85} 1)"><rect x="0" y="0" width="168" height="270" rx="8" fill="#8d6e63" stroke="${INK}" stroke-width="6"/><rect x="18" y="20" width="132" height="100" rx="8" fill="#a1887f"/><rect x="18" y="140" width="132" height="110" rx="8" fill="#a1887f"/><circle cx="146" cy="136" r="10" fill="#ffd166" stroke="${INK}" stroke-width="4"/></g><text x="110" y="-8" text-anchor="middle" font-size="26" font-weight="900" fill="#fff">${label}</text></svg>`;
}

export function yataiSvg() {
  return `<svg viewBox="0 0 700 460" width="100%" height="100%"><rect x="40" y="180" width="620" height="230" rx="14" fill="#a1683a" stroke="${INK}" stroke-width="8"/><rect x="40" y="370" width="620" height="40" fill="#7b4a26"/><path d="M20 120 h660 l-30 60 h-600 z" fill="#c62828" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${70 + i * 95}" y="180" width="80" height="80" fill="#f5f5f5" stroke="${INK}" stroke-width="5"/>`).join('')}<text x="350" y="236" text-anchor="middle" font-size="44" font-weight="900" fill="${INK}" letter-spacing="40">屋　台</text><circle cx="70" cy="200" r="30" fill="#ff8a65" stroke="${INK}" stroke-width="5"/><circle cx="630" cy="200" r="30" fill="#ff8a65" stroke="${INK}" stroke-width="5"/><circle cx="140" cy="430" r="28" fill="#5d4037" stroke="${INK}" stroke-width="6"/><circle cx="560" cy="430" r="28" fill="#5d4037" stroke="${INK}" stroke-width="6"/></svg>`;
}

export function honten() {
  return `<svg viewBox="0 0 900 520" width="100%" height="100%"><rect x="60" y="120" width="780" height="380" rx="12" fill="#fff3e0" stroke="${INK}" stroke-width="8"/><path d="M30 130 L450 20 L870 130 z" fill="#8e2430" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><rect x="330" y="150" width="240" height="70" rx="12" fill="#ffd166" stroke="${INK}" stroke-width="6"/><text x="450" y="200" text-anchor="middle" font-size="46" font-weight="900" fill="${INK}">本　店</text>${[0, 1, 2, 3].map((i) => `<rect x="${110 + i * 190}" y="250" width="110" height="110" rx="8" fill="#81d4fa" stroke="${INK}" stroke-width="6"/>`).join('')}<rect x="400" y="380" width="100" height="120" rx="8" fill="#8d6e63" stroke="${INK}" stroke-width="6"/></svg>`;
}

/** a long two-row "page strip" of a recipe book: top = plain page, bottom = mirror page */
export function stripHtml(top: string, bottom: string, cls = '') {
  const cells = (s: string, mir: boolean) => [...s].map((c) => `<i class="${mir ? 'mir' : ''}">${c}</i>`).join('');
  return `<div class="strip ${cls}"><div class="srow top">${cells(top, false)}</div><div class="srow bot">${cells(bottom, true)}</div></div>`;
}

export function panel(title: string, rows: [string, string][], cls = '') {
  return `<div class="tpanel ${cls}"><h3>${title}</h3>${rows.map(([a, b], i) => `<div class="tr" data-i="${i}"><span class="a">${a}</span><span class="arr">→</span><span class="b">${b}</span></div>`).join('')}</div>`;
}

export function bannerHtml(text: string) {
  return `<div class="hito"><span class="star">★</span><b>一言で</b><span class="txt">${text}</span></div>`;
}

export function sparkleSvg(color = '#ffe066') {
  return `<svg viewBox="0 0 40 40" width="100%" height="100%"><path d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z" fill="${color}"/></svg>`;
}

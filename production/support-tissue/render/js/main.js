// 映像の本体。timeline.json（声の実測時刻）を読み、シーンの絵・キャラクター・字幕・タイトル・転換を1コマずつ描く。
//   index.html?scene=s01&t=12      … その時刻の静止画
//   index.html?scene=s01&play=1    … 音つきでプレビュー再生（build/mix/s01.wav）
//   window.renderFrames(scene, [t...], q) … 書き出し用（JPEG の dataURL）
import { W, H, clamp, lerp, ease, easeOut, back, rr, text, measure, withAlpha, at, COLORS, shadow, noShadow, FONT } from './core.js';
import { drawShun, drawSapo, drawCell, blinkAt, EMO_POSE } from './chars.js';

const SCENES = {};
const cvs = document.getElementById('c');
const ctx = cvs.getContext('2d');
let TL = null;

const SPK_COLOR = { shun: COLORS.shun, sapo: COLORS.sapo, nar: COLORS.nar, fibro: COLORS.fibro, macro: COLORS.macro, plasma: COLORS.plasma, mast: COLORS.mast,
  collagen: COLORS.collagen, reticular: COLORS.reticular, elastic: COLORS.elastic, white: '#c79a1c', brown: COLORS.brown };
const SEED = { shun: 1, sapo: 4, fibro: 7, macro: 9, plasma: 11, mast: 13, collagen: 15, reticular: 17, elastic: 19, white: 21, brown: 23 };

// ───────── シーンの時刻ヘルパー ─────────
export class Scene {
  constructor(data, t) {
    this.d = data; this.t = t; this.dur = data.dur; this.id = data.id; this.quiz = TL.quiz;
    this._warned = new Set();
  }
  L(label) {
    if (typeof label === 'number') return label;
    const v = this.d.labels[label];
    if (v === undefined) { if (!this._warned.has(label)) { console.warn(`[${this.id}] no label ${label}`); this._warned.add(label); } return Infinity; }
    return v;
  }
  end(label) { const ln = this.d.lines.find((l) => l.label === label); return ln ? ln.t1 : Infinity; }
  since(label) { return this.t - this.L(label); }
  p(label, d = 0.8, off = 0) { return clamp((this.t - this.L(label) - off) / d); }
  e(label, d = 0.8, off = 0) { return ease(this.p(label, d, off)); }
  on(label, off = 0) { return this.t >= this.L(label) + off; }
  win(a, b) { return this.t >= this.L(a) && this.t < this.L(b); }
  // a〜b の間だけ見える（前後に d 秒でフェード）
  vis(a, b, d = 0.5) { const ta = this.L(a), tb = b === undefined ? Infinity : this.L(b); return clamp((this.t - ta) / d) * clamp((tb - this.t) / d); }
  line() { let cur = null; for (const l of this.d.lines) { if (l.t0 <= this.t + 0.05) cur = l; else break; } return cur; }
  speaking(who) { return this.d.lines.some((l) => l.who === who && this.t >= l.t0 && this.t < l.t1); }
  mouth(who) {
    for (const l of this.d.lines) {
      if (l.who !== who || this.t < l.t0 - 0.05 || this.t > l.t1 + 0.05) continue;
      for (const s of l.sents) {
        if (this.t < s.t0 || this.t >= s.t1) continue;
        const i = Math.floor((this.t - s.t0) * 30);
        const v = (+s.mouth[i] || 0) / 9;
        const v2 = (+s.mouth[i + 1] || 0) / 9;
        const k = (this.t - s.t0) * 30 - i;
        return clamp(lerp(v, v2, k) * 1.15);
      }
    }
    return 0;
  }
  emo(who, fallback) {
    const l = this.d.lines.find((x) => x.who === who && this.t >= x.t0 - 0.2 && this.t < x.t1 + 0.6);
    return l ? l.emo : fallback;
  }
  shake(label, dur = 1.2, amp = 14) {
    const k = this.since(label);
    if (k < 0 || k > dur) return [0, 0];
    const a = amp * (1 - k / dur);
    return [Math.sin(k * 61) * a, Math.cos(k * 47) * a];
  }
  // キャラクターの立ち位置。keys: [[ラベル or 秒, {x,y,s,face,pose,emo,d}], ...]
  actor(who, keys) {
    let st = { x: -400, y: 980, s: 1, face: 1, pose: undefined, emo: undefined, walk: 0, alpha: 1, tilt: 0, lift: 0 };
    let walk = 0;
    for (const [lab, props] of keys) {
      const T = this.L(lab);
      if (this.t < T) break;
      const d = props.d || 0.9;
      const k = ease((this.t - T) / d);
      const to = { ...st, ...props };
      const moving = Math.abs((to.x ?? st.x) - st.x) > 4 && k < 1;
      const nx = lerp(st.x, to.x, k), ny = lerp(st.y, to.y, k);
      walk = moving && !props.fly ? Math.sin(Math.PI * clamp((this.t - T) / d)) * 1.2 : 0;
      const face = props.face !== undefined ? props.face : moving ? Math.sign(to.x - st.x) || st.face : st.face;
      st = { ...to, x: nx, y: ny, s: lerp(st.s, to.s, k), alpha: lerp(st.alpha, to.alpha ?? 1, k), tilt: lerp(st.tilt || 0, to.tilt || 0, k), lift: lerp(st.lift || 0, to.lift || 0, k), face };
    }
    st.walk = walk;
    const talking = this.speaking(who);
    st.mouth = this.mouth(who);
    const lineEmo = this.emo(who, null);
    st.emo = lineEmo || st.emo || (who === 'sapo' ? 'happy' : 'normal');
    st.pose = talking || lineEmo ? (st.pose && st.pose !== 'auto' ? st.pose : EMO_POSE[st.emo] || 'open') : st.pose && st.pose !== 'auto' ? st.pose : 'idle';
    if (st.walk > 0.3 && st.pose === 'idle') st.pose = 'run';
    st.blink = blinkAt(this.t, SEED[who] || 3);
    st.who = who;
    return st;
  }
  draw(c, a, extra = {}) {
    if (a.alpha <= 0.01 || a.x < -500 || a.x > W + 500) return;
    withAlpha(c, a.alpha, () => at(c, a.x, a.y, a.s * (extra.scale || 1), () => {
      const o = { t: this.t + (SEED[a.who] || 0), pose: a.pose, emo: a.emo, mouth: a.mouth, blink: a.blink, face: a.face, walk: a.walk, tilt: a.tilt, lift: a.lift, ...extra };
      if (a.who === 'shun') drawShun(c, o);
      else if (a.who === 'sapo') drawSapo(c, o);
      else { if (a.face < 0) c.scale(-1, 1); drawCell(c, a.who, o); }
    }, a.rot || 0));
  }
}

// ───────── 字幕 ─────────
function subtitles(c, sc, t) {
  let cur = null;
  for (const l of sc.lines) for (const s of l.sents) for (const ch of s.chunks) {
    if (t >= ch.t0 - 0.05 && t < ch.t1 + 0.35) cur = { l, ch };
  }
  if (!cur) return;
  const { l, ch } = cur;
  const size = 44;
  c.font = `700 ${size}px ${FONT}`;
  const maxW = 1480;
  const lines = [];
  let line = '';
  for (const k of ch.text) { if (c.measureText(line + k).width > maxW && line && !'、。！？」）'.includes(k)) { lines.push(line); line = k; } else line += k; }
  lines.push(line);
  const w = Math.min(maxW, Math.max(...lines.map((x) => c.measureText(x).width))) + 80;
  const h = lines.length * size * 1.36 + 34;
  const x = W / 2 - w / 2, y = H - 34 - h;
  const a = clamp((t - ch.t0 + 0.05) / 0.12) * clamp((ch.t1 + 0.35 - t) / 0.15);
  withAlpha(c, a, () => {
    c.save();
    shadow(c, 18, 4, 'rgba(0,0,0,0.3)');
    rr(c, x, y, w, h, 22);
    c.fillStyle = 'rgba(16,24,48,0.82)';
    c.fill();
    noShadow(c);
    c.restore();
    const name = l.who === 'nar' ? '先生' : l.name;
    const col = SPK_COLOR[l.who] || COLORS.blue;
    const nw = measure(c, name, 28, 800) + 36;
    rr(c, x + 18, y - 22, nw, 44, 22);
    c.fillStyle = col; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
    text(c, name, x + 18 + nw / 2, y + 1, { size: 28, align: 'center', color: '#fff', weight: 800 });
    lines.forEach((s, i) => text(c, s, W / 2, y + 22 + size * 0.68 + i * size * 1.36, { size, align: 'center', color: '#fff', weight: 700 }));
  });
}

// ───────── シーンタイトル ─────────
function titleCard(c, sc, t) {
  if (sc.id === 's01') return;
  const num = +sc.id.slice(1);
  const k1 = clamp(t / 0.5), k2 = clamp((3.2 - t) / 0.45);
  if (k2 <= 0) return;
  const a = Math.min(easeOut(k1), k2);
  withAlpha(c, a * 0.45, () => { c.fillStyle = '#0b1a3a'; c.fillRect(0, 0, W, H); });
  const x = lerp(-900, 0, easeOut(k1)) + lerp(0, 900, 1 - k2);
  c.save();
  c.translate(x, 0);
  withAlpha(c, a, () => {
    c.save();
    shadow(c, 30, 8);
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(0, 360); c.lineTo(1500, 360); c.lineTo(1400, 640); c.lineTo(0, 640); c.closePath(); c.fill();
    noShadow(c);
    const g = c.createLinearGradient(0, 0, 1500, 0); g.addColorStop(0, COLORS.blue); g.addColorStop(1, COLORS.sky);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, 360); c.lineTo(560, 360); c.lineTo(520, 450); c.lineTo(0, 450); c.closePath(); c.fill();
    c.restore();
    text(c, `SCENE ${num}`, 60, 406, { size: 46, color: '#fff', weight: 800 });
    text(c, sc.title, 60, 548, { size: 82, color: COLORS.ink, weight: 800 });
  });
  c.restore();
}

function fade(c, sc, t) {
  const a = Math.max(clamp(1 - t / 0.45), clamp((t - (sc.dur - 0.6)) / 0.6));
  if (a > 0) withAlpha(c, a, () => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); });
}

export function renderAt(id, t) {
  const sc = TL.scenes.find((s) => s.id === id);
  const S = new Scene(sc, t);
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  try {
    SCENES[id].draw(ctx, S);
  } catch (e) {
    console.error(`[${id} t=${t.toFixed(2)}]`, e.stack || e);
    throw e;
  }
  ctx.restore();
  ctx.save();
  titleCard(ctx, sc, t);
  subtitles(ctx, sc, t);
  fade(ctx, sc, t);
  ctx.restore();
}

window.renderAt = renderAt;
window.renderFrames = (id, times, q = 0.9) => times.map((t) => { renderAt(id, t); return cvs.toDataURL('image/jpeg', q); });

async function main() {
  const q = new URLSearchParams(location.search);
  await Promise.all([400, 700, 800].map((w) => document.fonts.load(`${w} 40px MR`, '支持組織あア')));
  TL = await (await fetch('data/timeline.json', { cache: 'no-store' })).json();
  window.TL = TL;
  const ids = TL.scenes.map((s) => s.id);
  const only = q.get('scene');
  for (const id of ids) {
    if (only && id !== only && !q.get('all')) continue;
    SCENES[id] = (await import(`./scenes/${id}.js`)).default;
  }
  window.ready = true;
  if (only) {
    const sc = TL.scenes.find((s) => s.id === only);
    if (q.get('play')) {
      const au = new Audio(`../build/mix/${only}.wav`);
      document.body.onclick = () => au.play();
      const loop = () => { renderAt(only, au.currentTime); requestAnimationFrame(loop); };
      loop();
    } else renderAt(only, Math.min(sc.dur - 0.01, +(q.get('t') || 5)));
  }
}
main().catch((e) => { console.error(e.stack || e); });

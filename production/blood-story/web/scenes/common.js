// Shared helpers for every BLOOD STORY cut: easing, camera, shot switching, lipsync lookup, subtitles.
window.BS = window.BS || {};
BS.cuts = BS.cuts || {};
(() => {
  const W = 1920, H = 1080;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = {
    lin: (p) => p,
    in: (p) => p * p * p,
    out: (p) => 1 - Math.pow(1 - p, 3),
    inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: (p) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
    expoOut: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  };
  // progress of t through [a,b], eased
  const prog = (t, a, b, e = ease.inOut) => e(clamp((t - a) / (b - a)));
  // keyframed value: keys = [[t, v], ...] (v number or array), eased between keys
  function keys(t, ks, e = ease.inOut) {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) {
      if (t <= ks[i][0]) {
        const [t0, v0] = ks[i - 1], [t1, v1] = ks[i]; const p = e((t - t0) / (t1 - t0));
        return Array.isArray(v0) ? v0.map((x, k) => lerp(x, v1[k], p)) : lerp(v0, v1, p);
      }
    }
    return ks[ks.length - 1][1];
  }
  // deterministic noise
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
  const shake = (t, amp, freq = 18, seed = 0) => [noise1(t * freq + seed) * amp, noise1(t * freq + 57.3 + seed) * amp];

  // camera: translate so that world point (cx,cy) is centered, zoomed and rotated
  function camera(ctx, { x = W / 2, y = H / 2, zoom = 1, rot = 0, sx = 0, sy = 0 }, fn) {
    ctx.save();
    ctx.translate(W / 2 + sx, H / 2 + sy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-x, -y);
    fn(); ctx.restore();
  }
  // offscreen canvases for transitions
  const pool = [];
  function off(i) { if (!pool[i]) { const c = document.createElement('canvas'); c.width = W; c.height = H; pool[i] = c; } return pool[i]; }
  function renderTo(i, fn) { const c = off(i); const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); fn(g); return c; }

  // shots: [{a, b, draw(ctx, lt, t, shot)}]; cross-dissolve / whip / flash transitions at shot starts via shot.tin = {type, dur}
  function playShots(ctx, t, shots, E) {
    let idx = shots.findIndex((s) => t >= s.a && t < s.b); if (idx < 0) idx = t < shots[0].a ? 0 : shots.length - 1;
    const s = shots[idx]; const lt = t - s.a;
    const tin = s.tin; const prev = shots[idx - 1];
    if (tin && prev && lt < tin.dur) {
      const p = clamp(lt / tin.dur);
      if (tin.type === 'dissolve') {
        const A = renderTo(1, (g) => prev.draw(g, t - prev.a, t, prev, E));
        const B = renderTo(2, (g) => s.draw(g, lt, t, s, E));
        ctx.drawImage(A, 0, 0); ctx.globalAlpha = ease.inOut(p); ctx.drawImage(B, 0, 0); ctx.globalAlpha = 1; return;
      }
      if (tin.type === 'whip') { // fast lateral whip pan with motion blur
        const dir = tin.dir || 1; const e = ease.inOut(p);
        const A = renderTo(1, (g) => prev.draw(g, t - prev.a, t, prev, E));
        const B = renderTo(2, (g) => s.draw(g, lt, t, s, E));
        ctx.save(); ctx.filter = `blur(${Math.sin(p * Math.PI) * 28}px)`;
        ctx.drawImage(A, -dir * e * W, 0); ctx.drawImage(B, dir * (1 - e) * W, 0); ctx.restore(); return;
      }
      if (tin.type === 'flash') {
        s.draw(ctx, lt, t, s, E);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = tin.color || '#fff'; ctx.globalAlpha = 1 - ease.out(p); ctx.fillRect(0, 0, W, H); ctx.restore(); return;
      }
    }
    s.draw(ctx, lt, t, s, E);
  }

  function makeEnv(cues, cut) {
    const lines = cues ? cues.lines : [];
    const byId = Object.fromEntries(lines.map((l) => [l.id, l]));
    const E = {
      W, H, cues, lines, byId, clamp, lerp, ease, prog, keys, hash, noise1, shake, camera, renderTo, playShots,
      line: (id) => byId[id],
      // mouth openness for a given speaker at time t (0 when silent)
      mouth(who, t) {
        for (const l of lines) {
          if (l.who !== who || t < l.start || t > l.end + 0.05) continue;
          const fps = cues.fps || 30; const i = Math.floor((t - l.start) * fps);
          const m = l.mouth || []; const v = m[Math.min(m.length - 1, Math.max(0, i))] || 0;
          return clamp(v * 1.15);
        }
        return 0;
      },
      // natural blink: ~every 3–5 s, 0.14 s long
      blink(t, seed = 0) {
        const period = 3.7 + hash(seed) * 1.6; const ph = ((t + seed * 1.37) % period + period) % period;
        if (ph > 0.14) return 0; return Math.sin((ph / 0.14) * Math.PI);
      },
      subtitleOff: [],
    };
    return E;
  }

  // burned-in subtitles: speaker tag + text, bottom center, always inside the frame
  const SPK = { 'アカネ': '#ff6b6b', 'シロウ': '#9fd4ff', N: '#ffe9a8' };
  // two balanced lines, broken after punctuation when possible (never leaves a 2–3 char orphan)
  function wrap(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return [text];
    const chars = [...text]; let best = null;
    for (let i = 2; i < chars.length - 2; i++) {
      const a = chars.slice(0, i).join(''), b = chars.slice(i).join('');
      const wmax = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      const punct = /[、。！？…]/.test(chars[i - 1]) ? 0.62 : 1;
      const score = wmax * punct;
      if (wmax <= maxW && (!best || score < best.score)) best = { score, rows: [a, b] };
    }
    return best ? best.rows : [text];
  }
  function drawSubtitles(ctx, t, E) {
    if (!E.lines.length) return;
    const l = E.lines.find((x) => t >= x.start - 0.05 && t <= x.end + 0.3); if (!l) return;
    const fadeIn = clamp((t - (l.start - 0.05)) / 0.12), fadeOut = clamp((l.end + 0.3 - t) / 0.15);
    const alpha = Math.min(fadeIn, fadeOut);
    ctx.save(); ctx.globalAlpha = alpha;
    const size = 50; ctx.font = `${size}px ZenKaku, IPAGothic, sans-serif`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    const tag = l.who === 'N' ? '' : l.who; const text = l.text;
    const rows = wrap(ctx, text, W - 2 * 140);
    const lh = size * 1.32; const baseY = H - 70 - (rows.length - 1) * lh;
    rows.forEach((row, i) => {
      const y = baseY + i * lh;
      ctx.lineJoin = 'round'; ctx.lineWidth = 11; ctx.strokeStyle = 'rgba(10,0,4,0.92)'; ctx.strokeText(row, W / 2, y);
      ctx.fillStyle = l.who === 'N' ? '#fff6e0' : '#ffffff'; ctx.fillText(row, W / 2, y);
    });
    if (tag) {
      ctx.font = `${32}px ZenKaku, IPAGothic, sans-serif`; ctx.font = `34px ZenKaku, IPAGothic, sans-serif`;
      const w0 = ctx.measureText(rows[0]).width; ctx.font = `${size}px ZenKaku, IPAGothic, sans-serif`; const w1 = ctx.measureText(rows[0]).width;
      ctx.font = `34px ZenKaku, IPAGothic, sans-serif`;
      const tw = ctx.measureText(tag).width + 34; const tx = Math.max(40, W / 2 - w1 / 2 - 14 - tw), ty = baseY - size * 0.82;
      ctx.fillStyle = SPK[l.who] || '#fff'; ctx.beginPath(); ctx.roundRect(tx, ty, tw, 48, 10); ctx.fill();
      ctx.fillStyle = '#16060a'; ctx.textAlign = 'left'; ctx.fillText(tag, tx + 17, ty + 36);
      void w0;
    }
    ctx.restore();
  }

  BS.common = { W, H, clamp, lerp, ease, prog, keys, hash, noise1, shake, camera, renderTo, playShots, makeEnv, drawSubtitles };
})();

/** Preview-only sound effects (WebAudio), matching tools/lecture-video/medstudy_video.py's synthesized set. */
import type { SfxKind } from '../../engine/lecture-video/types';

let ac: AudioContext | null = null;
const ctx = () => (ac ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

function noise(c: AudioContext, dur: number) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b; return s;
}
function env(c: AudioContext, g: number, a: number, d: number, t: number) {
  const n = c.createGain(); n.gain.setValueAtTime(0, t); n.gain.linearRampToValueAtTime(g, t + a); n.gain.exponentialRampToValueAtTime(0.0001, t + a + d); return n;
}
function tone(c: AudioContext, f0: number, f1: number, g: number, a: number, d: number, t: number, out: AudioNode) {
  const o = c.createOscillator(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + a + d);
  const e = env(c, g, a, d, t); o.connect(e).connect(out); o.start(t); o.stop(t + a + d + 0.05);
}
function hiss(c: AudioContext, type: BiquadFilterType, f0: number, f1: number, g: number, a: number, d: number, t: number, out: AudioNode) {
  const s = noise(c, a + d + 0.05), f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + a + d);
  const e = env(c, g, a, d, t); s.connect(f).connect(e).connect(out); s.start(t);
}

export function playSfx(kind: SfxKind, gain = 1, volume = 0.5) {
  const c = ctx(); if (c.state === 'suspended') void c.resume();
  const t = c.currentTime + 0.01, out = c.createGain(); out.gain.value = gain * volume; out.connect(c.destination);
  switch (kind) {
    case 'whoosh': hiss(c, 'bandpass', 300, 2400, 0.9, 0.18, 0.3, t, out); break;
    case 'impact': hiss(c, 'lowpass', 3000, 300, 0.9, 0.002, 0.08, t, out); tone(c, 110, 45, 0.9, 0.003, 0.2, t, out); break;
    case 'boom': tone(c, 62, 32, 1, 0.005, 0.6, t, out); hiss(c, 'lowpass', 600, 80, 0.5, 0.002, 0.3, t, out); break;
    case 'tick': tone(c, 1800, 1500, 0.4, 0.001, 0.03, t, out); break;
    case 'heartbeat': tone(c, 58, 40, 1, 0.004, 0.12, t, out); tone(c, 55, 38, 0.75, 0.004, 0.12, t + 0.24, out); break;
    case 'riser': tone(c, 200, 1100, 0.25, 1.1, 0.15, t, out); hiss(c, 'highpass', 400, 3000, 0.3, 1.1, 0.1, t, out); break;
    case 'chalk': for (let i = 0; i < 5; i++) hiss(c, 'bandpass', 2500, 1800, 0.25, 0.01, 0.06, t + i * 0.12, out); break;
    case 'shimmer': for (const f of [1320, 1760, 2640]) tone(c, f, f, 0.12, 0.02, 0.8, t, out); break;
  }
}

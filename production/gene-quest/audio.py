#!/usr/bin/env python3
"""GENE QUEST — the sound: an original chiptune score, synthesized sound effects, the narration, the mix.

    python3 production/gene-quest/audio.py            # → audio/stems/*.wav, audio/mix.wav (48 kHz)

Everything here is generated from code (no samples): pulse/triangle/noise voices in the style of an
8-bit console. Every track is composed for this film; none quotes an existing game's music.
Inputs: timing.json (voice.py) and cues.json (node src/render.mjs --cues).
"""
import json, os, subprocess, sys, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SR = 48000
rng = np.random.default_rng(7)

# ───────────────────────────────── voices ─────────────────────────────────
def t_(d): return np.arange(int(d * SR)) / SR
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

def pulse(f, d, duty=0.5, vib=0.0, vib_rate=5.5, vib_delay=0.15):
    t = t_(d)
    fm = f * (1 + vib * np.sin(2 * np.pi * vib_rate * t) * np.clip((t - vib_delay) * 4, 0, 1))
    ph = np.cumsum(fm) / SR
    return np.where((ph % 1) < duty, 1.0, -1.0)

def tri(f, d):
    ph = (np.cumsum(np.full(int(d * SR), f)) / SR) % 1
    return 4 * np.abs(ph - 0.5) - 1

def saw(f, d):
    ph = (np.cumsum(np.full(int(d * SR), f)) / SR) % 1
    return 2 * ph - 1

def sine(f, d):
    return np.sin(2 * np.pi * np.cumsum(np.full(int(d * SR), f)) / SR)

def sweep(f0, f1, d, kind='pulse', duty=0.5, expo=True):
    n = int(d * SR)
    fr = f0 * (f1 / f0) ** np.linspace(0, 1, n) if expo else np.linspace(f0, f1, n)
    ph = np.cumsum(fr) / SR
    if kind == 'sine': return np.sin(2 * np.pi * ph)
    if kind == 'tri': return 4 * np.abs((ph % 1) - 0.5) - 1
    return np.where((ph % 1) < duty, 1.0, -1.0)

def noise(d, period=1):
    n = int(d * SR)
    x = rng.uniform(-1, 1, n // period + 1)
    return np.repeat(x, period)[:n]

def env(n, a=0.005, dcy=0.08, s=0.6, r=0.05, d=None):
    """ADSR over n samples (d = note length before release)."""
    t = np.arange(n) / SR
    d = n / SR - r if d is None else d
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(dcy, 1e-4)))
    rel = np.clip((t - d) / max(r, 1e-4), 0, 1)
    return e * (1 - rel)

def decay(n, tau): return np.exp(-np.arange(n) / SR / tau)

def lp_fast(x, k):
    """Cheap smoothing: moving average of width ~1/k samples (keeps the chip edge but tames aliasing)."""
    w = max(1, int(round(1 / k)))
    if w == 1: return x
    c = np.cumsum(np.concatenate([[0.0], x]))
    y = (c[w:] - c[:-w]) / w
    return np.concatenate([y, np.full(w - 1, y[-1] if len(y) else 0.0)])

def mix_at(buf, x, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    j = min(len(buf), i + len(x))
    buf[i:j] += x[:j - i] * gain

def bell(f, d, partials=((1, 1), (2.76, 0.5), (5.4, 0.25), (8.9, 0.12)), tau=0.5):
    n = int(d * SR); x = np.zeros(n)
    for m, a in partials: x += a * sine(f * m, d) * decay(n, tau / m ** 0.5)
    return x / sum(a for _, a in partials)

def pluck(f, d, damp=0.996):
    n = int(d * SR); p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p); out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = damp * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out

def seqnotes(notes, step, fn):
    """notes: list of midi numbers (None = rest), each `step` seconds."""
    out = np.zeros(int(len(notes) * step * SR) + int(0.6 * SR))
    for k, n in enumerate(notes):
        if n is None: continue
        mix_at(out, fn(midi(n)), k * step)
    return out

# ───────────────────────────── sound effects ─────────────────────────────
def P(f, d, duty=0.25, a=0.002, dcy=0.05, s=0.5, r=0.03): x = pulse(f, d, duty); return x * env(len(x), a, dcy, s, r)

SE = {}
def se(name):
    def deco(fn): SE[name] = fn; return fn
    return deco

@se('item')
def _(): return seqnotes([72, 76, 79, 84, None, 84], 0.075, lambda f: P(f, 0.16, 0.25)) * 0.6
@se('levelup')
def _():
    a = seqnotes([67, 72, 76, 79, 76, 79, 84], 0.09, lambda f: P(f, 0.2, 0.5))
    b = seqnotes([55, 60, 64, 67, 64, 67, 72], 0.09, lambda f: P(f, 0.2, 0.125)) * 0.5
    x = np.zeros(max(len(a), len(b))); x[:len(a)] += a; x[:len(b)] += b
    tail = P(midi(84), 0.6, 0.5, dcy=0.3, s=0.3, r=0.2) + 0.5 * P(midi(76), 0.6, 0.125, dcy=0.3, s=0.3, r=0.2)
    out = np.zeros(len(x) + len(tail)); out[:len(x)] += x; mix_at(out, tail, 0.63)
    return out * 0.5
@se('fanfareS')
def _():
    x = np.zeros(int(1.1 * SR))
    for n, at in ((67, 0), (67, 0.1), (72, 0.2)): mix_at(x, P(midi(n), 0.12, 0.5), at)
    for n in (72, 76, 79): mix_at(x, P(midi(n), 0.7, 0.25, dcy=0.3, s=0.4, r=0.3) * 0.5, 0.32)
    return x * 0.45
@se('fanfare')
def _():
    x = np.zeros(int(2.0 * SR))
    for k, (n, d) in enumerate(((60, .12), (64, .12), (67, .12), (72, .36), (69, .12), (72, .6))):
        mix_at(x, P(midi(n), d + 0.05, 0.5), sum(v for _, v in ((60, .12), (64, .12), (67, .12), (72, .36), (69, .12), (72, .6))[:k]))
    mix_at(x, tri(midi(48), 1.2) * env(int(1.2 * SR), dcy=0.4, s=0.3, r=0.3), 0.36)
    return x * 0.45
@se('victory')
def _():
    mel = [(72, .14), (72, .14), (72, .14), (72, .42), (68, .42), (70, .42), (72, .28), (70, .14), (72, 1.0)]
    x = np.zeros(int(4.2 * SR)); at = 0
    for n, d in mel: mix_at(x, P(midi(n), d + 0.04, 0.5, s=0.7), at); mix_at(x, P(midi(n - 12), d + 0.04, 0.125, s=0.6) * 0.4, at); at += d
    for n, a2 in ((48, 0), (44, 0.98), (46, 1.4), (48, 2.08)): mix_at(x, tri(midi(n), 0.9) * env(int(0.9 * SR), dcy=0.3, s=0.5, r=0.2), a2)
    return x * 0.5
@se('pop')
def _(): x = sweep(400, 1400, 0.07, duty=0.5); return x * env(len(x), dcy=0.03, s=0.2) * 0.35
@se('cursor')
def _(): return P(midi(84), 0.035, 0.5) * 0.25
@se('menu')
def _():
    x = np.zeros(int(0.15 * SR)); mix_at(x, P(midi(79), 0.04, 0.5), 0); mix_at(x, P(midi(86), 0.05, 0.5), 0.05); return x * 0.3
@se('select')
def _():
    x = np.zeros(int(0.3 * SR)); mix_at(x, P(midi(84), 0.06, 0.5), 0); mix_at(x, P(midi(91), 0.12, 0.5, dcy=0.06), 0.06); return x * 0.35
@se('page')
def _():
    x = noise(0.22) * decay(int(0.22 * SR), 0.05); x2 = noise(0.18) * decay(int(0.18 * SR), 0.03)
    out = np.zeros(int(0.35 * SR)); mix_at(out, lp_fast(x, 0.3), 0); mix_at(out, lp_fast(x2, 0.5), 0.1); return out * 0.35
@se('ding')
def _(): return bell(1318, 1.0, tau=0.35) * 0.4
@se('bell')
def _(): return bell(880, 1.8, tau=0.7) * 0.45
@se('bellSoft')
def _(): return bell(660, 2.6, tau=1.0) * 0.35
@se('chime')
def _():
    x = np.zeros(int(1.8 * SR))
    for k, n in enumerate((88, 91, 95)): mix_at(x, bell(midi(n), 1.2, tau=0.5), k * 0.14)
    return x * 0.3
@se('sparkle')
def _():
    x = np.zeros(int(1.0 * SR))
    for k, n in enumerate((100, 96, 103, 98, 105, 100)): mix_at(x, P(midi(n), 0.05, 0.5) * 0.6, k * 0.06)
    return x * 0.25
@se('alert')
def _():
    x = np.zeros(int(0.35 * SR)); mix_at(x, P(1760, 0.07, 0.5, s=0.8), 0); mix_at(x, P(1760, 0.07, 0.5, s=0.8), 0.12); return x * 0.22
@se('snip')
def _():
    n = int(0.18 * SR); c = noise(0.18) * decay(n, 0.012)
    ring = sine(3200, 0.18) * decay(n, 0.04) * 0.5 + sine(4700, 0.18) * decay(n, 0.03) * 0.3
    return (c + ring) * 0.5
@se('chop')
def _():
    n = int(0.3 * SR); return (lp_fast(noise(0.3), 0.2) * decay(n, 0.03) + sweep(180, 60, 0.3, 'sine') * decay(n, 0.08)) * 0.6
@se('join')
def _():
    x = np.zeros(int(0.3 * SR)); mix_at(x, sweep(900, 300, 0.05) * 0.4, 0); mix_at(x, sweep(500, 1600, 0.08, duty=0.25) * env(int(0.08 * SR), dcy=0.04, s=0.3) * 0.5, 0.05)
    mix_at(x, noise(0.02) * 0.6, 0.12); return x * 0.45
@se('snap')
def _(): return noise(0.03) * decay(int(0.03 * SR), 0.006) * 0.6
@se('tape')
def _():
    d = 0.5; n = int(d * SR); x = lp_fast(noise(d), 0.35) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t_(d)))) * env(n, a=0.02, dcy=0.2, s=0.7, r=0.08)
    return x * 0.35
@se('glow')
def _():
    d = 1.4; x = np.zeros(int(d * SR))
    for k, n in enumerate((76, 81, 83, 88)): mix_at(x, sine(midi(n), d - k * 0.1) * env(int((d - k * 0.1) * SR), a=0.3, dcy=0.5, s=0.5, r=0.4) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t_(d - k * 0.1))), k * 0.1)
    return x * 0.18
@se('swirl')
def _():
    d = 0.7; x = sweep(200, 2400, d, duty=0.5) * 0.5 + sweep(2400, 200, d, duty=0.25) * 0.3
    return x * env(int(d * SR), a=0.02, dcy=0.4, s=0.6, r=0.15) * 0.25
@se('encounter')
def _():
    x = np.zeros(int(1.3 * SR))
    for k, (ch, at) in enumerate((((45, 52, 57), 0), ((45, 52, 57), 0.16), ((46, 53, 58), 0.4))):
        for n in ch: mix_at(x, P(midi(n), 0.14 if k < 2 else 0.7, 0.5, dcy=0.1, s=0.6), at)
    mix_at(x, tri(midi(33), 0.9) * decay(int(0.9 * SR), 0.4), 0)
    return x * 0.3
@se('spell')
def _():
    x = np.zeros(int(1.0 * SR))
    for k, n in enumerate((72, 76, 79, 83, 86, 91, 95)): mix_at(x, P(midi(n), 0.09, 0.125, s=0.4) * (0.5 + 0.5 * np.sin(np.arange(int(0.09 * SR)) / SR * 2 * np.pi * 30)), k * 0.05)
    return x * 0.3
@se('hit')
def _():
    n = int(0.18 * SR); return (noise(0.18, 2) * decay(n, 0.04) * 0.7 + sweep(300, 80, 0.18) * decay(n, 0.05) * 0.4) * 0.4
@se('slash')
def _():
    d = 0.35; n = int(d * SR); x = noise(d) * np.linspace(1, 0, n) ** 2
    x = x - lp_fast(x, 0.05)
    return (x * 0.7 + sine(2400, d) * decay(n, 0.08) * 0.3) * 0.55
@se('impact')
def _():
    d = 0.9; n = int(d * SR); return (sweep(120, 35, d, 'sine') * decay(n, 0.25) + lp_fast(noise(d), 0.1) * decay(n, 0.12)) * 0.7
@se('wind')
def _():
    d = 4.0; n = int(d * SR); x = lp_fast(noise(d), 0.04) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t_(d))) * env(n, a=1.2, dcy=1, s=1, r=1.6)
    return x * 0.5
@se('pin')
def _():
    n = int(0.15 * SR); return (sweep(500, 140, 0.15, 'sine') * decay(n, 0.04) + noise(0.15) * decay(n, 0.008)) * 0.45
@se('beckon')
def _():
    x = np.zeros(int(0.6 * SR)); mix_at(x, sine(midi(76), 0.25) * env(int(0.25 * SR), a=0.03, dcy=0.1, s=0.4), 0); mix_at(x, sine(midi(81), 0.3) * env(int(0.3 * SR), a=0.03, dcy=0.15, s=0.3), 0.18)
    return x * 0.3
@se('chest')
def _():
    x = np.zeros(int(0.7 * SR)); mix_at(x, sweep(160, 260, 0.35, duty=0.5) * 0.2 * env(int(0.35 * SR), a=0.05), 0); mix_at(x, noise(0.04) * 0.5, 0.36)
    return x * 0.5
@se('scan')
def _():
    d = 2.6; x = np.zeros(int(d * SR))
    for k in range(10): mix_at(x, sweep(900, 1500, 0.1, duty=0.25) * env(int(0.1 * SR), dcy=0.05, s=0.3) * 0.5, k * 0.26)
    return x * 0.3
@se('jigsaw')
def _():
    x = np.zeros(int(0.5 * SR))
    for at in (0, 0.08): mix_at(x, noise(0.02) * 0.6, at)
    mix_at(x, sweep(300, 120, 0.15, 'sine') * decay(int(0.15 * SR), 0.05), 0.18); mix_at(x, P(midi(84), 0.12, 0.5), 0.2)
    return x * 0.45
@se('rec')
def _(): return P(1000, 0.16, 0.5, s=0.8) * 0.25
@se('lyre')
def _():
    x = np.zeros(int(2.2 * SR))
    for k, n in enumerate((64, 67, 71, 76, 79, 83)): mix_at(x, pluck(midi(n), 1.2), k * 0.12)
    return x * 0.25
@se('crowd')
def _():
    d = 7.0; n = int(d * SR); base = lp_fast(noise(d), 0.03)
    babble = np.zeros(n)
    for k in range(40):
        at = rng.uniform(0, d - 0.4); f = rng.uniform(180, 320); l = rng.uniform(0.15, 0.35)
        mix_at(babble, tri(f, l) * env(int(l * SR), a=0.03, dcy=0.1, s=0.5, r=0.05) * 0.15, at)
    return (base * 0.4 + babble) * env(n, a=0.8, dcy=1, s=1, r=1.5) * 0.35
@se('cash')
def _():
    x = np.zeros(int(0.6 * SR)); mix_at(x, bell(2093, 0.4, tau=0.15), 0); mix_at(x, bell(2637, 0.5, tau=0.2), 0.08); return x * 0.35
@se('factory')
def _():
    d = 8.0; x = np.zeros(int(d * SR))
    for k in range(int(d / 0.48)):
        mix_at(x, (noise(0.08, 3) * decay(int(0.08 * SR), 0.02) * 0.5 + sweep(160, 90, 0.08, 'sine') * decay(int(0.08 * SR), 0.03)), k * 0.48)
        mix_at(x, noise(0.03, 1) * 0.25, k * 0.48 + 0.24)
    return x * env(len(x), a=0.5, dcy=1, s=1, r=1.5) * 0.3
@se('factory2')
def _(): return SE['factory']()[: int(4 * SR)] * np.linspace(1, 0, int(4 * SR))
@se('book')
def _():
    d = 0.4; return lp_fast(noise(d), 0.25) * env(int(d * SR), a=0.08, dcy=0.1, s=0.5, r=0.1) * 0.35
@se('heat')
def _():
    d = 1.2; x = noise(d); x = x - lp_fast(x, 0.08); return x * env(int(d * SR), a=0.1, dcy=0.5, s=0.6, r=0.4) * 0.3
@se('anneal')
def _():
    x = np.zeros(int(0.3 * SR)); mix_at(x, noise(0.015) * 0.7, 0); mix_at(x, P(midi(88), 0.08, 0.5), 0.02); return x * 0.35
@se('extend')
def _():
    x = np.zeros(int(0.8 * SR))
    for k in range(5): mix_at(x, P(midi(76 + k * 2), 0.05, 0.25) * 0.6, k * 0.11)
    return x * 0.35
@se('print')
def _():
    x = np.zeros(int(0.5 * SR))
    for k in range(6): mix_at(x, noise(0.02, 2) * decay(int(0.02 * SR), 0.005) * 0.6, k * 0.07)
    return x * 0.5
@se('gel')
def _():
    d = 2.2; return (sine(100, d) * 0.6 + sine(200, d) * 0.3) * env(int(d * SR), a=0.3, dcy=1, s=1, r=0.8) * 0.18
@se('scanner')
def _():
    d = 1.4; x = np.zeros(int(d * SR))
    mix_at(x, sweep(600, 2400, 0.7, duty=0.5) * 0.15 * env(int(0.7 * SR), a=0.05, s=0.8), 0); mix_at(x, sweep(2400, 600, 0.6, duty=0.5) * 0.15 * env(int(0.6 * SR), a=0.02, s=0.8), 0.7)
    return x
@se('switch')
def _(): x = sweep(1200, 400, 0.03); x[:960] += noise(0.02) * 0.5; return x * 0.35
@se('beep')
def _(): return P(1568, 0.07, 0.5, s=0.8) * 0.2
@se('beepLow')
def _(): return P(523, 0.18, 0.5, s=0.6) * 0.22
@se('jingle')
def _():
    x = seqnotes([79, 84, 88, 91], 0.09, lambda f: P(f, 0.14, 0.25)); out = np.zeros(len(x) + int(0.6 * SR)); out[:len(x)] += x
    mix_at(out, bell(midi(96), 0.8, tau=0.3), 0.36); return out * 0.35
@se('beat')
def _():
    x = np.zeros(int(0.5 * SR)); mix_at(x, sweep(140, 50, 0.12, 'sine') * decay(int(0.12 * SR), 0.05), 0); mix_at(x, noise(0.03) * 0.3, 0.25); return x * 0.5
@se('cluster')
def _():
    x = np.zeros(int(0.8 * SR))
    for k in range(9): mix_at(x, sweep(rng.uniform(500, 900), rng.uniform(1500, 2500), 0.04) * 0.3, k * 0.07 + rng.uniform(0, 0.03))
    return x * 0.3
@se('heatmap')
def _(): return seqnotes([84, 86, 88, 91, 93, 96], 0.05, lambda f: P(f, 0.06, 0.125)) * 0.25
@se('tick')
def _():
    x = np.zeros(int(0.6 * SR))
    for k in range(3): mix_at(x, noise(0.008) * 0.6 + 0, k * 0.18); mix_at(x, sine(3000, 0.02) * decay(int(0.02 * SR), 0.005) * 0.4, k * 0.18)
    return x * 0.5
@se('clock')
def _():
    x = np.zeros(int(2.5 * SR))
    for k in range(8): mix_at(x, sine(2600 if k % 2 else 2000, 0.02) * decay(int(0.02 * SR), 0.006) * 0.5, k * 0.3)
    return x * 0.5
@se('zap')
def _():
    d = 0.6; x = noise(d, 1) * (rng.uniform(0, 1, int(d * SR)) > 0.7) * decay(int(d * SR), 0.2); return (x - lp_fast(x, 0.1)) * 0.4
@se('horn')
def _():
    d = 1.6; x = (lp_fast(saw(110, d), 0.2) * 0.7 + lp_fast(saw(165, d), 0.2) * 0.3) * env(int(d * SR), a=0.15, dcy=0.5, s=0.8, r=0.4)
    return x * 0.3
@se('ghost')
def _():
    d = 1.4; f = 600 * (1 + 0.04 * np.sin(2 * np.pi * 6 * t_(d))) * np.linspace(1, 0.6, int(d * SR))
    ph = np.cumsum(f) / SR; return np.sin(2 * np.pi * ph) * env(int(d * SR), a=0.2, dcy=0.5, s=0.7, r=0.4) * 0.25
@se('bad')
def _(): return P(110, 0.35, 0.5, s=0.8) * 0.25 + P(116, 0.35, 0.5, s=0.8) * 0.2

# per-effect trims: ambiences sit under everything, jingles a little forward
SE_LEVEL = {'crowd': 0.6, 'factory': 0.55, 'factory2': 0.55, 'wind': 0.7, 'gel': 0.8, 'item': 1.2, 'levelup': 1.2, 'victory': 1.3, 'fanfareS': 1.0}

# ───────────────────────────────── music ─────────────────────────────────
SCALES = {'maj': [0, 2, 4, 5, 7, 9, 11], 'min': [0, 2, 3, 5, 7, 8, 10], 'dor': [0, 2, 3, 5, 7, 9, 10], 'hmin': [0, 2, 3, 5, 7, 8, 11]}

# Each track: name, root (midi), scale, bpm, chord degrees per bar, lead motif (degree-from-chord-root, beats),
# bass pattern, harmony style, drum pattern, lead duty.
# motif tokens: "d:len" with d an integer scale step above the chord root (r = rest); one bar = 4 beats.
TRACKS = {
  'title':   dict(name='序章の荘厳', root=58, sc='maj', bpm=80, prog=[0, 3, 4, 0, 5, 3, 4, 4],
                  lead=['4:2 2:1 4:1', '5:3 4:1', '4:2 6:1 7:1', '7:4', '2:2 4:1 5:1', '4:3 2:1', '1:2 2:1 4:1', '4:4'],
                  bass='whole', harm='arp8', drum='timp', duty=0.5),
  'history': dict(name='発見の巻物', root=65, sc='maj', bpm=112, prog=[0, 5, 3, 4],
                  lead=['0:1 2:.5 4:.5 7:1 4:1', '2:1 4:1 5:1 4:1', '0:.5 2:.5 4:1 5:.5 4:.5 2:1', '1:1 2:1 4:2'],
                  bass='walk', harm='arp16', drum='light', duty=0.25),
  'smith':   dict(name='鍛冶屋のリズム', root=62, sc='min', bpm=120, prog=[0, 5, 6, 0],
                  lead=['0:.5 0:.5 2:.5 4:.5 3:1 2:1', '4:1 2:.5 0:.5 2:2', '0:.5 2:.5 4:.5 6:.5 7:2', '4:1 3:1 2:1 0:1'],
                  bass='pump', harm='stab', drum='anvil', duty=0.25),
  'ligase':  dict(name='接合の温もり', root=67, sc='maj', bpm=96, prog=[0, 2, 3, 4],
                  lead=['4:1.5 2:.5 0:2', '2:1 4:1 5:2', '4:1 5:.5 4:.5 2:2', '1:1 2:1 4:2'],
                  bass='half', harm='arp8', drum='soft', duty=0.5),
  'puzzle':  dict(name='接合の温もり（つづき）', root=67, sc='maj', bpm=96, prog=[3, 4, 2, 5],
                  lead=['2:1 4:1 7:2', '4:1.5 2:.5 4:2', '0:1 2:1 4:1 2:1', '4:4'],
                  bass='half', harm='arp8', drum='soft', duty=0.5),
  'rt':      dict(name='録音の魔法', root=64, sc='dor', bpm=88, prog=[0, 3, 0, 6],
                  lead=['0:1 2:1 4:2', '2:1 4:1 6:2', '4:1 2:1 0:1 2:1', '1:2 0:2'],
                  bass='half', harm='arp16', drum='none', duty=0.125),
  'market':  dict(name='市場の賑わい', root=69, sc='maj', bpm=132, prog=[0, 3, 4, 3],
                  lead=['0:.5 2:.5 4:.5 2:.5 4:1 7:1', '2:.5 4:.5 5:1 4:.5 2:.5 0:1', '4:.5 4:.5 5:.5 4:.5 2:1 4:1', '1:.5 2:.5 4:1 2:2'],
                  bass='oom', harm='stab', drum='light', duty=0.25),
  'factory': dict(name='工場の稼働', root=60, sc='min', bpm=126, prog=[0, 0, 5, 6],
                  lead=['0:.5 r:.5 0:.5 2:.5 4:1 3:1', '0:.5 r:.5 0:.5 2:.5 3:2', '4:.5 2:.5 4:.5 5:.5 4:2', '6:1 4:1 2:2'],
                  bass='pump', harm='stab', drum='machine', duty=0.25),
  'gfp':     dict(name='光る宝石', root=64, sc='maj', bpm=72, prog=[0, 5, 3, 4],
                  lead=['7:2 4:2', '6:2 4:2', '5:1 4:1 2:2', '4:4'],
                  bass='whole', harm='arp16', drum='none', duty=0.125),
  'harbor':  dict(name='港の配達', root=62, sc='maj', bpm=104, prog=[0, 4, 5, 3],
                  lead=['4:1.5 2:.5 4:1 5:1', '4:2 2:2', '2:1.5 4:.5 5:1 4:1', '7:2 4:2'],
                  bass='walk', harm='arp8', drum='light', duty=0.5),
  'library': dict(name='図書館の静寂', root=65, sc='min', bpm=80, prog=[0, 3, 6, 2],
                  lead=['4:2 2:2', '2:1 4:1 2:2', '4:2 6:2', '4:4'],
                  bass='whole', harm='arp8', drum='none', duty=0.125),
  'pcr':     dict(name='コピーの術（戦闘）', root=57, sc='hmin', bpm=152, prog=[0, 5, 6, 4],
                  lead=['0:.5 2:.5 4:.5 7:.5 6:1 4:1', '4:.5 2:.5 4:.5 5:.5 4:2', '0:.5 2:.5 4:.5 6:.5 7:1 6:1', '4:1 3:1 2:1 1:1'],
                  bass='drive', harm='stab', drum='battle', duty=0.25),
  'vntr':    dict(name='探偵の足跡', root=67, sc='min', bpm=100, prog=[0, 3, 4, 0],
                  lead=['0:.75 2:.25 4:1 r:1 3:1', '2:.75 0:.25 2:1 r:2', '4:.75 5:.25 4:1 2:1 0:1', '1:1 r:1 0:2'],
                  bass='walk', harm='stab', drum='swing', duty=0.25),
  'gel':     dict(name='泳動の川', root=58, sc='maj', bpm=116, prog=[0, 1, 3, 4],
                  lead=['0:1 2:1 4:1 2:1', '2:1 4:1 6:2', '4:1 5:1 4:1 2:1', '1:2 2:2'],
                  bass='half', harm='arp16', drum='light', duty=0.25),
  'qpcr':    dict(name='解析の灯', root=60, sc='maj', bpm=92, prog=[0, 4, 5, 2, 3, 0, 3, 4],
                  lead=['4:2 2:2', '4:1 2:1 1:2', '2:2 4:2', '4:4', '2:1 4:1 5:2', '4:2 2:2', '4:1 5:1 7:2', '4:4'],
                  bass='half', harm='arp8', drum='soft', duty=0.125),
  'sanger':  dict(name='配列の機械', root=62, sc='dor', bpm=120, prog=[0, 3, 0, 4],
                  lead=['0:.5 4:.5 2:.5 4:.5 0:.5 4:.5 2:.5 4:.5', '0:.5 4:.5 2:.5 5:.5 4:2', '0:.5 4:.5 2:.5 4:.5 6:1 4:1', '2:2 0:2'],
                  bass='pump', harm='arp16', drum='machine', duty=0.25),
  'ngs':     dict(name='並列の奔流', root=64, sc='min', bpm=140, prog=[0, 5, 2, 6],
                  lead=['0:.5 2:.5 4:.5 2:.5 4:.5 7:.5 4:1', '2:.5 4:.5 5:.5 4:.5 2:2', '4:.5 4:.5 2:.5 4:.5 6:1 4:1', '4:.5 2:.5 1:1 2:2'],
                  bass='drive', harm='arp16', drum='battle', duty=0.25),
  'seq':     dict(name='空間の地図', root=56, sc='maj', bpm=96, prog=[0, 4, 5, 3],
                  lead=['4:2 5:1 4:1', '2:2 4:2', '4:1 5:1 7:2', '4:4'],
                  bass='half', harm='arp8', drum='soft', duty=0.5),
  'crispr':  dict(name='編集の一閃（戦闘）', root=59, sc='hmin', bpm=156, prog=[0, 6, 5, 4],
                  lead=['0:.5 0:.5 4:.5 0:.5 6:1 4:1', '2:.5 4:.5 2:.5 0:.5 2:2', '0:.5 2:.5 4:.5 7:.5 6:.5 4:.5 2:1', '4:2 3:2'],
                  bass='drive', harm='stab', drum='battle', duty=0.25),
  'repair':  dict(name='修復の対比', root=66, sc='min', bpm=108, prog=[0, 3, 0, 4],
                  lead=['0:1 2:1 4:1 2:1', '4:2 3:2', '0:1 2:1 4:1 7:1', '6:2 4:2'],
                  bass='walk', harm='arp8', drum='soft', duty=0.25),
  'finale':  dict(name='最終決戦', root=62, sc='hmin', bpm=164, prog=[0, 5, 2, 6, 0, 5, 3, 4],
                  lead=['0:.5 2:.5 4:.5 7:.5 6:.5 4:.5 2:1', '4:.5 4:.5 5:.5 4:.5 2:2', '2:.5 4:.5 6:.5 7:.5 9:1 7:1', '6:1 4:1 2:1 4:1',
                        '7:1.5 6:.5 4:1 2:1', '4:1 5:1 7:2', '9:1 7:1 6:1 4:1', '4:2 6:2'],
                  bass='drive', harm='stab', drum='battle', duty=0.5),
  'epilogue':dict(name='静かな結び', root=60, sc='maj', bpm=70, prog=[0, 5, 3, 4, 0, 3, 4, 0],
                  lead=['4:2 2:1 4:1', '2:3 r:1', '0:2 2:1 4:1', '4:4', '4:2 5:1 4:1', '2:2 4:2', '1:2 2:2', '0:4'],
                  bass='whole', harm='arp8', drum='none', duty=0.125),
}

def chord_notes(tr, deg):
    sc = SCALES[tr['sc']]
    def step(k): return tr['root'] + sc[k % 7] + 12 * (k // 7)
    return [step(deg), step(deg + 2), step(deg + 4)], step

def render_track(tr, dur):
    """Returns three stems (lead, pad, rhythm) of length dur seconds."""
    beat = 60 / tr['bpm']; bar = beat * 4
    n = int(dur * SR) + SR
    lead = np.zeros(n); pad = np.zeros(n); rhy = np.zeros(n)
    nbars = int(math.ceil(dur / bar)) + 1
    for b in range(nbars):
        deg = tr['prog'][b % len(tr['prog'])]
        (c0, c1, c2), step = chord_notes(tr, deg)
        t0 = b * bar
        phrase = (b // len(tr['prog'])) % 2
        # lead (plays one phrase, then rests a phrase at half volume for breathing room)
        mot = tr['lead'][b % len(tr['lead'])]
        at = t0
        for tok in mot.split():
            d_, l = tok.split(':'); l = float(l) * beat
            if d_ != 'r':
                f = midi(step(deg + int(d_)) + 12)
                x = pulse(f, l * 0.95, tr['duty'], vib=0.006) * env(int(l * 0.95 * SR), 0.004, 0.12, 0.65, min(0.06, l * 0.3))
                mix_at(lead, lp_fast(x, 0.5), at, 0.30 if phrase == 0 else 0.22)
            at += l
        # harmony
        h = tr['harm']
        if h in ('arp8', 'arp16'):
            st = beat / (2 if h == 'arp8' else 4); k = 0; tt = t0
            pat = [c0, c1, c2, c1 + 12 if h == 'arp16' else c1]
            while tt < t0 + bar - 1e-6:
                nn = pat[k % len(pat)]
                x = pulse(midi(nn), st * 0.9, 0.125) * env(int(st * 0.9 * SR), 0.002, 0.05, 0.3, 0.02)
                mix_at(pad, lp_fast(x, 0.4), tt, 0.10); tt += st; k += 1
        elif h == 'stab':
            for k in range(4):
                if k in (1, 3):
                    for nn in (c0, c1, c2):
                        x = pulse(midi(nn), beat * 0.4, 0.25) * env(int(beat * 0.4 * SR), 0.002, 0.06, 0.3, 0.03)
                        mix_at(pad, lp_fast(x, 0.4), t0 + k * beat, 0.06)
        # bass (triangle, an octave or two below)
        bs = tr['bass']; br = c0 - 24 if c0 - 24 >= 33 else c0 - 12
        if bs == 'whole': pat = [(0, 4, br)]
        elif bs == 'half': pat = [(0, 2, br), (2, 2, br + 7)]
        elif bs == 'walk': pat = [(0, 1, br), (1, 1, br + 4 if tr['sc'] == 'maj' else br + 3), (2, 1, br + 7), (3, 1, br + 9 if tr['sc'] == 'maj' else br + 10)]
        elif bs == 'oom': pat = [(0, 1, br), (1, 1, br + 12), (2, 1, br + 7), (3, 1, br + 12)]
        elif bs == 'pump': pat = [(k * 0.5, 0.5, br + (12 if k % 2 else 0)) for k in range(8)]
        else: pat = [(k * 0.5, 0.5, br if k % 4 != 3 else br + 7) for k in range(8)]  # drive
        for st_, ln, nn in pat:
            l = ln * beat * 0.92
            mix_at(pad, tri(midi(nn), l) * env(int(l * SR), 0.004, 0.2, 0.7, 0.03), t0 + st_ * beat, 0.32)
        # drums
        dr = tr['drum']
        def kick(at, g=1.0): mix_at(rhy, sweep(150, 45, 0.14, 'sine') * decay(int(0.14 * SR), 0.06), at, 0.55 * g)
        def snare(at, g=1.0): mix_at(rhy, noise(0.14, 2) * decay(int(0.14 * SR), 0.05) * 0.8 + tri(220, 0.14) * decay(int(0.14 * SR), 0.03) * 0.3, at, 0.30 * g)
        def hat(at, g=1.0): x = noise(0.04); mix_at(rhy, (x - lp_fast(x, 0.2)) * decay(len(x), 0.012), at, 0.20 * g)
        if dr == 'light':
            for k in range(4): hat(t0 + k * beat + beat / 2, 0.8)
            kick(t0); kick(t0 + 2 * beat, 0.7); snare(t0 + beat, 0.6); snare(t0 + 3 * beat, 0.6)
        elif dr == 'soft':
            kick(t0, 0.6); hat(t0 + beat, 0.5); hat(t0 + 3 * beat, 0.5); snare(t0 + 2 * beat, 0.35)
        elif dr == 'battle':
            for k in range(8): hat(t0 + k * beat / 2, 0.9)
            for k in (0, 1.5, 2, 3.5): kick(t0 + k * beat)
            snare(t0 + beat); snare(t0 + 3 * beat); snare(t0 + 3.75 * beat, 0.5)
        elif dr == 'machine':
            for k in range(8): hat(t0 + k * beat / 2, 0.7 if k % 2 else 1.0)
            kick(t0); kick(t0 + beat); kick(t0 + 2 * beat); kick(t0 + 3 * beat)
            mix_at(rhy, sine(2200, 0.05) * decay(int(0.05 * SR), 0.01), t0 + 1.5 * beat, 0.15)
        elif dr == 'anvil':
            kick(t0); snare(t0 + 2 * beat, 0.5)
            for k in (1, 3): mix_at(rhy, (sine(1850, 0.3) + 0.6 * sine(2730, 0.3)) * decay(int(0.3 * SR), 0.07), t0 + k * beat, 0.16)
            for k in range(4): hat(t0 + k * beat + beat / 2, 0.6)
        elif dr == 'swing':
            for k in range(4): hat(t0 + k * beat, 0.7); hat(t0 + k * beat + beat * 0.66, 0.5)
            kick(t0, 0.7); snare(t0 + 2 * beat, 0.4)
        elif dr == 'timp':
            if b % 2 == 0: mix_at(rhy, tri(midi(br + 12), 0.8) * decay(int(0.8 * SR), 0.3), t0, 0.5)
            mix_at(rhy, tri(midi(br + 19), 0.4) * decay(int(0.4 * SR), 0.2), t0 + 3 * beat, 0.25)
    return lead[: int(dur * SR)], pad[: int(dur * SR)], rhy[: int(dur * SR)]

# ───────────────────────────────── mix ─────────────────────────────────
def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)

def write_wav(path, x, stereo=True):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = np.clip(x, -1, 1)
    if stereo: data = np.stack([data, data], axis=1)
    pcm = (data * 32767).astype('<i2').tobytes()
    ch = 2 if stereo else 1
    import struct
    with open(path, 'wb') as f:
        f.write(b'RIFF' + struct.pack('<I', 36 + len(pcm)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, ch, SR, SR * ch * 2, ch * 2, 16) + b'data' + struct.pack('<I', len(pcm)))
        f.write(pcm)

def main():
    timing = json.load(open(os.path.join(HERE, 'timing.json')))
    cues = json.load(open(os.path.join(HERE, 'cues.json')))
    D = timing['duration']; N = int(D * SR)
    stems = {k: np.zeros(N) for k in ('voice', 'lead', 'pad', 'rhythm', 'se')}
    # narration
    voices = {'narrator': np.zeros(N), 'sage': np.zeros(N)}
    for l in timing['lines']:
        x = decode(os.path.join(ROOT, l['file']))
        mix_at(stems['voice'], x, l['start'], 1.0)
        mix_at(voices['sage' if l['who'] == '師匠' else 'narrator'], x, l['start'], 1.0)
    # music, block by block with short crossfades
    blocks = timing['blocks']
    XF = 0.6
    for i, b in enumerate(blocks):
        tr = TRACKS[b['scene']]
        start = b['start']; end = b['end'] if b['end'] is not None else D
        seg = end - start + (XF if i < len(blocks) - 1 else 0)
        stems_tr = render_track(tr, seg)
        n = len(stems_tr[0])
        fade = np.ones(n)
        fi = int(XF * SR)
        if i > 0: fade[:fi] = np.linspace(0, 1, fi)
        if i < len(blocks) - 1: fade[-fi:] = np.linspace(1, 0, fi)
        else: fade[-int(4 * SR):] *= np.linspace(1, 0, int(4 * SR))
        for key, x in zip(('lead', 'pad', 'rhythm'), stems_tr): mix_at(stems[key], x * fade, start - (XF / 2 if i > 0 else 0))
        print(f"  music {b['scene']:9s} {tr['name']}", flush=True)
    # sound effects
    cache = {}
    for c in cues:
        if c['name'] not in SE: print('  ! no SE', c['name']); continue
        if c['name'] not in cache: cache[c['name']] = SE[c['name']]()
        mix_at(stems['se'], cache[c['name']], c['t'], c.get('vol', 1) * SE_LEVEL.get(c['name'], 1.0))
    # ducking: the music drops ~10 dB while someone speaks (attack 80 ms, release 400 ms)
    speak = np.zeros(N)
    for l in timing['lines']:
        a, z = int(max(0, l['start'] - 0.08) * SR), int(min(D, l['end'] + 0.15) * SR); speak[a:z] = 1
    k_up, k_dn = 1 - math.exp(-1 / (0.08 * SR)), 1 - math.exp(-1 / (0.4 * SR))
    g = np.empty(N); acc = 0.0
    # run the envelope follower on a 1 kHz grid, then upsample (fast and smooth enough)
    step_ = SR // 1000
    coarse = speak[::step_]; out = np.empty(len(coarse))
    ku, kd = 1 - math.exp(-1 / (0.08 * 1000)), 1 - math.exp(-1 / (0.4 * 1000))
    for i, v in enumerate(coarse):
        acc += (ku if v > acc else kd) * (v - acc); out[i] = acc
    env_ = np.interp(np.arange(N), np.arange(len(coarse)) * step_, out)
    duck = 10 ** (-10 * env_ / 20)
    for key in ('lead', 'pad', 'rhythm'): stems[key] *= duck
    # levels
    stems['voice'] *= 1.0
    for key, gain in (('lead', 0.55), ('pad', 0.55), ('rhythm', 0.5)): stems[key] *= gain
    stems['se'] *= 0.17
    mixdown = sum(stems.values())
    peak = np.max(np.abs(mixdown)); print('  peak before limit', round(float(peak), 3))
    if peak > 0.98:
        mixdown *= 0.98 / peak
        for k in stems: stems[k] *= 0.98 / peak
        for k in voices: voices[k] *= 0.98 / peak
    out = os.path.join(HERE, 'audio')
    for k, v in stems.items(): write_wav(os.path.join(out, 'stems', f'{k}.wav'), v)
    write_wav(os.path.join(out, 'stems', 'bgm.wav'), stems['lead'] + stems['pad'] + stems['rhythm'])
    for k, v in voices.items(): write_wav(os.path.join(out, 'stems', f'voice_{k}.wav'), v)
    write_wav(os.path.join(out, 'mix_raw.wav'), mixdown)
    print('  wrote stems and mix_raw.wav', round(D, 1), 's')

if __name__ == '__main__':
    main()

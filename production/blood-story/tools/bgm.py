#!/usr/bin/env python3
"""
BLOOD STORY score, synthesised (no samples, no copyrighted material).

    python3 tools/bgm.py [--stems]       -> audio/bgm/intro_bgm.wav (+ per-bus stems with --stems)
    python3 tools/bgm.py --cue calm      -> audio/bgm/calm_bed.wav   (other cues for the full episode:
                                            calm | mystery | battle | warm  - sketches built from the same kit)

Structure
---------
1. Instruments  (pure functions -> mono or stereo numpy arrays):
     string_pad, string_stacc, string_trem, pizz, brass, glock, timpani, timp_roll, taiko,
     kick, snare, snare_roll, hat, shaker, crash, reverse_cymbal, riser, sub_boom
2. Score        (an arrangement canvas with buses: strings / brass / perc / keys / fx / low):
     sc.add(bus, signal, time, gain_db, pan); per-bus EQ + send to one synthetic hall.
3. Sections     (functions composing instruments on the canvas at a given time / key / tempo):
     sec_expectant, sec_bright_drive, sec_tense, sec_heroic, sec_hit_ringout,
     sec_calm_bed, sec_mystery, sec_battle, sec_warm_ending
4. Cues         (lists of sections):  cue_intro(), cue_calm(), ...

Music helpers: note('D4') -> midi, chord('Bm', octave) -> midis, Grid(t0, bpm) -> beat/bar times.
"""
from __future__ import annotations

import argparse, os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import (SR, AUDIO, write_wav, t_axis, white, pink, brown, sine, saw, lp, hp, bp, eq,  # noqa: E402
                       sweep_filter, adsr, fade, make_ir, reverb, pan, stereo, widen, rng, mtof, note,
                       compress, normalize_peak, phase_of, NOTE)

BGM_DIR = os.path.join(AUDIO, "bgm")


# ============================================================================ music helpers
QUAL = {"": [0, 4, 7], "m": [0, 3, 7], "sus4": [0, 5, 7], "sus2": [0, 2, 7], "7": [0, 4, 7, 10],
        "maj7": [0, 4, 7, 11], "m7": [0, 3, 7, 10], "add9": [0, 4, 7, 14], "dim": [0, 3, 6], "5": [0, 7, 12]}


def chord(name: str, octave: int = 3, inversion: int = 0) -> list[int]:
    """'Bm' -> [B3, D4, F#4]; 'A/C#' handled by caller via bass note."""
    root = name[:2] if len(name) > 1 and name[1] in "#b" else name[:1]
    q = name[len(root):]
    base = 12 * (octave + 1) + NOTE[root]
    ns_ = [base + i for i in QUAL[q]]
    for _ in range(inversion):
        ns_ = ns_[1:] + [ns_[0] + 12]
    return ns_


def root_of(name: str, octave: int = 2) -> int:
    root = name[:2] if len(name) > 1 and name[1] in "#b" else name[:1]
    return 12 * (octave + 1) + NOTE[root]


class Grid:
    def __init__(self, t0: float, bpm: float, beats_per_bar: int = 4):
        self.t0, self.b, self.bpb = t0, 60.0 / bpm, beats_per_bar

    def beat(self, k: float) -> float:
        return self.t0 + k * self.b

    def bar(self, k: float) -> float:
        return self.t0 + k * self.bpb * self.b

    def at(self, bar: int, beat: float) -> float:
        return self.t0 + (bar * self.bpb + beat) * self.b


def sat(x, drive=1.5):
    return np.tanh(drive * x) / np.tanh(drive)


def env_ramp(n, a, b):
    return np.linspace(a, b, n)


# ============================================================================ instruments
def string_pad(midis, dur, att=0.4, rel=0.8, bright=2600, voices=5, detune=9.0, vib=0.0035, seed=0,
               bright_end=None, swell=False):
    """ensemble strings: detuned polyBLEP saws per note, slow attack, gentle vibrato, low-pass.
    bright_end: filter opens from `bright` to `bright_end` over the note (crescendo colour)."""
    env = adsr(dur, a=att, d=0.3, s=0.9, r=rel, curve=2)
    n = len(env)
    t = np.arange(n) / SR
    r = rng(seed)
    L = np.zeros(n); R = np.zeros(n)
    for m in midis:
        f = mtof(m)
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / max(1, (voices - 1) / 2) * detune + r.normal(0, 1.5)
            rate = r.uniform(4.6, 5.8)
            fv = f * 2 ** (cents / 1200) * (1 + vib * np.sin(2 * np.pi * rate * t + r.uniform(0, 6)) * np.clip(t / 0.6, 0, 1))
            s = saw(fv, phase0=r.uniform())
            p = (v / max(1, voices - 1)) * 2 - 1
            L += s * np.cos((p * 0.7 + 1) * np.pi / 4); R += s * np.sin((p * 0.7 + 1) * np.pi / 4)
    y = np.stack([L, R], 1) / (len(midis) * voices) ** 0.5
    if bright_end:
        y = np.stack([sweep_filter(y[:, c], bright, bright_end, kind="lp", q=0.6) for c in range(2)], 1)
    else:
        y = lp(y, bright, 2)
    y = hp(y, 60)
    y = eq(y, [("peak", 250, 0.8, -2.0), ("peak", 1400, 0.9, 1.5)])
    if swell:
        env *= np.clip(t / max(dur, 1e-3), 0.15, 1.0) ** 1.6
    return y * env[:, None]


def string_stacc(midi, vel=0.8, length=0.16, voices=3, seed=0, bright=3800):
    """spiccato / staccato string note: bow 'chiff' + short saw body"""
    d = length + 0.18
    t = t_axis(d)
    f = mtof(midi)
    r = rng(seed)
    y = np.zeros_like(t)
    for v in range(voices):
        y += saw(f * 2 ** (r.normal(0, 6) / 1200) * np.ones_like(t), phase0=r.uniform())
    y /= voices
    env = np.clip(t / 0.005, 0, 1) * np.where(t < length, np.exp(-t / (length * 0.9)), np.exp(-length / (length * 0.9)) * np.exp(-(t - length) / 0.05))
    y = lp(y * env, bright * (0.6 + 0.4 * vel))
    y = hp(y, 70)
    chiff = bp(white(d, seed + 3), 1500, 6000) * np.exp(-t / 0.012) * 0.12
    return (y + chiff) * vel


def string_trem(midis, dur, vel=0.6, rate=13.0, seed=0, bright=4200):
    """tremolo strings (tension): amplitude-modulated detuned saws with a crescendo"""
    y = string_pad(midis, dur, att=0.25, rel=0.4, bright=bright, voices=4, detune=12, seed=seed, swell=True)
    t = np.arange(len(y)) / SR
    trem = 0.65 + 0.35 * np.abs(np.sin(np.pi * rate * t + rng(seed).uniform(0, 3)))
    return y * trem[:, None] * vel


def pizz(midi, vel=0.7, seed=0):
    """pizzicato: additive pluck, upper partials die first"""
    d = 0.9
    t = t_axis(d)
    f = mtof(midi)
    y = np.zeros_like(t)
    for k in range(1, 12):
        if f * k > 12000:
            break
        y += np.sin(2 * np.pi * f * k * t) / k ** 1.2 * np.exp(-t / (0.35 / k ** 0.7))
    y *= np.clip(t / 0.002, 0, 1)
    y += bp(white(d, seed), 800, 4000) * np.exp(-t / 0.005) * 0.1
    return y * vel


def brass(midi, dur, vel=0.8, bright=1.0, rel=0.22, scoop=0.012, seed=0, section=3, att=None):
    """brass section: additive, brightness follows loudness (amp_k ~ env^(0.5+0.17k)/k),
    pitch scoop on attack, delayed vibrato, breath. section = number of slightly detuned players."""
    a = att if att is not None else 0.035 + 0.04 * (1 - vel)
    env = adsr(dur, a=a, d=0.25, s=0.78, r=rel, curve=2.5)
    n = len(env)
    t = np.arange(n) / SR
    f0 = mtof(midi)
    r = rng(seed)
    out = np.zeros(n)
    K = int(min(28, 11000 / f0))
    for p in range(section):
        det = 2 ** (r.normal(0, 5) / 1200)
        vib = 1 + 0.0045 * np.sin(2 * np.pi * r.uniform(5.0, 5.8) * t) * np.clip((t - 0.3) / 0.4, 0, 1)
        f = f0 * det * (1 - scoop * np.exp(-t / 0.04)) * vib
        ph = phase_of(f) + r.uniform()
        e = np.clip(env * vel * (0.92 + 0.08 * r.uniform()), 0, 1)
        for k in range(1, K + 1):
            out += np.sin(2 * np.pi * k * ph) * e ** (0.5 + 0.17 * k / bright) / k ** 0.75
    out /= section * 3.0
    out = eq(out, [("peak", 1100, 0.8, 2.0), ("peak", 2800, 1.2, -1.5), ("lp", 9000, 0.7, 0)])
    breath = bp(white(len(out) / SR, seed + 9), 900, 3500) * env * 0.012 * vel
    return out + breath


def glock(midi, vel=0.6, seed=0):
    d = 1.6
    t = t_axis(d)
    f = mtof(midi)
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.7) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.18)
         + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.07))
    y *= np.clip(t / 0.001, 0, 1)
    return y * vel


def timpani(midi, vel=0.8, seed=0, d=2.2):
    t = t_axis(d)
    f = mtof(midi)
    y = np.zeros_like(t)
    for ratio, a, tau in [(1.0, 1.0, 0.9), (1.5, 0.5, 0.6), (1.98, 0.35, 0.45), (2.44, 0.2, 0.3), (2.94, 0.12, 0.2)]:
        y += a * np.sin(2 * np.pi * f * ratio * (t + 0.004 * np.exp(-t / 0.05))) * np.exp(-t / tau)
    mallet = lp(white(d, seed), 1800) * np.exp(-t / 0.012) * 0.5
    y = (y + mallet) * np.clip(t / 0.002, 0, 1)
    return sat(y * vel, 1.2)


def timp_roll(midi, dur, v0=0.15, v1=1.0, seed=0, rate=17.0):
    """single-stroke roll with crescendo (v0 -> v1)"""
    n = int((dur + 2.0) * SR)
    out = np.zeros(n)
    r = rng(seed)
    k, tt = 0, 0.0
    while tt < dur:
        u = tt / dur
        v = v0 + (v1 - v0) * u ** 1.5
        h = timpani(midi, v * r.uniform(0.85, 1.0), seed=seed + k, d=1.6)
        i = int(tt * SR); out[i:i + len(h)] += h[: n - i] * 0.55
        tt += 1 / rate * r.uniform(0.9, 1.1); k += 1
    return out


def taiko(vel=1.0, f=62, seed=0):
    d = 1.4
    t = t_axis(d)
    body = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-t / 0.03))) / SR) * np.exp(-t / 0.28)
    skin = bp(white(d, seed), 120, 900) * np.exp(-t / 0.05) * 0.7
    slap = bp(white(d, seed + 1), 1500, 5000) * np.exp(-t / 0.008) * 0.25
    return sat((body + skin + slap) * np.clip(t / 0.001, 0, 1) * vel, 1.5)


def kick(vel=1.0, seed=0):
    d = 0.5
    t = t_axis(d)
    f = 48 + 110 * np.exp(-t / 0.035)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    y += bp(white(d, seed), 2000, 7000) * np.exp(-t / 0.004) * 0.15
    return sat(y * vel, 1.4)


def snare(vel=1.0, seed=0):
    """orchestral-ish snare: tight head tone + band-passed wires"""
    d = 0.45
    t = t_axis(d)
    tone = (np.sin(2 * np.pi * 190 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t / 0.04) * 0.6
    wires = bp(white(d, seed), 1800, 9000) * np.exp(-t / 0.11)
    return (tone + wires) * np.clip(t / 0.0008, 0, 1) * vel


def snare_roll(dur, v0=0.1, v1=0.9, seed=0, rate=24.0):
    n = int((dur + 0.5) * SR)
    out = np.zeros(n)
    r = rng(seed)
    k, tt = 0, 0.0
    while tt < dur:
        v = v0 + (v1 - v0) * (tt / dur) ** 1.4
        s = snare(v * r.uniform(0.8, 1.0), seed + k) * 0.6
        i = int(tt * SR); out[i:i + len(s)] += s[: n - i]
        tt += 1 / rate; k += 1
    return out


def hat(vel=0.5, open_=False, seed=0):
    d = 0.5 if open_ else 0.09
    t = t_axis(d)
    y = hp(white(d, seed), 7000) * np.exp(-t / (0.18 if open_ else 0.02))
    return y * vel


def shaker(vel=0.4, seed=0):
    d = 0.12
    t = t_axis(d)
    y = bp(white(d, seed), 4000, 11000) * (t / 0.02) * np.exp(-t / 0.025)
    return y * vel


def crash(vel=0.8, seed=0, d=3.5):
    t = t_axis(d)
    r = rng(seed)
    y = hp(white(d, seed), 4000) * np.exp(-t / 1.1) * 0.6
    for k in range(60):
        fk = r.uniform(3000, 12000)
        y += np.sin(2 * np.pi * fk * t + r.uniform(0, 6)) * np.exp(-t / r.uniform(0.4, 1.6)) * 0.02
    y += bp(white(d, seed + 1), 500, 3000) * np.exp(-t / 0.05) * 0.4
    return widen(y * np.clip(t / 0.002, 0, 1) * vel, 14, 0.8)


def reverse_cymbal(dur=1.6, seed=0):
    c = crash(1.0, seed, d=dur)
    c = c[::-1].copy()
    t = np.arange(len(c)) / SR
    return c * (t / dur)[:, None] ** 1.5


def riser(dur=2.0, f0=200, f1=2400, seed=0, tonal=True):
    t = t_axis(dur)
    u = t / dur
    nz = sweep_filter(pink(dur, seed), f0 * 2, f1 * 3, kind="bp", q=1.5) * 1.2
    y = nz
    if tonal:
        f = f0 * (f1 / f0) ** (u ** 1.3)
        y = y + lp(saw(f) + saw(f * 1.007), 5000) * 0.12
    return widen(y * u ** 2.2, 12, 0.6)


def sub_boom(vel=1.0, f0=70, f1=30, d=2.0):
    t = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7) * np.clip(t / 0.003, 0, 1) * vel


# ============================================================================ score canvas
BUS_FX = {
    #          eq                                                             reverb send
    "strings": ([("hp", 45, 0.7, 0), ("peak", 3500, 0.8, 1.0)], 0.30),
    "brass":   ([("hp", 70, 0.7, 0), ("peak", 600, 1.0, -1.0)], 0.28),
    "keys":    ([("hp", 300, 0.7, 0)], 0.40),
    "perc":    ([("hp", 30, 0.7, 0)], 0.14),
    "low":     ([("hp", 28, 0.7, 0), ("lp", 4000, 0.7, 0)], 0.10),
    "fx":      ([("hp", 80, 0.7, 0)], 0.35),
}


class Score:
    def __init__(self, dur: float, ir_dur: float = 2.6):
        self.dur = dur
        self.n = int(dur * SR)
        self.bus = {k: np.zeros((self.n, 2)) for k in BUS_FX}
        self.ir = make_ir(dur=ir_dur, predelay=0.022, damp_hz=6500, bright_end_hz=1500, seed=101)

    def add(self, bus: str, x: np.ndarray, t: float, gain_db: float = 0.0, pan_: float = 0.0):
        x = pan(x, pan_) if x.ndim == 1 else (pan(x, pan_) if pan_ else x)
        i = int(round(t * SR))
        if i < 0:
            x = x[-i:]; i = 0
        m = min(len(x), self.n - i)
        if m > 0:
            self.bus[bus][i:i + m] += x[:m] * 10 ** (gain_db / 20)

    def render(self, stems_dir: str | None = None) -> np.ndarray:
        send = np.zeros((self.n, 2))
        dry = np.zeros((self.n, 2))
        for k, (bands, s) in BUS_FX.items():
            y = eq(self.bus[k], bands)
            self.bus[k] = y
            dry += y
            send += y * s
        wet = reverb(send, self.ir, wet=1.0, dry=0.0)[: self.n]
        out = dry + wet * 0.55
        out = compress(out, thresh_db=-16, ratio=1.8, att=0.02, rel=0.25, makeup_db=0.0)  # glue
        if stems_dir:
            os.makedirs(stems_dir, exist_ok=True)
            for k in BUS_FX:
                write_wav(os.path.join(stems_dir, f"{k}.wav"), self.bus[k] * 0.5)
        return out


# ============================================================================ sections
def sec_expectant(sc: Score, t0: float, t1: float, key="D"):
    """anticipation swell: low drone, rising chords over a pedal, timpani roll, scale run, riser -> downbeat"""
    d = t1 - t0
    k = NOTE[key]
    D2, D3 = 38 + k - 2, 50 + k - 2               # key-relative (D -> 38/50)
    sc.add("low", string_pad([D2, D2 + 7], d + 0.2, att=1.2, rel=0.6, bright=420, bright_end=1400, voices=4,
                             swell=True, seed=1), t0, -7)
    sc.add("low", sub_boom(0.7, 55, 36, 3.0), t0, -14)
    steps = [(0.0, [D3 + 8, D3 + 12, D3 + 15]),        # Bb/D  (bVI)
             (d * 0.34, [D3 + 10, D3 + 14, D3 + 17]),  # C/D   (bVII)
             (d * 0.67, [D3 + 7, D3 + 12, D3 + 14]),   # Asus4
             (d * 0.84, [D3 + 7, D3 + 11, D3 + 14])]   # A
    for i, (tt, ch) in enumerate(steps):
        nd = (steps[i + 1][0] if i + 1 < len(steps) else d) - tt
        sc.add("strings", string_pad(ch, nd + 0.15, att=0.35 if i else 0.9, rel=0.35, bright=1400 + 500 * i,
                                     bright_end=2200 + 700 * i, seed=10 + i, swell=i == 0), t0 + tt, [-13, -9, -6, -4][i])
    # horns join on the last two chords
    sc.add("brass", brass(D3 + 7, d * 0.16, vel=0.45, seed=3), t0 + d * 0.67, -4)
    sc.add("brass", brass(D3 + 7 - 12, d * 0.32, vel=0.5, seed=4), t0 + d * 0.67, -5)
    sc.add("brass", brass(D3 + 11, d * 0.15, vel=0.6, seed=5), t0 + d * 0.84, -4)
    # timpani: two soft strokes, then roll crescendo into the downbeat
    sc.add("perc", timpani(D2 + 7, 0.35, seed=1), t0 + 0.02, -12)
    sc.add("perc", timp_roll(D2 + 7, d * 0.48, 0.12, 1.0, seed=5), t0 + d * 0.52 - 0.02, -13)
    # 16th scale run to the downbeat (strings, octave doubled)
    g = Grid(t1 - 8 * 60 / 144 / 4, 144 * 4)
    for i, s in enumerate([0, 2, 4, 5, 7, 9, 11, 12]):
        for o in (12, 24):
            sc.add("strings", string_stacc(D3 + s + o, 0.45 + 0.07 * i, length=0.11, seed=i + o), g.beat(i), -6, 0.15 if o == 24 else -0.15)
    sc.add("fx", riser(d * 0.55, 150, 2000, seed=3), t1 - d * 0.55, -11)
    sc.add("fx", reverse_cymbal(1.5, seed=2), t1 - 1.5, -9)


def drums_drive(sc, g: Grid, bars, level=1.0, snare_on=True, hats=True, taiko_on=True, seed=0):
    for b in bars:
        for beat in range(4):
            tb = g.at(b, beat)
            if beat in (0, 2):
                sc.add("perc", kick(0.9 * level, seed), tb, -5)
            if snare_on and beat in (1, 3):
                sc.add("perc", snare(0.75 * level, seed + b * 4 + beat), tb, -10, 0.1)
            if hats:
                for h in (0, 0.5):
                    sc.add("perc", hat(0.35 * level * (1.0 if h else 0.7), seed=seed + b * 8 + beat * 2 + int(h * 2)),
                           g.at(b, beat + h), -14, 0.35)
            else:
                for h in (0, 0.25, 0.5, 0.75):
                    sc.add("perc", shaker(0.4 * level, seed + b * 16 + beat * 4 + int(h * 4)), g.at(b, beat + h), -15, 0.3)
        sc.add("perc", kick(0.7 * level, seed), g.at(b, 1.5), -8)
        if taiko_on:
            sc.add("perc", taiko(0.8 * level, seed=b), g.at(b, 0), -10, -0.1)


def ostinato_8ths(sc, g: Grid, bar, chord_name, vel=0.7, octave=3, pattern=(0, 2, 1, 2, 0, 2, 1, 2), gain=-4, seed=0):
    ch = chord(chord_name, octave)
    tones = [ch[0], ch[1], ch[2]]
    for i, p in enumerate(pattern):
        acc = 1.0 if i % 4 == 0 else 0.8
        sc.add("strings", string_stacc(tones[p], vel * acc, length=0.13, seed=seed + bar * 8 + i), g.at(bar, i * 0.5), gain,
               -0.25 if p == 0 else 0.25)


def bass_8ths(sc, g: Grid, bar, root_midi, vel=0.8, gain=-3, seed=0):
    for i in range(8):
        acc = 1.0 if i in (0, 3, 6) else 0.7
        sc.add("low", string_stacc(root_midi, vel * acc, length=0.14, voices=3, bright=1400, seed=seed + i), g.at(bar, i * 0.5), gain)
        sc.add("low", string_stacc(root_midi - 12, vel * acc * 0.7, length=0.14, voices=2, bright=900, seed=seed + 50 + i),
               g.at(bar, i * 0.5), gain - 2)


def melody(sc, g: Grid, bar0, notes, vel=0.8, gain=-3, harmony=None, harm_gain=-9, seed=0, bus="brass", pan_=0.1):
    """notes: [(bar_offset, beat, 'A5', beats), ...]; harmony: semitone shift list or None"""
    for i, (bo, beat, nm, beats) in enumerate(notes):
        dur = beats * g.b * 0.95
        m = note(nm)
        sc.add(bus, brass(m - 12, dur, vel, seed=seed + i), g.at(bar0 + bo, beat), gain, pan_)
        if harmony:
            sc.add(bus, brass(m - 12 + harmony[i % len(harmony)], dur, vel * 0.8, seed=seed + 40 + i),
                   g.at(bar0 + bo, beat), harm_gain, -pan_)


def sec_bright_drive(sc: Score, t0: float, t1: float, bpm=144):
    """bright, driving D major.  bars (4/4 @144 = 1.667 s): 0-1 light (O2 pickup), 2-5 full (run),
    6-7 lighter (capillary), 8 warm hold (delivery / relief), then a short breath before the next section."""
    g = Grid(t0, bpm)
    prog = ["D", "A", "Bm", "G", "D", "A", "G", "A"]
    nbars = 8
    for b, c in enumerate(prog[:nbars]):
        bt = g.bar(b)
        full = 2 <= b <= 5
        light = b <= 1
        # sustained strings underneath
        sc.add("strings", string_pad(chord(c, 3 if c not in ("A",) else 3), g.bpb * g.b + 0.1, att=0.15, rel=0.3,
                                     bright=2400 if full else 1800, seed=20 + b), bt, -9 if full else -8)
        ostinato_8ths(sc, g, b, c, vel=0.55 if light else 0.75 if full else 0.6, octave=4, gain=-1, seed=b * 10)
        bass_8ths(sc, g, b, root_of(c, 2), vel=0.55 if light else 0.85 if full else 0.65, gain=-2, seed=b * 20)
        if light:
            drums_drive(sc, g, [b], level=0.6, snare_on=False, hats=False, taiko_on=b == 0, seed=b)
        elif full:
            drums_drive(sc, g, [b], level=1.0, snare_on=True, hats=True, taiko_on=True, seed=b)
        else:
            drums_drive(sc, g, [b], level=0.65, snare_on=False, hats=True, taiko_on=False, seed=b)
            # capillary colour: pizzicato chord tones on the off-beats
            ch = chord(c, 4)
            for i in range(8):
                sc.add("strings", pizz(ch[i % 3] + (12 if i % 4 == 3 else 0), 0.55, seed=i + b), g.at(b, i * 0.5 + 0.25), -9,
                       0.3 if i % 2 else -0.3)
    # glockenspiel sparkle over the light bars (O2 pickup)
    for i, nm in enumerate(["D6", "F#6", "A6", "D7", "A6", "F#6", "E6", "A6"]):
        sc.add("keys", glock(note(nm), 0.4, seed=i), g.at(0, 1 + i * 0.5), -12, 0.3)
    for i, nm in enumerate(["C#6", "E6", "A6", "C#7", "E7"]):
        sc.add("keys", glock(note(nm), 0.35, seed=i), g.at(1, 2 + i * 0.25), -13, -0.3)
    # brass theme over the run (bars 2-5)
    theme = [(0, 0, "D5", 1.5), (0, 1.5, "C#5", 0.5), (0, 2, "D5", 1), (0, 3, "F#5", 1),
             (1, 0, "G5", 1.5), (1, 1.5, "F#5", 0.5), (1, 2, "E5", 1), (1, 3, "D5", 1),
             (2, 0, "A5", 2), (2, 2, "F#5", 1), (2, 3, "A5", 1),
             (3, 0, "B5", 1), (3, 1, "A5", 1), (3, 2, "E5", 2)]
    melody(sc, g, 2, theme, vel=0.85, gain=0, harm_gain=-5, harmony=[-3, -5, -4, -3, -4, -3, -3, -4, -5, -3, -5, -4, -5, -5], seed=70)
    # counter line in the lighter bars: horns, soft
    melody(sc, g, 6, [(0, 0, "B4", 2), (0, 2, "D5", 2), (1, 0, "C#5", 2), (1, 2, "E5", 2)], vel=0.6, gain=-6, seed=90)
    # crashes on section downbeats
    sc.add("perc", crash(0.8, 1), t0, -6)
    sc.add("perc", crash(0.75, 2), g.bar(2), -7)
    sc.add("perc", crash(0.5, 3), g.bar(6), -11)
    # bar 8: warm hold (Gmaj7 -> Dadd9) - delivery & relief, no drums
    tb = g.bar(8)
    hold = t1 - tb
    sc.add("strings", string_pad(chord("Gmaj7", 3), hold * 0.5 + 0.2, att=0.12, rel=0.5, bright=2200, seed=31), tb, -5)
    sc.add("strings", string_pad(chord("Dadd9", 3), hold * 0.5 + 0.3, att=0.3, rel=0.25, bright=2000, seed=32),
           tb + hold * 0.5, -6)
    sc.add("brass", brass(note("D4"), hold * 0.45, 0.5, seed=33), tb, -9)
    sc.add("low", string_pad([root_of("G", 2)], hold * 0.5 + 0.2, att=0.1, rel=0.4, bright=600, seed=34), tb, -4)
    sc.add("low", string_pad([root_of("D", 2)], hold * 0.5 + 0.2, att=0.3, rel=0.2, bright=600, seed=35), tb + hold * 0.5, -5)
    for i, nm in enumerate(["A6", "D7", "F#7"]):
        sc.add("keys", glock(note(nm), 0.35, seed=40 + i), tb + hold * 0.5 + 0.12 * i, -12)
    sc.add("perc", timpani(root_of("D", 2), 0.4, seed=7), tb, -9)


def sec_tense(sc: Score, t0: float, t1: float, bpm=144, hits=(0.0, 2.0, 2.3)):
    """sudden tension: phrygian 16th ostinato in the low strings, low hits, tremolo cluster swell,
    timpani roll + riser into the next section.  hits: offsets (s) of extra low hits."""
    g = Grid(t0, bpm * 4)                         # 16ths
    D3 = note("D3")
    pat = [0, 0, 12, 0, 1, 0, 12, 0, 3, 0, 12, 0, 1, 0, 12, 0]
    n16 = int((t1 - t0 - 0.05) / g.b)
    for i in range(n16):
        u = i / max(1, n16 - 1)
        v = (0.55 + 0.4 * u) * (1.0 if i % 4 == 0 else 0.75)
        sc.add("strings", string_stacc(D3 + pat[i % 16], v, length=0.08, seed=i), g.beat(i), 0, -0.2)
        if i % 2 == 0:
            sc.add("low", string_stacc(D3 - 12 + (pat[i % 16] % 12), v * 0.9, length=0.09, bright=1200, seed=200 + i), g.beat(i), -2)
    # first hit: everything at once
    sc.add("perc", taiko(1.0, 55, 1), t0, 0)
    sc.add("low", sub_boom(1.0, 75, 32), t0, -2)
    for m in (note("D2"), note("A2"), note("D3"), note("Eb3")):
        sc.add("brass", brass(m, 0.35, 0.95, att=0.012, seed=m), t0, -4)
    sc.add("perc", crash(0.6, 5, d=2.5), t0, -10)
    for h in hits[1:]:
        sc.add("perc", taiko(0.85, 58, int(h * 10)), t0 + h, -3)
        sc.add("low", sub_boom(0.7, 70, 35, 1.2), t0 + h, -6)
        sc.add("brass", brass(note("D2"), 0.25, 0.85, att=0.01, seed=int(h * 10)), t0 + h, -6)
    # tremolo cluster swell
    sc.add("strings", string_trem([note("D5"), note("Eb5"), note("A5")], t1 - t0 - 0.9, 0.6, seed=7), t0 + 0.8, -6)
    sc.add("strings", string_trem([note("D4"), note("A4")], t1 - t0 - 1.5, 0.6, seed=8), t0 + 1.4, -7)
    # into the next section
    sc.add("perc", timp_roll(note("A2"), 0.95, 0.2, 1.0, seed=9), t1 - 0.98, -4)
    sc.add("fx", riser(1.6, 180, 2600, seed=11), t1 - 1.6, -10)
    sc.add("fx", reverse_cymbal(1.2, seed=12), t1 - 1.2, -10)


def sec_heroic(sc: Score, t0: float, t1: float, bpm=144):
    """heroic drive in D minor (bVI-bVII-i), driving drums, brass theme, snare roll into the hit at t1"""
    g = Grid(t0, bpm)
    bars = [("Bb", "C"), ("Dm", "Bb"), ("F", "A")]
    for b, (c1, c2) in enumerate(bars):
        for half, c in enumerate((c1, c2)):
            tb = g.at(b, half * 2)
            sc.add("strings", string_pad(chord(c, 3), 2 * g.b + 0.05, att=0.06, rel=0.25, bright=3000, seed=50 + b * 2 + half),
                   tb, -8)
            ch = chord(c, 4)
            for i in range(4):
                sc.add("strings", string_stacc(ch[[0, 2, 1, 2][i]], 0.85 if i == 0 else 0.7, length=0.12, seed=b * 40 + half * 8 + i),
                       g.at(b, half * 2 + i * 0.5), -2, 0.2 if i % 2 else -0.2)
            for i in range(4):
                sc.add("low", string_stacc(root_of(c, 2), 0.95 if i in (0, 3) else 0.75, length=0.14, bright=1500, seed=300 + b * 8 + i),
                       g.at(b, half * 2 + i * 0.5), -3)
                sc.add("low", string_stacc(root_of(c, 1), 0.7, length=0.14, bright=900, seed=330 + b * 8 + i),
                       g.at(b, half * 2 + i * 0.5), -6)
        # drums
        for beat in range(4):
            sc.add("perc", kick(1.0, b), g.at(b, beat), -6)
            if beat in (1, 3):
                sc.add("perc", snare(0.9, b * 4 + beat), g.at(b, beat), -9, 0.08)
            for h in (0.5,):
                sc.add("perc", taiko(0.55, 95, b * 4 + beat), g.at(b, beat + h), -13, 0.25 if beat % 2 else -0.25)
            sc.add("perc", hat(0.4, seed=b * 4 + beat), g.at(b, beat + 0.5), -15, 0.35)
        sc.add("perc", taiko(1.0, 55, 90 + b), g.at(b, 0), -7)
    sc.add("perc", crash(0.9, 7), t0, -5)
    sc.add("perc", crash(0.6, 8), g.at(1, 0), -10)
    theme = [(0, 0, "D5", 1), (0, 1, "A4", 0.5), (0, 1.5, "D5", 0.5), (0, 2, "F5", 1), (0, 3, "E5", 0.5), (0, 3.5, "D5", 0.5),
             (1, 0, "C5", 1), (1, 1, "D5", 1), (1, 2, "A5", 2),
             (2, 0, "A5", 1), (2, 1, "G5", 0.5), (2, 1.5, "F5", 0.5), (2, 2, "E5", 2)]
    melody(sc, g, 0, theme, vel=0.95, gain=1, harmony=[-5, -5, -5, -3, -3, -5, -3, -4, -5, -4, -3, -3, -3], harm_gain=-3, seed=120)
    # low brass power under the theme
    for b, (c1, c2) in enumerate(bars):
        for half, c in enumerate((c1, c2)):
            sc.add("brass", brass(root_of(c, 2) + 12, 2 * g.b * 0.9, 0.7, seed=160 + b * 2 + half), g.at(b, half * 2), -5)
    # snare roll + timpani into the hit
    sc.add("perc", snare_roll(1.2 * g.bpb * g.b / 2, 0.15, 1.0, seed=17), t1 - 1.2 * g.bpb * g.b / 2, -6)
    sc.add("perc", timp_roll(note("A2"), 0.8, 0.3, 1.0, seed=19), t1 - 0.8, -5)
    sc.add("fx", reverse_cymbal(1.0, seed=21), t1 - 1.0, -10)


def sec_hit_ringout(sc: Score, t0: float, t_end: float, bpm=144):
    """tutti hit on t0 (D major), chord rings on; a soft low pulse keeps going so it leads into the next scene."""
    ring = t_end - t0
    for m in [note(x) for x in ("D3", "A3", "D4", "F#4", "A4", "D5")]:
        sc.add("brass", brass(m - 12, min(1.6, ring), 1.0, att=0.008, rel=1.2, seed=m), t0, -3)
    sc.add("strings", string_pad(chord("Dadd9", 3) + [note("D5"), note("F#5")], ring, att=0.01, rel=1.0, bright=4200, seed=60), t0, -3)
    sc.add("low", string_pad([note("D2"), note("A2")], ring, att=0.01, rel=1.0, bright=800, seed=61), t0, -2)
    sc.add("perc", timpani(note("D2"), 1.0, seed=2), t0, -1)
    sc.add("perc", taiko(1.0, 50, 3), t0, -1)
    sc.add("low", sub_boom(1.0, 80, 30, 3.0), t0, -1)
    sc.add("perc", crash(1.0, 9, d=4.0), t0, -3)
    # it does not end: low pulse resumes after the hit, quietly
    g = Grid(t0, bpm)
    k = 1.0
    while g.beat(k) < t_end:
        tb = g.beat(k)
        for h in (0, 0.5):
            if g.beat(k + h) < t_end - 0.05:
                sc.add("low", string_stacc(note("D2"), 0.55, length=0.13, bright=1000, seed=int(k * 4 + h * 2)), g.beat(k + h), -8)
        if int(k) % 2 == 0:
            sc.add("perc", timpani(note("D2"), 0.3, seed=int(k)), tb, -12)
        k += 1


# --- sketches for the rest of the episode (same kit) ---------------------------------------
def sec_calm_bed(sc: Score, t0: float, t1: float, prog=("D", "Bm", "G", "A"), bar_s=3.2):
    """explanation bed: soft strings, slow glock arpeggios, no drums"""
    b, t = 0, t0
    while t < t1 - 0.1:
        c = prog[b % len(prog)]
        sc.add("strings", string_pad(chord(c, 3), min(bar_s, t1 - t) + 0.3, att=0.8, rel=1.0, bright=1500, seed=b), t, -10)
        sc.add("low", string_pad([root_of(c, 2)], min(bar_s, t1 - t) + 0.3, att=0.8, rel=1.0, bright=500, seed=b + 50), t, -9)
        for i, m in enumerate(chord(c, 5) + [chord(c, 5)[0] + 12]):
            sc.add("keys", glock(m, 0.25, seed=b * 4 + i), t + i * bar_s / 4, -16, 0.3 if i % 2 else -0.3)
        t += bar_s; b += 1


def sec_mystery(sc: Score, t0: float, t1: float):
    """mystery: low drone, tritone tremolo, sparse timpani"""
    d = t1 - t0
    sc.add("low", string_pad([note("D2"), note("Ab2")], d, att=1.5, rel=1.0, bright=500, seed=1), t0, -6)
    sc.add("strings", string_trem([note("D5"), note("Ab5")], d, 0.4, rate=9, seed=2, bright=2500), t0, -14)
    tt = t0 + 1.0
    while tt < t1 - 0.5:
        sc.add("perc", timpani(note("D2"), 0.35, seed=int(tt)), tt, -10); tt += 2.7


def sec_battle(sc: Score, t0: float, t1: float, bpm=152):
    """battle: the tense ostinato under the heroic drums, alternating i / bVI"""
    g = Grid(t0, bpm)
    nb = int((t1 - t0) / (g.b * 4))
    sec_tense(sc, t0, t1, bpm=bpm, hits=(0.0,))
    for b in range(nb):
        for beat in range(4):
            sc.add("perc", kick(1.0, b), g.at(b, beat), -3)
            if beat in (1, 3):
                sc.add("perc", snare(0.9, b * 4 + beat), g.at(b, beat), -6)
        c = "Dm" if b % 2 == 0 else "Bb"
        sc.add("brass", brass(root_of(c, 3), g.b * 3.6, 0.85, seed=b), g.at(b, 0), -6)


def sec_warm_ending(sc: Score, t0: float, t1: float):
    """warm ending: I - IV - vi - V - I in slow strings with a horn line"""
    prog = ["D", "G", "Bm", "A", "D"]
    seg = (t1 - t0) / len(prog)
    for i, c in enumerate(prog):
        sc.add("strings", string_pad(chord(c, 3), seg + 0.4, att=0.6, rel=1.2, bright=2000, seed=i), t0 + i * seg, -7)
        sc.add("low", string_pad([root_of(c, 2)], seg + 0.4, att=0.6, rel=1.2, bright=500, seed=i + 9), t0 + i * seg, -7)
    for i, (nm, beats) in enumerate([("F#5", 1), ("G5", 1), ("A5", 1), ("E5", 1), ("D5", 1)]):
        sc.add("brass", brass(note(nm) - 12, seg * 0.9, 0.55, seed=i), t0 + i * seg, -9)


# ============================================================================ cues
def render_intro(stems=False):
    """the intro cue (0-33 s; the mix uses 0-30 and the rest is there for a continuation)"""
    from intro_timeline import BPM
    pre = Score(20.3 + 2.0)                       # bright part rendered separately so its tails can be cut at 20.3
    sec_expectant(pre, 0.0, 5.0)
    sec_bright_drive(pre, 5.0, 20.3, bpm=BPM)
    a = pre.render(os.path.join(BGM_DIR, "stems_part1") if stems else None)
    post = Score(33.0)
    sec_tense(post, 20.3, 24.5, bpm=BPM, hits=(0.0, 2.0, 2.3))
    sec_heroic(post, 24.5, 29.5, bpm=BPM)
    sec_hit_ringout(post, 29.5, 33.0, bpm=BPM)
    b = post.render(os.path.join(BGM_DIR, "stems_part2") if stems else None)
    # bright part: fast duck at 20.3 (keeps only a hint of the hall), so the switch is sudden
    out = b.copy()
    g = np.ones(len(a))
    c0 = int(20.25 * SR); c1 = int(20.36 * SR)
    g[c0:c1] = np.linspace(1, 0.12, c1 - c0)
    g[c1:] = 0.12 * np.exp(-(np.arange(len(a) - c1) / SR) / 0.25)
    out[: len(a)] += a * g[:, None]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cue", default="intro", choices=["intro", "calm", "mystery", "battle", "warm"])
    ap.add_argument("--stems", action="store_true", help="also write per-bus stems (bgm/stems_part1|2/<bus>.wav)")
    a = ap.parse_args()
    os.makedirs(BGM_DIR, exist_ok=True)
    if a.cue == "intro":
        y = render_intro(a.stems)
        y = normalize_peak(y, -1.0)
        write_wav(os.path.join(BGM_DIR, "intro_bgm.wav"), y)
        print(f"  bgm/intro_bgm.wav {len(y) / SR:.2f}s")
        return
    dur = 30.0
    sc = Score(dur + 2)
    {"calm": lambda: sec_calm_bed(sc, 0, dur), "mystery": lambda: sec_mystery(sc, 0, dur),
     "battle": lambda: sec_battle(sc, 0, dur), "warm": lambda: sec_warm_ending(sc, 0, dur)}[a.cue]()
    y = normalize_peak(fade(sc.render(), 0.01, 2.0), -1.0)
    name = {"calm": "calm_bed", "mystery": "mystery", "battle": "battle", "warm": "warm_ending"}[a.cue]
    write_wav(os.path.join(BGM_DIR, f"{name}.wav"), y)
    print(f"  bgm/{name}.wav {len(y) / SR:.2f}s")


if __name__ == "__main__":
    main()

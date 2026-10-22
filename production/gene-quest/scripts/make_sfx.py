#!/usr/bin/env python3
"""効果音を合成する（外部素材なし。ノイズと正弦波だけで作るので権利の制約がない）。

  python scripts/make_sfx.py   → assets/sound_effects/<名前>.wav（48 kHz モノラル）

効果音は「理解の補助」に限り、控えめな音量で使う（ミックス時にさらに −10 dB 前後で重ねる）。
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import ASSETS  # noqa: E402

SR = 48000
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(SR * d)) / SR


def env(d, a=0.005, r=None, curve=4.0):
    t = t_(d)
    e = np.minimum(1, t / max(a, 1e-4))
    rr = r if r is not None else d
    return e * np.exp(-curve * t / rr)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def norm(x, peak_db=-6.0):
    x = x - np.mean(x)
    m = np.max(np.abs(x)) + 1e-9
    return x / m * 10 ** (peak_db / 20)


def fade(x, fin=0.005, fout=0.03):
    n_in, n_out = int(SR * fin), int(SR * fout)
    x = x.copy()
    if n_in:
        x[:n_in] *= np.linspace(0, 1, n_in)
    if n_out:
        x[-n_out:] *= np.linspace(1, 0, n_out)
    return x


def sweep_noise(d, f0, f1, q=3.0):
    n = rng.standard_normal(int(SR * d))
    out = np.zeros_like(n)
    seg = 512
    for i in range(0, len(n), seg):
        u = i / len(n)
        f = f0 * (f1 / f0) ** u
        lo, hi = f / (1 + 1 / q), f * (1 + 1 / q)
        out[i:i + seg] = bp(n[max(0, i - 2048):i + seg], max(30, lo), hi)[-len(n[i:i + seg]):]
    return out


def bell(freqs, d, decay=3.0):
    t = t_(d)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-decay * (1 + k * 0.4) * t) / (1 + k) for k, f in enumerate(freqs))
    return x * np.minimum(1, t / 0.003)


SFX = {}


def sfx(fn):
    SFX[fn.__name__] = fn
    return fn


@sfx
def whoosh():
    d = 0.9
    x = sweep_noise(d, 300, 3000, 2.0) * np.sin(np.pi * t_(d) / d) ** 2
    return norm(x, -8)


@sfx
def shimmer():
    d = 2.8
    t = t_(d)
    x = sum(np.sin(2 * np.pi * f * t + k) * (0.6 + 0.4 * np.sin(2 * np.pi * (3 + k) * t)) for k, f in enumerate([1568, 2093, 2637, 3136]))
    x *= np.minimum(1, t / 0.8) * np.exp(-1.0 * t)
    return norm(x, -14)


@sfx
def impact():
    d = 2.0
    t = t_(d)
    boom = np.sin(2 * np.pi * (55 * np.exp(-1.2 * t) + 30) * t) * np.exp(-2.2 * t)
    hit = lp(rng.standard_normal(len(t)), 900) * np.exp(-14 * t)
    return norm(boom + 0.5 * hit, -4)


@sfx
def chime():
    return norm(bell([1046, 1568, 2093, 3136], 1.4, 3.2), -10)


@sfx
def sparkle():
    d = 1.0
    x = np.zeros(int(SR * d))
    for i in range(9):
        st = int(SR * (0.02 + i * 0.09 + rng.uniform(0, 0.03)))
        f = rng.uniform(2200, 4200)
        b = bell([f, f * 1.5], 0.35, 9)
        x[st:st + len(b)] += b[: len(x) - st]
    return norm(x, -12)


@sfx
def pop():
    d = 0.14
    t = t_(d)
    x = np.sin(2 * np.pi * (900 * np.exp(-18 * t) + 250) * t) * env(d, 0.002, 0.05, 3)
    return norm(x, -8)


@sfx
def click():
    d = 0.05
    x = hp(rng.standard_normal(int(SR * d)), 2000) * env(d, 0.0005, 0.01, 3)
    return norm(x, -12)


@sfx
def ping():
    return norm(bell([1318, 2637], 0.5, 7), -12)


@sfx
def rumble():
    d = 1.6
    t = t_(d)
    x = lp(rng.standard_normal(len(t)), 140) * np.sin(np.pi * t / d)
    return norm(x, -8)


@sfx
def stamp():
    d = 0.4
    t = t_(d)
    x = np.sin(2 * np.pi * 110 * t) * np.exp(-14 * t) + 0.4 * hp(rng.standard_normal(len(t)), 1500) * np.exp(-60 * t)
    return norm(x, -6)


@sfx
def tick():
    """考える時間の5秒（チクタク10回）。"""
    d = 5.0
    x = np.zeros(int(SR * d))
    for i in range(10):
        st = int(SR * i * 0.5)
        f = 2400 if i % 2 == 0 else 1800
        b = bell([f], 0.06, 60) + 0.3 * hp(rng.standard_normal(int(SR * 0.06)), 3000) * np.exp(-80 * t_(0.06))
        x[st:st + len(b)] += b
    return norm(x, -14)


@sfx
def correct():
    d = 1.2
    x = np.zeros(int(SR * d))
    for i, f in enumerate([1046.5, 1318.5, 1568.0]):
        b = bell([f, f * 2], 0.9, 4)
        st = int(SR * i * 0.09)
        x[st:st + len(b)] += b[: len(x) - st]
    return norm(x, -8)


@sfx
def switch():
    d = 0.25
    t = t_(d)
    x = 0.6 * hp(rng.standard_normal(len(t)), 2500) * np.exp(-90 * t) + np.sin(2 * np.pi * 880 * t) * np.exp(-25 * t) * (t > 0.03)
    return norm(x, -10)


@sfx
def snip():
    d = 0.3
    x = np.zeros(int(SR * d))
    for st in (0.0, 0.12):
        n = hp(rng.standard_normal(int(SR * 0.05)), 3500) * np.exp(-90 * t_(0.05))
        i = int(SR * st)
        x[i:i + len(n)] += n
    return norm(x, -10)


@sfx
def twist():
    d = 0.6
    t = t_(d)
    f = 400 + 500 * t / d + 60 * np.sin(2 * np.pi * 12 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d)
    return norm(x, -14)


@sfx
def clamp():
    d = 0.6
    x = bell([220, 587, 932, 1450], d, 9) + 0.4 * lp(rng.standard_normal(int(SR * d)), 1200) * np.exp(-40 * t_(d))
    return norm(x, -9)


@sfx
def unzip():
    d = 0.7
    x = sweep_noise(d, 800, 5000, 3)
    grains = (np.sin(2 * np.pi * 45 * t_(d)) > 0.6).astype(float)
    return norm(x * (0.4 + 0.6 * grains) * np.sin(np.pi * t_(d) / d), -12)


@sfx
def bend():
    d = 0.8
    t = t_(d)
    f = 300 * np.exp(-1.2 * t) + 90
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.02, 0.5, 2)
    return norm(x, -10)


@sfx
def glow():
    d = 1.6
    t = t_(d)
    x = sum(np.sin(2 * np.pi * f * t) for f in (523.3, 659.3, 784.0)) * np.sin(np.pi * t / d) ** 2
    return norm(x, -16)


@sfx
def spark():
    d = 0.6
    x = np.zeros(int(SR * d))
    for _ in range(25):
        i = int(rng.uniform(0, d - 0.02) * SR)
        n = hp(rng.standard_normal(int(SR * 0.008)), 4000)
        x[i:i + len(n)] += n * rng.uniform(0.3, 1)
    return norm(x * np.exp(-3 * t_(d)), -14)


@sfx
def charge():
    d = 1.0
    t = t_(d)
    f = 200 * (8 ** (t / d))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) * np.exp(-0.5 * t)
    return norm(fade(x, 0.01, 0.08), -14)


@sfx
def card():
    d = 0.25
    t = t_(d)
    x = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-25 * t)
    return norm(x, -12)


@sfx
def crumble():
    d = 1.0
    x = np.zeros(int(SR * d))
    for _ in range(60):
        i = int(rng.uniform(0, 0.9) * SR)
        n = bp(rng.standard_normal(int(SR * 0.02)), 300, 2500) * np.exp(-150 * t_(0.02))
        x[i:i + len(n)] += n * rng.uniform(0.2, 1)
    return norm(x * np.exp(-2 * t_(d)), -12)


@sfx
def buzz():
    d = 0.35
    t = t_(d)
    x = signal.square(2 * np.pi * 140 * t) * env(d, 0.005, 0.3, 2)
    return norm(lp(x, 1800), -16)


@sfx
def crack():
    d = 0.9
    t = t_(d)
    x = hp(rng.standard_normal(len(t)), 1200) * np.exp(-35 * t) + 0.5 * bell([1730, 2890, 4410], d, 6)
    return norm(x, -8)


@sfx
def soft():
    d = 1.8
    t = t_(d)
    x = (np.sin(2 * np.pi * 220 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * np.sin(np.pi * t / d) ** 2
    return norm(x, -18)


def main() -> None:
    out = ASSETS / "sound_effects"
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in SFX.items():
        x = fade(fn().astype(np.float32), 0.002, 0.02)
        sf.write(out / f"{name}.wav", x, SR, subtype="PCM_16")
    print(f"{len(SFX)} 個の効果音 → {out}")


if __name__ == "__main__":
    main()

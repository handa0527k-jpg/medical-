#!/usr/bin/env python3
"""効果音を合成する（外部素材なし）。

    python3 tools/sfx.py      → build/sfx/<name>.wav と assets/sound_effects/<name>.mp3
"""
import os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from music import SR, lowpass, highpass, bandpass, hz, inst_brass, inst_bell, drum  # noqa: E402

R = np.random.default_rng(3)


def T(sec):
    return np.arange(int(sec * SR)) / SR


def noise(sec):
    return R.standard_normal(int(sec * SR)).astype(np.float32)


def sweep(f0, f1, sec, shape='exp'):
    t = T(sec)
    f = f0 * (f1 / f0) ** (t / sec) if shape == 'exp' else f0 + (f1 - f0) * t / sec
    return np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32)


def cat(*xs):
    return np.concatenate(xs).astype(np.float32)


def mixat(base_len, parts):
    out = np.zeros(int(base_len * SR), np.float32)
    for t0, x in parts:
        i = int(t0 * SR)
        x = x[:len(out) - i]
        out[i:i + len(x)] += x
    return out


def make():
    S = {}
    t = T(1.6)
    S['rumble'] = lowpass(noise(1.6), 120, 4) * np.sin(np.pi * t / 1.6) * 3.0 + 0.3 * np.sin(2 * np.pi * 38 * t) * np.sin(np.pi * t / 1.6)
    S['stumble'] = mixat(0.7, [(0, drum('tom', 0.8)), (0.18, drum('tom', 0.6)), (0.3, sweep(600, 200, 0.3) * np.exp(-T(0.3) * 6) * 0.4)])
    S['pop'] = sweep(300, 1100, 0.09) * np.exp(-T(0.09) * 30) * 0.8
    sp = np.zeros(int(1.2 * SR), np.float32)
    for i, m in enumerate([84, 88, 91, 96, 100]):
        x = inst_bell(hz(m), 0.2, 0.7)
        j = int(i * 0.07 * SR)
        sp[j:j + len(x)] += x[:len(sp) - j]
    S['sparkle'] = sp
    S['buzzer'] = (np.sign(np.sin(2 * np.pi * 110 * T(0.5))) * 0.25 + np.sign(np.sin(2 * np.pi * 116 * T(0.5))) * 0.2) * np.exp(-T(0.5) * 2)
    S['buzzer'] = lowpass(S['buzzer'].astype(np.float32), 2500)
    S['zoom'] = cat(sweep(200, 2400, 0.7) * np.linspace(0, 1, int(0.7 * SR)) * 0.25) + bandpass(noise(0.7), 800, 6000) * np.linspace(0, 0.4, int(0.7 * SR))
    S['ding'] = inst_bell(hz(88), 0.5, 0.9) + inst_bell(hz(95), 0.5, 0.5) * 0.5
    w = T(0.55)
    S['whoosh'] = bandpass(noise(0.55), 400, 3500) * np.sin(np.pi * w / 0.55) ** 2 * 0.8
    al = np.sin(2 * np.pi * np.cumsum(880 + 300 * np.sign(np.sin(2 * np.pi * 4 * T(1.0)))) / SR)
    S['alarm'] = lowpass((np.tanh(al * 2) * 0.3).astype(np.float32), 4000) * np.minimum(1, (1.0 - T(1.0)) * 5)
    ch = []
    for k in range(3):
        ch.append((k * 0.14, bandpass(noise(0.09), 300, 2500) * np.exp(-T(0.09) * 35) * 0.9 + sweep(200, 90, 0.09) * 0.4 * np.exp(-T(0.09) * 30)))
    S['chomp'] = mixat(0.5, ch)
    bub = []
    for k in range(6):
        f0 = 300 + R.random() * 500
        bub.append((k * 0.11 + R.random() * 0.05, sweep(f0, f0 * 2.2, 0.08) * np.exp(-T(0.08) * 25) * 0.4))
    S['bubble'] = mixat(0.9, bub)
    S['water'] = mixat(1.4, [(0, lowpass(noise(1.4), 900) * np.sin(np.pi * T(1.4) / 1.4) * 0.6)] + bub)
    S['clank'] = mixat(0.5, [(0, drum('clank', 1.6)), (0, drum('kick', 0.3))])
    S['hammer'] = mixat(0.6, [(0, drum('clank', 1.2)), (0, drum('block', 1.0)), (0.25, drum('clank', 0.9)), (0.25, drum('block', 0.8))])
    sn = bandpass(noise(0.05), 3000, 9000) * np.exp(-T(0.05) * 60)
    S['snip'] = mixat(0.35, [(0, sn), (0.15, sn * 1.2)])
    fan = np.zeros(int(1.8 * SR), np.float32)
    for t0, ms, d in [(0, [72, 76, 79], 0.14), (0.16, [72, 76, 79], 0.14), (0.32, [72, 76, 79], 0.14), (0.5, [77, 81, 84], 1.1)]:
        for m in ms:
            x = inst_brass(hz(m), d, 0.9)
            j = int(t0 * SR)
            fan[j:j + len(x)] += x[:len(fan) - j]
    S['fanfare'] = fan * 1.8 + mixat(1.8, [(0.5, drum('crash', 0.8)), (0.5, drum('timp', 0.8))])
    S['drum'] = mixat(1.3, [(i * 0.045, drum('snare', 0.25 + i * 0.03)) for i in range(20)] + [(0.95, drum('crash', 1.0)), (0.95, drum('kick', 1.0))])
    bt = T(0.6)
    S['boing'] = np.sin(2 * np.pi * np.cumsum(220 + 160 * np.sin(2 * np.pi * 9 * bt) * np.exp(-bt * 3)) / SR).astype(np.float32) * np.exp(-bt * 4) * 0.5
    S['splash'] = mixat(0.9, [(0, lowpass(noise(0.9), 3000) * np.exp(-T(0.9) * 6) * 0.7)] + [(0.05 + k * 0.06, x) for k, (_, x) in enumerate(bub[:4])])
    S['burst'] = mixat(1.0, [(k * 0.05, sweep(500 + 300 * k, 1500 + 200 * k, 0.06) * np.exp(-T(0.06) * 30) * 0.35) for k in range(10)])
    S['fire'] = (lowpass(noise(1.4), 1500) * (0.4 + 0.3 * (R.random(int(1.4 * SR)) > 0.995)) * np.sin(np.pi * T(1.4) / 1.4)).astype(np.float32) * 0.9
    co = np.zeros(int(1.2 * SR), np.float32)
    for i, m in enumerate([79, 84, 88]):
        x = inst_bell(hz(m), 0.4, 0.9)
        j = int(i * 0.09 * SR)
        co[j:j + len(x)] += x[:len(co) - j]
    S['correct'] = co * 1.3
    S['wrong'] = lowpass(cat(np.sign(np.sin(2 * np.pi * 180 * T(0.25))) * 0.25, np.zeros(int(0.05 * SR)),
                             np.sign(np.sin(2 * np.pi * 140 * T(0.45))) * 0.25 * np.exp(-T(0.45) * 3)), 2000)
    S['tick'] = drum('block', 0.9)
    out = {}
    for k, x in S.items():
        x = np.asarray(x, np.float32)
        p = np.max(np.abs(x)) + 1e-9
        x = x / p * 0.7
        f = int(0.005 * SR)
        x[-f:] *= np.linspace(1, 0, f)
        out[k] = x
    return out


def main():
    from scipy.io import wavfile
    d = os.path.join(ROOT, 'build', 'sfx')
    a = os.path.join(ROOT, 'assets', 'sound_effects')
    os.makedirs(d, exist_ok=True)
    os.makedirs(a, exist_ok=True)
    for k, x in make().items():
        w = os.path.join(d, f'{k}.wav')
        wavfile.write(w, SR, (x * 32767).astype(np.int16))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-b:a', '128k', os.path.join(a, f'{k}.mp3')], check=True)
    print('sfx:', ', '.join(sorted(make().keys())))


if __name__ == '__main__':
    main()

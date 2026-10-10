"""Synthesise a bright, original background track for each film (no samples, no
third-party music, so the videos are free of copyright claims on YouTube).

    python3 film/bgm.py sanger pcr ...      # -> .cache/film-bgm/<id>.wav

Each film gets its own key, tempo, chord progression and instrument colours.
Layers: soft pad, plucked arpeggio, bell melody (sparse), bass, light kick /
shaker. Length follows the film's timing.json; the end fades out. finish.sh
mixes it under the narration with side-chain ducking.
"""
import json
import os
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100

# key (MIDI root), bpm, progression (scale degrees, major), arpeggio pattern, colours
STYLE = {
    'restriction': dict(root=62, bpm=104, prog=[1, 5, 6, 4], arp=[0, 2, 1, 2, 0, 2, 1, 3], bright=0.9, swing=0.0, bell=True),   # D major
    'cloning':     dict(root=65, bpm=112, prog=[1, 4, 6, 5], arp=[0, 1, 2, 3, 2, 1, 0, 1], bright=1.0, swing=0.12, bell=True),  # F major
    'pcr':         dict(root=67, bpm=120, prog=[1, 6, 4, 5], arp=[0, 2, 3, 2, 1, 2, 3, 2], bright=1.1, swing=0.0, bell=False),  # G major
    'sanger':      dict(root=60, bpm=96,  prog=[1, 5, 6, 3, 4, 1, 4, 5], arp=[0, 1, 2, 1, 3, 1, 2, 1], bright=0.8, swing=0.0, bell=True),  # C major
    'crispr':      dict(root=64, bpm=116, prog=[6, 4, 1, 5], arp=[0, 2, 1, 3, 0, 2, 1, 2], bright=1.0, swing=0.08, bell=False),  # E major
}
MAJOR = [0, 2, 4, 5, 7, 9, 11]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def triad(root, degree):
    """MIDI notes of the diatonic triad on a scale degree (1..7), plus the 7th scale step above"""
    i = degree - 1
    notes = []
    for k in (0, 2, 4, 6):
        j = i + k
        notes.append(root + MAJOR[j % 7] + 12 * (j // 7))
    return notes


def env(n, a, d, s, r, sustain_len):
    """ADSR envelope of n samples (times in samples)"""
    e = np.zeros(n)
    a, d, r = max(1, a), max(1, d), max(1, r)
    t = 0
    seg = min(a, n); e[:seg] = np.linspace(0, 1, seg); t = seg
    seg = min(d, n - t); e[t:t + seg] = np.linspace(1, s, seg); t += seg
    seg = min(max(0, sustain_len - t), n - t); e[t:t + seg] = s; t += seg
    seg = n - t
    if seg > 0:
        e[t:] = s * np.exp(-np.arange(seg) / r * 5)
    return e


def add(buf, start, sig, pan=0.0):
    i = int(start * SR)
    if i >= buf.shape[0]:
        return
    sig = sig[: buf.shape[0] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * l
    buf[i:i + len(sig), 1] += sig * r


def pad(freqs, dur, bright):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):  # slightly detuned saws, softened
            ff = f * 2 ** (det / 12)
            for h in range(1, 7):
                s += np.sin(2 * np.pi * ff * h * t + h) / (h ** (1.7 - 0.3 * bright))
    s /= len(freqs) * 3 * 2.2
    return s * env(n, int(0.6 * SR), int(0.4 * SR), 0.8, int(0.8 * SR), int((dur - 0.6) * SR))


def pluck(f, dur, bright):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.5 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 9) + 0.25 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 14)
    return s * np.exp(-t * 6.0) * np.minimum(1, t * 400)


def bell(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 3)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.2) * np.minimum(1, t * 300)


def bass(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    return s * env(n, int(0.01 * SR), int(0.1 * SR), 0.7, int(0.15 * SR), int((dur - 0.1) * SR))


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 50 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def shaker(rng):
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = np.diff(np.concatenate([[0], noise]))  # brighter
    return noise * np.exp(-t * 60)


def make(fid):
    st = STYLE[fid]
    timing = json.load(open(os.path.join(ROOT, 'web', 'public', 'film', fid, 'timing.json')))
    total = timing['duration'] + 1.0
    beat = 60.0 / st['bpm']
    bar = beat * 4
    buf = np.zeros((int((total + 4) * SR), 2))
    rng = np.random.default_rng(sum(map(ord, fid)))
    mel_rng = np.random.default_rng(len(fid) * 7 + st['root'])
    nbars = int(np.ceil(total / bar))
    k = kick()
    for b in range(nbars):
        t0 = b * bar
        deg = st['prog'][b % len(st['prog'])]
        ch = triad(st['root'], deg)
        # intro (first 2 bars) and outro: pad only, so the film opens and closes gently
        intro = b < 2
        add(buf, t0, pad([hz(m - 12) for m in ch[:3]], bar + 0.6, st['bright']) * 0.16, 0.0)
        add(buf, t0, bass(hz(ch[0] - 24), bar * 0.48) * 0.22, 0.0)
        add(buf, t0 + bar / 2, bass(hz(ch[0] - 24 + (7 if b % 2 else 0)), bar * 0.48) * 0.2, 0.0)
        if intro:
            continue
        # arpeggio in eighths
        for i, a in enumerate(st['arp']):
            sw = st['swing'] * beat if i % 2 else 0.0
            note = ch[a] + (12 if i >= 4 and a < 2 else 0)
            add(buf, t0 + i * beat / 2 + sw, pluck(hz(note), beat * 1.2, st['bright']) * 0.10, -0.35 + 0.1 * (i % 3))
        # bell melody: a few notes per bar from the chord/scale, sparse
        if st['bell'] and b % 2 == 1:
            for q in range(3):
                if mel_rng.random() < 0.65:
                    m = ch[mel_rng.integers(0, 4)] + 12
                    add(buf, t0 + q * beat * 1.5, bell(hz(m), beat * 2.5) * 0.06, 0.4)
        # light drums
        for q in range(4):
            if q in (0, 2):
                add(buf, t0 + q * beat, k * 0.28, 0.0)
            for e in range(2):
                add(buf, t0 + q * beat + e * beat / 2 + (st['swing'] * beat if e else 0), shaker(rng) * (0.035 if e else 0.02), 0.25)
    out = buf[: int(total * SR)]
    # gentle stereo widening + fade out
    fade = int(3.0 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    out[: int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR))[:, None]
    out /= max(1e-9, np.abs(out).max()) / 0.85
    d = os.path.join(ROOT, '.cache', 'film-bgm')
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, f'{fid}.wav')
    with wave.open(p, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())
    print(p, f'{total:.1f}s')


if __name__ == '__main__':
    for fid in sys.argv[1:] or list(STYLE):
        make(fid)

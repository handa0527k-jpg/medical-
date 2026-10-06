#!/usr/bin/env python3
"""路地裏のゲノム — soundtrack: an original score (synthesised piano, pads, music box, pulse), rain and city
ambience, sound effects on the picture's events, and the voices — ducked and mastered.

    python3 tools/audio.py [--from S --to S] out.wav
"""
import argparse, json, math, os
import numpy as np
import scipy.io.wavfile as WF
from scipy import signal

PROD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(PROD, '.cache')
SR = 48000
TL = json.load(open(os.path.join(PROD, 'timeline.json'), encoding='utf-8'))
TOTAL = TL['total'] + 1.0
N = int(TOTAL * SR)
RNG = np.random.default_rng(7)
BEAT = 60 / 72


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def line(scene, i):
    for l in TL['lines']:
        if l['scene'] == scene and l['i'] == i:
            return l['t0'], l['t1']


SC = {s['id']: s for s in TL['scenes']}


# ------------------------------------------------------------------ instruments (mono, returned as arrays)
def piano(f, dur, vel=0.5):
    n = int((dur + 2.5) * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.00035
    for k in range(1, 10):
        fk = k * f * math.sqrt(1 + B * k * k)
        if fk > 16000:
            break
        dec = (0.9 + 0.75 * k) * (f / 262) ** 0.35
        out += (1 / k ** 1.25) * np.sin(2 * np.pi * fk * t + RNG.uniform(0, 6)) * np.exp(-t * dec)
    out *= np.minimum(1, t / 0.004)
    rel = np.clip(1 - (t - dur) / 0.35, 0, 1) ** 2
    hammer = RNG.normal(0, 1, n) * np.exp(-t * 90) * 0.04
    return (out * rel + hammer) * vel * 0.22


def bell(f, vel=0.4):
    n = int(3.5 * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for r, a, d in [(1, 1, 1.6), (2.76, 0.45, 3.2), (5.4, 0.25, 5), (8.93, 0.12, 8)]:
        out += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d)
    return out * np.minimum(1, t / 0.002) * vel * 0.18


def pad(freqs, dur, vel=0.3, cutoff=1400):
    n = int((dur + 3) * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            ph = RNG.uniform(0, 6)
            for k in range(1, 9):
                out += np.sin(2 * np.pi * ff * k * t + ph * k) / k * (0.85 ** k)
    b, a = signal.butter(2, cutoff / (SR / 2))
    out = signal.lfilter(b, a, out)
    env = np.minimum(1, t / 1.8) * np.clip(1 - (t - dur) / 3, 0, 1)
    lfo = 1 + 0.08 * np.sin(2 * np.pi * 0.2 * t)
    return out * env * lfo * vel * 0.03 / max(1, len(freqs)) * 3


def kick(vel=0.5):
    n = int(0.6 * SR); t = np.arange(n) / SR
    f = 45 + 80 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * vel * 0.5


def hat(vel=0.2):
    n = int(0.12 * SR); t = np.arange(n) / SR
    x = RNG.normal(0, 1, n); b, a = signal.butter(2, 7000 / (SR / 2), 'high')
    return signal.lfilter(b, a, x) * np.exp(-t * 45) * vel * 0.15


def sub(f, dur, vel=0.4):
    n = int((dur + 0.5) * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.05) * np.clip(1 - (t - dur) / 0.4, 0, 1) * vel * 0.25


# ------------------------------------------------------------------ mixing helpers
class Bus:
    def __init__(self):
        self.L = np.zeros(N); self.R = np.zeros(N)

    def add(self, x, t, pan=0.0, g=1.0):
        i = int(t * SR)
        if i >= N or i + len(x) <= 0:
            return
        if i < 0:
            x = x[-i:]; i = 0
        j = min(N, i + len(x))
        l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        self.L[i:j] += x[:j - i] * g * l * 1.414; self.R[i:j] += x[:j - i] * g * r * 1.414


def reverb_ir(sec=3.2, damp=3000, seed=1):
    rng = np.random.default_rng(seed)
    n = int(sec * SR); t = np.arange(n) / SR
    ir = rng.normal(0, 1, n) * np.exp(-t * 6.9 / sec)
    b, a = signal.butter(1, damp / (SR / 2)); ir = signal.lfilter(b, a, ir)
    ir[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt(np.sum(ir ** 2))


def verb(bus, wet=0.35, sec=3.2):
    L = signal.fftconvolve(bus.L, reverb_ir(sec, seed=1))[:N]; R = signal.fftconvolve(bus.R, reverb_ir(sec, seed=2))[:N]
    bus.L = bus.L * (1 - wet) + L * wet; bus.R = bus.R * (1 - wet) + R * wet


# ------------------------------------------------------------------ score
CH = {'Dm9': [50, 53, 57, 60, 64], 'Bbmaj7': [46, 53, 57, 62, 65], 'Fmaj7': [41, 52, 57, 60, 64], 'C6': [48, 52, 55, 57, 62],
      'Gm9': [43, 50, 53, 57, 58], 'Am7': [45, 52, 55, 60, 64], 'Ebmaj7': [39, 55, 58, 62, 65], 'A7sus': [45, 52, 55, 57, 62],
      'Fmaj9': [41, 52, 55, 57, 60, 64, 67]}
SCORE = {
    'rain':   dict(ch=['Dm9', 'Bbmaj7', 'Fmaj7', 'C6'], bars=2, piano=0.55, pad=0.7, bells=0, pulse=0, drums=0, lvl=0.9),
    'six':    dict(ch=['Bbmaj7', 'C6', 'Am7', 'Dm9'], bars=2, piano=0.6, pad=0.6, bells=0.2, pulse=0.4, drums=0, lvl=0.85),
    'cut':    dict(ch=['Dm9', 'Gm9', 'Dm9', 'A7sus'], bars=2, piano=0.4, pad=0.5, bells=0.6, pulse=0.2, drums=0, lvl=0.8),
    'tie':    dict(ch=['Bbmaj7', 'Fmaj7', 'Gm9', 'C6'], bars=2, piano=0.6, pad=0.7, bells=0.3, pulse=0, drums=0, lvl=0.85),
    'planet': dict(ch=['Fmaj7', 'Ebmaj7', 'Fmaj7', 'C6'], bars=2, piano=0.35, pad=0.8, bells=0.7, pulse=0, drums=0, lvl=0.8),
    'copy':   dict(ch=['Am7', 'Fmaj7', 'C6', 'Gm9'], bars=2, piano=0.5, pad=0.6, bells=0.3, pulse=0, drums=0, lvl=0.8),
    'pcr':    dict(ch=['Dm9', 'Bbmaj7', 'Fmaj7', 'C6'], bars=1, piano=0.5, pad=0.5, bells=0.5, pulse=0.6, drums=0.6, lvl=0.85),
    'gel':    dict(ch=['Am7', 'Am7', 'Fmaj7', 'Gm9'], bars=2, piano=0.3, pad=0.7, bells=0.2, pulse=0.3, drums=0, lvl=0.75),
    'read':   dict(ch=['Fmaj7', 'C6', 'Dm9', 'Bbmaj7'], bars=2, piano=0.4, pad=0.6, bells=0.8, pulse=0.3, drums=0.25, lvl=0.8),
    'shadow': dict(ch=['Dm9', 'Ebmaj7', 'Dm9', 'A7sus'], bars=2, piano=0.25, pad=0.9, bells=0.15, pulse=0.5, drums=0, lvl=0.85, dark=True),
    'end':    dict(ch=['Bbmaj7', 'C6', 'Dm9', 'Fmaj9'], bars=2, piano=0.65, pad=0.7, bells=0.5, pulse=0, drums=0, lvl=0.95),
}


def score(mus, perc):
    for sc in TL['scenes']:
        cfg = SCORE[sc['id']]
        t0, t1 = sc['start'], sc['end']
        bar = BEAT * 4
        chord_len = bar * cfg['bars']
        k = 0
        t = t0
        while t < t1 - 0.5:
            name = cfg['ch'][k % len(cfg['ch'])]
            notes = CH[name]
            if sc['id'] == 'end' and t > SC['end']['end'] - 20:
                name, notes = 'Fmaj9', CH['Fmaj9']
            dur = min(chord_len, t1 - t)
            fade = min(1, (t - t0 + 0.5) / 2, (t1 - t) / 2 + 0.3)
            lvl = cfg['lvl'] * max(0.2, fade)
            if cfg['pad']:
                fr = [mtof(n) for n in notes[:4]]
                if cfg.get('dark'):
                    fr = [mtof(notes[0] - 12), mtof(notes[0] - 5)] + fr[:2]
                mus.add(pad(fr, dur, cfg['pad'] * lvl, 900 if cfg.get('dark') else 1500), t, 0)
            mus.add(sub(mtof(notes[0] - 12), dur * 0.95, 0.5 * lvl), t, 0)
            # piano: broken chord arpeggio in eighths with gentle randomness
            if cfg['piano']:
                steps = int(dur / (BEAT / 2))
                pat = [0, 2, 3, 4, 3, 2, 1, 3]
                for st in range(steps):
                    if RNG.random() < 0.28 and st % 4:
                        continue
                    n = notes[pat[st % len(pat)] % len(notes)] + 12
                    v = cfg['piano'] * lvl * (0.7 if st % 2 else 1.0) * RNG.uniform(0.75, 1)
                    mus.add(piano(mtof(n), BEAT * 0.9, v), t + st * BEAT / 2 + RNG.normal(0, 0.008), (n - 66) / 30)
            if cfg['bells']:
                steps = int(dur / (BEAT / 4 if sc['id'] in ('read', 'pcr') else BEAT / 2))
                for st in range(steps):
                    if RNG.random() < 0.45:
                        continue
                    n = notes[RNG.integers(1, len(notes))] + 24
                    dt = (BEAT / 4 if sc['id'] in ('read', 'pcr') else BEAT / 2)
                    mus.add(bell(mtof(n), cfg['bells'] * lvl * RNG.uniform(0.4, 0.9)), t + st * dt, RNG.uniform(-0.7, 0.7))
            if cfg['pulse']:
                for b in range(int(dur / BEAT)):
                    mus.add(sub(mtof(notes[0] - 12), BEAT * 0.4, cfg['pulse'] * lvl * 0.8), t + b * BEAT, 0)
            if cfg['drums']:
                for b in range(int(dur / BEAT)):
                    perc.add(kick(cfg['drums'] * lvl * (1 if b % 2 == 0 else 0.6)), t + b * BEAT, 0)
                    for h in range(2):
                        perc.add(hat(cfg['drums'] * lvl * (0.6 if h else 0.35)), t + b * BEAT + h * BEAT / 2, 0.3)
            t += chord_len; k += 1


# ------------------------------------------------------------------ ambience + effects
def noise(n, color='pink'):
    x = RNG.normal(0, 1, n)
    if color == 'pink':
        b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]; a = [1, -2.494956002, 2.017265875, -0.522189400]
        return signal.lfilter(b, a, x)
    if color == 'brown':
        y = np.cumsum(x); y -= signal.lfilter([1], [1, -0.9995], y) * 0; b, a = signal.butter(1, 30 / (SR / 2), 'high')
        return signal.lfilter(b, a, y) * 0.02
    return x


def rain_level(t):
    lv = np.ones_like(t) * 0.9
    for sc in TL['scenes']:
        m = (t >= sc['start']) & (t < sc['end'])
        lv[m] = {'rain': 1.0, 'six': 0.9, 'cut': 0.7, 'tie': 0.75, 'planet': 0.55, 'copy': 0.55, 'pcr': 0.6, 'gel': 0.65,
                 'read': 0.45, 'shadow': 0.8, 'end': 0.45}[sc['id']]
    endt = SC['end']['start']
    lv = np.where(t > endt, lv * np.clip(1 - (t - endt) / 40, 0.15, 1), lv)
    return signal.filtfilt(*signal.butter(1, 0.3 / (SR / 2)), lv)


def ambience(bus):
    t = np.arange(N) / SR
    lv = rain_level(t)
    for ch, seed in ((0, 1), (1, 2)):
        x = noise(N, 'pink')
        b, a = signal.butter(2, [400 / (SR / 2), 9000 / (SR / 2)], 'band')
        x = signal.lfilter(b, a, x)
        # droplets: sparse clicks through a resonant filter
        d = np.zeros(N)
        idx = RNG.integers(0, N, int(TOTAL * 220))
        d[idx] = RNG.uniform(0.2, 1, len(idx)) * RNG.choice([-1, 1], len(idx))
        b2, a2 = signal.butter(2, [1500 / (SR / 2), 6000 / (SR / 2)], 'band')
        d = signal.lfilter(b2, a2, d)
        sig = (x * 0.9 + d * 0.5) * lv * 0.09
        if ch == 0:
            bus.L += sig
        else:
            bus.R += sig
    city = noise(N, 'brown')
    b, a = signal.butter(2, 180 / (SR / 2)); city = signal.lfilter(b, a, city)
    city = city / (np.abs(city).max() + 1e-9) * 0.05 * (0.6 + 0.4 * np.sin(2 * np.pi * t / 37))
    bus.L += city; bus.R += city


def whoosh(dur=1.2, f0=300, f1=3000, vel=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    x = RNG.normal(0, 1, n)
    out = np.zeros(n)
    seg = 512
    for i in range(0, n, seg):
        u = i / n; fc = f0 * (f1 / f0) ** u
        b, a = signal.butter(2, [max(30, fc * 0.7) / (SR / 2), min(SR / 2 - 100, fc * 1.4) / (SR / 2)], 'band')
        out[i:i + seg] = signal.lfilter(b, a, x[i:i + seg])
    return out * np.sin(np.pi * t / dur) ** 2 * vel


def shing(vel=0.35):
    n = int(1.4 * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for f in (2900, 4320, 6100, 7900):
        x += np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 37 * t)) * np.exp(-t * (3 + f / 2500))
    sw = whoosh(0.25, 2000, 9000, 0.6)
    x[:len(sw)] += sw
    return x * vel * 0.25


def boom(vel=0.6):
    n = int(3 * SR); t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t * 6)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    nz = RNG.normal(0, 1, n); b, a = signal.butter(2, 300 / (SR / 2)); nz = signal.lfilter(b, a, nz) * np.exp(-t * 4)
    return (x + nz * 0.5) * vel * 0.6


def chime(vel=0.4):
    out = np.zeros(int(3.5 * SR))
    for k, m in enumerate([84, 88, 91, 96]):
        b = bell(mtof(m), vel); i = int(k * 0.07 * SR); out[i:i + len(b)] += b[:len(out) - i]
    return out


def effects(bus):
    def at(sc, i, dt=0.0):
        return line(sc, i)[0] + dt
    ev = []
    # title shimmer
    last = [l for l in TL['lines'] if l['scene'] == 'rain'][-1]['t1']
    ev += [(last + 0.6, chime(0.5), 0), (last + 0.5, whoosh(2.5, 200, 4000, 0.25), 0)]
    # GATC lights up
    a0, a1 = line('cut', 0); tt = a0 + (a1 - a0) * 0.42
    ev += [(tt + k * 0.32, bell(mtof(88 + k * 3), 0.35), -0.4 + k * 0.25) for k in range(4)]
    # BamHI cut, SmaI cut
    ev += [(at('cut', 4, 0.9), shing(), -0.2), (at('cut', 4, 2.0), shing(0.28), 0.2)]
    ev += [(at('cut', 7, 2.7), shing(), 0.0)]
    # phage cut into pieces
    ev += [(at('cut', 9, 0.5 + k * 0.35), shing(0.15), RNG.uniform(-0.6, 0.6)) for k in range(4)]
    # ligation chimes
    ev += [(at('tie', 3, 0.0), chime(0.35), 0), (at('tie', 4, 1.2), chime(0.45), 0), (at('planet', 4, 4.0), chime(0.4), 0)]
    # plasmid insert whoosh
    ev += [(at('planet', 4, 1.6), whoosh(1.5, 400, 2500, 0.25), 0)]
    # PCR colour changes
    ev += [(at('pcr', 0, -0.3), whoosh(2.0, 150, 1800, 0.3), 0), (at('pcr', 2, -0.3), whoosh(2.0, 3000, 300, 0.25), 0), (at('pcr', 4, -0.3), whoosh(2.0, 300, 3000, 0.25), 0)]
    # gel hum
    g0 = SC['gel']['start']
    hum = np.sin(2 * np.pi * 100 * np.arange(int(12 * SR)) / SR) * 0.012 * np.minimum(1, np.arange(int(12 * SR)) / SR / 2) * np.clip((12 - np.arange(int(12 * SR)) / SR) / 2, 0, 1)
    ev += [(g0 + 1, hum, 0)]
    # Cas9 shadow + cut
    ev += [(SC['shadow']['start'] + 0.5, boom(0.45), 0), (line('shadow', 5)[1] - 1.1, shing(0.4), 0), (at('shadow', 6, 0.2), boom(0.6), 0)]
    for t, x, p in ev:
        bus.add(x, t, p)


def voices(bus):
    import subprocess
    script = json.load(open(os.path.join(PROD, 'script.json'), encoding='utf-8'))
    raw = os.path.join(C, 'voice.wav')
    sr, v = WF.read(raw)
    v = v.astype(np.float64) / 32768
    if len(v) < N:
        v = np.pad(v, (0, N - len(v)))
    v = v[:N]
    # gentle presence EQ
    b, a = signal.butter(2, 90 / (SR / 2), 'high'); v = signal.lfilter(b, a, v)
    bus.L += v * 0.95; bus.R += v * 0.95
    return v


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('--from', dest='a', type=float, default=0); ap.add_argument('--to', dest='b', type=float, default=None)
    args = ap.parse_args()
    mus, perc, amb, fx, vo = Bus(), Bus(), Bus(), Bus(), Bus()
    score(mus, perc); verb(mus, 0.42, 3.6); verb(perc, 0.15, 1.2)
    ambience(amb)
    effects(fx); verb(fx, 0.35, 2.5)
    v = voices(vo)
    vr = Bus(); vr.L = vo.L.copy(); vr.R = vo.R.copy(); verb(vr, 1.0, 1.4)
    vo.L += vr.L * 0.10; vo.R += vr.R * 0.10
    # ducking from the voice envelope
    env = np.abs(v)
    env = signal.filtfilt(*signal.butter(1, 3 / (SR / 2)), env)
    duck = 1 - 0.55 * np.clip(env / 0.05, 0, 1)
    L = (mus.L + perc.L) * duck * 0.9 + amb.L * (0.75 + 0.25 * duck) + fx.L + vo.L
    R = (mus.R + perc.R) * duck * 0.9 + amb.R * (0.75 + 0.25 * duck) + fx.R + vo.R
    x = np.stack([L, R], 1)
    a = int(args.a * SR); b = int((args.b if args.b is not None else TOTAL) * SR)
    x = x[a:b]
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    x = x * (0.12 / rms)
    x = np.tanh(x * 1.2) / np.tanh(1.2) * 0.95
    WF.write(args.out, SR, (x * 32767).astype(np.int16))
    print('wrote', args.out, f'{len(x) / SR:.1f}s')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Sound for the film: the voiced lines at their timeline positions, synthesised manga sound effects
(ドーン, ゴゴゴ, ドドド, impacts, explosions, sparkles — noise and sine waves only, no external samples)
and a bright synth pad that turns dark while 誤解 is on stage, ducked under the voices.

  python3 audio.py          # → out/sound.wav (48 kHz stereo)
  python3 audio.py mux      # out/picture.mp4 + out/sound.wav → out/epigenetics_jojo.mp4
"""
import json, subprocess, sys, wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
SR = 48000
rng = np.random.default_rng(1)


def read_wav(p):
    with wave.open(str(p)) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768


def lp(x, a):
    """one-pole low-pass; a in (0,1], smaller = darker"""
    # an exponential kernel convolved by FFT (same response as y[n] = a·x[n] + (1-a)·y[n-1])
    k = int(np.log(1e-4) / np.log(1 - a)) + 1 if a < 1 else 1
    h = a * (1 - a) ** np.arange(k)
    m = len(x) + k - 1
    nfft = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(h, nfft), nfft)[: len(x)]
    return y.astype(np.float32)


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def tone(f0, f1, dur, decay):
    n = int(dur * SR)
    f = np.geomspace(f0, f1, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env(n, 0.003, decay)


def noise(dur):
    return rng.standard_normal(int(dur * SR)).astype(np.float32)


def sfx(kind):
    if kind == "don":      # ドーン: deep boom + slap
        x = 1.0 * tone(90, 38, 1.2, 0.35) + 0.5 * lp(noise(1.2), 0.08) * env(int(1.2 * SR), 0.001, 0.12)
        x[: int(0.03 * SR)] += 0.6 * noise(0.03) * np.linspace(1, 0, int(0.03 * SR))
        return 0.8 * x
    if kind == "hit":      # バシィッ
        x = 0.9 * lp(noise(0.5), 0.35) * env(int(0.5 * SR), 0.001, 0.06) + 0.8 * tone(260, 60, 0.5, 0.12)
        return 0.8 * x
    if kind == "boom":     # explosion
        n = noise(2.4)
        x = lp(n, 0.05) * env(len(n), 0.005, 0.6) * 2.2 + 0.9 * tone(70, 28, 2.4, 0.7)
        return 0.75 * x
    if kind == "gogo":     # ゴゴゴゴ rumble with tremolo
        d = 2.6
        n = lp(lp(noise(d), 0.03), 0.06) * 6
        t = np.arange(len(n)) / SR
        trem = 0.6 + 0.4 * np.sin(2 * np.pi * 11 * t)
        fade = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.8)
        return 0.7 * n * trem * fade + 0.3 * np.sin(2 * np.pi * 41 * t) * fade
    if kind == "dododo":   # ドドドド: rapid thumps
        out = np.zeros(int(2.2 * SR), np.float32)
        for i in range(16):
            s = int(i * 0.125 * SR)
            b = tone(110, 45, 0.25, 0.07) * (0.5 + 0.5 * (i % 2 == 0))
            out[s:s + len(b)] += b[: len(out) - s]
        return 0.8 * out
    if kind == "whoosh":
        d = 0.7
        n = noise(d)
        t = np.arange(len(n)) / SR
        sweep = lp(n, 0.25) - lp(n, 0.02)
        return 0.45 * sweep * np.sin(np.pi * t / d) ** 2
    if kind in ("shine", "sparkle"):
        out = np.zeros(int(1.6 * SR), np.float32)
        notes = [1568, 2093, 2637, 3136, 4186] if kind == "sparkle" else [1047, 1568, 2093, 3136]
        for i, f in enumerate(notes):
            s = int(i * 0.07 * SR)
            b = tone(f, f, 1.0, 0.25) * 0.3
            out[s:s + len(b)] += b[: len(out) - s]
        if kind == "shine":
            n = noise(1.6)
            out += 0.12 * (n - lp(n, 0.3)) * env(len(n), 0.2, 0.5)
        return out
    if kind == "swish":    # the soft swish when the background changes
        d = 0.25
        n = noise(d)
        t = np.arange(len(n)) / SR
        return 0.12 * (n - lp(n, 0.1)) * np.sin(np.pi * t / d) ** 2
    raise ValueError(kind)


def place(buf, x, at):
    s = int(at * SR)
    if s >= len(buf) or s + len(x) <= 0:
        return
    e = min(len(buf), s + len(x))
    buf[s:e] += x[: e - s]


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def pad(total, dark_spans):
    """bright I–V–vi–IV pad with a soft beat; a minor drone where the villain is on stage"""
    n = int(total * SR)
    out = np.zeros(n, np.float32)
    t = np.arange(n) / SR
    chords = [[60, 64, 67, 72], [55, 62, 67, 71], [57, 60, 64, 69], [53, 60, 65, 69]]
    dark = [[48, 51, 55, 60], [46, 50, 53, 58]]
    seg = 2.0
    for k in range(int(total / seg) + 1):
        a = k * seg
        in_dark = any(s <= a < e for s, e in dark_spans)
        notes = dark[k % 2] if in_dark else chords[k % 4]
        s0, s1 = int(a * SR), min(n, int((a + seg + 0.4) * SR))
        tt = t[s0:s1] - a
        if len(tt) == 0:
            continue
        e = np.minimum(1, tt / 0.25) * np.minimum(1, np.maximum(0, (seg + 0.4 - tt) / 0.4))
        v = np.zeros(len(tt), np.float32)
        for m in notes:
            f = midi(m)
            for det in (-0.12, 0.12):
                ph = 2 * np.pi * f * (1 + det / 100) * tt
                v += (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) / 8
        out[s0:s1] += v * e * 0.5
    # beat: soft kick each beat (120 bpm), hats on the off-beats
    for k in range(int(total * 2)):
        a = k * 0.5
        if any(s <= a < e for s, e in dark_spans):
            if k % 2 == 0:
                place(out, 0.5 * tone(70, 40, 0.4, 0.15), a)
            continue
        place(out, 0.35 * tone(110, 45, 0.3, 0.08), a)
        h = noise(0.06)
        place(out, 0.05 * (h - lp(h, 0.5)) * env(len(h), 0.001, 0.02), a + 0.25)
    return out


def build():
    T = json.load(open(HERE / "timeline.json", encoding="utf-8"))
    total = T["total"]
    n = int(total * SR) + SR
    voice = np.zeros(n, np.float32)
    fx = np.zeros(n, np.float32)
    dark_spans = []
    for sc in T["scenes"]:
        enter = None
        for L in sc["lines"]:
            x = read_wav(HERE / "audio" / "lines" / L["file"])
            place(voice, x, L["start"])
            st, d = L["start"], L["dur"]
            place(fx, sfx("swish"), st - 0.05)
            for f in L.get("fx", []):
                if f == "don":
                    at = st + 0.1
                elif f == "hit":
                    at = st + 0.55 * d
                elif f == "boom":
                    at = st + (0.7 * d if L.get("enemy") == "defeat" else 0.05)
                elif f in ("shine", "sparkle"):
                    at = st + 0.1
                else:
                    at = st
                place(fx, sfx(f), at)
            e = L.get("enemy")
            if e == "enter":
                enter = st
            if e in ("flee", "explode") and enter is not None:
                dark_spans.append((enter, st + 1.0))
                enter = None
        if sc["id"] == "S06":
            dark_spans.append((sc["start"], sc["end"]))
    music = pad(total + 1, dark_spans)[:n]
    music = np.pad(music, (0, n - len(music)))
    # duck the music under the voices
    v_env = lp(np.abs(voice), 0.0008) * 8
    duck = 1 - 0.6 * np.clip(v_env, 0, 1)
    voice *= 0.92 / (np.max(np.abs(voice)) + 1e-6)
    mix = voice + 0.45 * fx + 0.16 * music * duck
    # fade in/out
    fi = int(0.4 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)
    fo = int(1.5 * SR)
    end = int(total * SR)
    mix[end - fo:end] *= np.linspace(1, 0, fo)
    mix[end:] = 0
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix = mix[:end]
    # a little stereo width for the effects
    L_ = mix + 0.08 * np.roll(fx[:end], 240)
    R_ = mix + 0.08 * np.roll(fx[:end], -240)
    st = np.stack([L_, R_], 1)
    st /= max(1.0, np.max(np.abs(st)) / 0.97)
    out = HERE / "out" / "sound.wav"
    out.parent.mkdir(exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype("<i2").tobytes())
    print(out, f"{total:.1f}s")


def mux():
    o = HERE / "out"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(o / "picture.mp4"), "-i", str(o / "sound.wav"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart",
                    str(o / "epigenetics_jojo.mp4")], check=True)
    print(o / "epigenetics_jojo.mp4")


if __name__ == "__main__":
    mux() if len(sys.argv) > 1 and sys.argv[1] == "mux" else build()

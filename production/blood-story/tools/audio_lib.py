"""
Shared DSP helpers for BLOOD STORY audio (voices / sfx / bgm / mix).

Everything works on float64 numpy arrays at SR = 48000.
mono = shape (n,), stereo = shape (n, 2).
"""
from __future__ import annotations

import os
import numpy as np
from scipy import signal

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # production/blood-story
AUDIO = os.path.join(ROOT, "audio")

# ----------------------------------------------------------------------------- voice engine switch
# "sbv2" (Style-Bert-VITS2 takes, audio/voice_sbv2/, tools/voices_sbv2.py) or "edge" (edge-tts takes, audio/voice/,
# tools/voices.py). The mix / timeline / verify tools read the voices through voice_meta(); a line that has no
# SBV2 take yet falls back to its edge-tts take.  Switch back:  BS_VOICE_ENGINE=edge python3 tools/mix.py
VOICE_ENGINE = os.environ.get("BS_VOICE_ENGINE", "sbv2")
VOICE_DIRS = {"sbv2": "voice_sbv2", "edge": "voice"}


def voice_dir(engine: str | None = None) -> str:
    return os.path.join(AUDIO, VOICE_DIRS[engine or VOICE_ENGINE])


def voice_meta(engine: str | None = None) -> dict:
    """line id -> metadata (file relative to audio/, speech_on/off, mouth ...) for the selected engine."""
    import json
    engine = engine or VOICE_ENGINE
    meta = json.load(open(os.path.join(AUDIO, "voice", "voices.json"), encoding="utf-8"))
    if engine != "edge":
        p = os.path.join(voice_dir(engine), "voices.json")
        if os.path.exists(p):
            meta.update(json.load(open(p, encoding="utf-8")))
    return meta


# ----------------------------------------------------------------------------- io
def write_wav(path: str, x: np.ndarray, subtype: str = "PCM_24") -> None:
    import soundfile as sf
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sf.write(path, np.asarray(x, dtype=np.float64), SR, subtype=subtype)


def read_wav(path: str) -> np.ndarray:
    import soundfile as sf
    x, sr = sf.read(path, dtype="float64", always_2d=False)
    if sr != SR:
        g = np.gcd(sr, SR)
        x = signal.resample_poly(x, SR // g, sr // g, axis=0)
    return x


def secs(n: int) -> float:
    return n / SR


def ns(t: float) -> int:
    return int(round(t * SR))


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


# ----------------------------------------------------------------------------- filters (RBJ biquads)
def _biquad(kind: str, f0: float, q: float = 0.707, gain_db: float = 0.0):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * min(f0, SR * 0.49) / SR
    cw, sw = np.cos(w0), np.sin(w0)
    alpha = sw / (2 * q)
    if kind == "lp":
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]; a = [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == "hp":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]; a = [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == "bp":
        b = [alpha, 0, -alpha]; a = [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == "peak":
        b = [1 + alpha * A, -2 * cw, 1 - alpha * A]; a = [1 + alpha / A, -2 * cw, 1 - alpha / A]
    elif kind == "lowshelf":
        s = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) - (A - 1) * cw + s), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - s)]
        a = [(A + 1) + (A - 1) * cw + s, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - s]
    elif kind == "highshelf":
        s = 2 * np.sqrt(A) * alpha
        b = [A * ((A + 1) + (A - 1) * cw + s), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - s)]
        a = [(A + 1) - (A - 1) * cw + s, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - s]
    else:
        raise ValueError(kind)
    b = np.array(b) / a[0]; a = np.array(a) / a[0]
    return b, a


def biquad(x: np.ndarray, kind: str, f0: float, q: float = 0.707, gain_db: float = 0.0) -> np.ndarray:
    b, a = _biquad(kind, f0, q, gain_db)
    return signal.lfilter(b, a, x, axis=0)


def lp(x, f, order=2):
    sos = signal.butter(order, min(f, SR * 0.49), "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def hp(x, f, order=2):
    sos = signal.butter(order, f, "high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def bp(x, f1, f2, order=2):
    sos = signal.butter(order, [f1, min(f2, SR * 0.49)], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def eq(x: np.ndarray, bands: list[tuple]) -> np.ndarray:
    """bands: [(kind, f0, q, gain_db), ...] kinds: lp hp peak lowshelf highshelf"""
    for b in bands:
        x = biquad(x, *b)
    return x


def sweep_filter(x: np.ndarray, f_start, f_end, kind="lp", q=0.9, block=256, curve="exp") -> np.ndarray:
    """time-varying 2-pole filter (block-wise coefficient update, state carried over)."""
    n = len(x)
    out = np.zeros_like(x)
    zi = None
    nb = (n + block - 1) // block
    for i in range(nb):
        u = i / max(1, nb - 1)
        if callable(f_start):
            f = f_start(u)
        elif curve == "exp":
            f = f_start * (f_end / f_start) ** u
        else:
            f = f_start + (f_end - f_start) * u
        b, a = _biquad(kind, f, q)
        seg = x[i * block:(i + 1) * block]
        if zi is None:
            zi = np.zeros((2,) + seg.shape[1:])
        y, zi = signal.lfilter(b, a, seg, axis=0, zi=zi)
        out[i * block:(i + 1) * block] = y
    return out


# ----------------------------------------------------------------------------- generators
def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(round(dur * SR))) / SR


def white(dur: float, seed: int = 0) -> np.ndarray:
    return rng(seed).standard_normal(int(round(dur * SR)))


def pink(dur: float, seed: int = 0) -> np.ndarray:
    n = int(round(dur * SR))
    w = rng(seed).standard_normal(n)
    # Paul Kellet's economy filter
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    y = signal.lfilter(b, a, w)
    return y / (np.std(y) + 1e-12)


def brown(dur: float, seed: int = 0) -> np.ndarray:
    y = np.cumsum(white(dur, seed))
    y = hp(y, 15)
    return y / (np.std(y) + 1e-12)


def phase_of(freq) -> np.ndarray:
    """freq: array (Hz per sample) -> phase in cycles"""
    return np.cumsum(np.asarray(freq) / SR)


def saw(freq, dur: float | None = None, phase0: float = 0.0) -> np.ndarray:
    """band-limited (polyBLEP) sawtooth. freq: scalar (needs dur) or per-sample array."""
    if np.isscalar(freq):
        freq = np.full(int(round(dur * SR)), float(freq))
    dt = np.asarray(freq) / SR
    ph = (phase_of(freq) + phase0) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t = ph[m] / dt[m]
    y[m] -= t + t - t * t - 1
    m = ph > 1 - dt
    t = (ph[m] - 1) / dt[m]
    y[m] -= t * t + t + t + 1
    return y


def sine(freq, dur: float | None = None, phase0: float = 0.0) -> np.ndarray:
    if np.isscalar(freq):
        return np.sin(2 * np.pi * (freq * t_axis(dur) + phase0))
    return np.sin(2 * np.pi * (phase_of(freq) + phase0))


def mtof(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def note(name: str) -> int:
    """'D4' -> midi 62, 'F#3' -> 54"""
    p = name[:-1]; o = int(name[-1])
    return 12 * (o + 1) + NOTE[p]


# ----------------------------------------------------------------------------- envelopes
def adsr(dur: float, a=0.01, d=0.1, s=0.7, r=0.2, curve=3.0) -> np.ndarray:
    """total length = dur + r (release starts at dur)."""
    n = int(round((dur + r) * SR))
    t = np.arange(n) / SR
    env = np.zeros(n)
    a = max(a, 1e-4)
    m = t < a
    env[m] = (t[m] / a) ** 0.8
    m = (t >= a) & (t < a + d)
    env[m] = s + (1 - s) * np.exp(-curve * (t[m] - a) / max(d, 1e-4))
    m = (t >= a + d) & (t < dur)
    env[m] = s + (1 - s) * np.exp(-curve)
    lvl = env[min(n - 1, max(0, int(dur * SR) - 1))]
    m = t >= dur
    env[m] = lvl * np.exp(-5.0 * (t[m] - dur) / max(r, 1e-4))
    return env


def exp_decay(dur: float, tau: float, attack: float = 0.002) -> np.ndarray:
    t = t_axis(dur)
    e = np.exp(-t / tau)
    if attack > 0:
        e *= np.clip(t / attack, 0, 1)
    return e


def fade(x: np.ndarray, fin: float = 0.005, fout: float = 0.01) -> np.ndarray:
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a > 0:
        x[:a] *= (np.linspace(0, 1, a) ** 2).reshape((-1,) + (1,) * (x.ndim - 1))
    if b > 0:
        x[-b:] *= (np.linspace(1, 0, b) ** 2).reshape((-1,) + (1,) * (x.ndim - 1))
    return x


# ----------------------------------------------------------------------------- dynamics
def _env_follow(level: np.ndarray, att: float, rel: float, block: int) -> np.ndarray:
    ca = np.exp(-block / (att * SR)); cr = np.exp(-block / (rel * SR))
    out = np.empty_like(level); e = 0.0
    for i, v in enumerate(level):
        c = ca if v > e else cr
        e = c * e + (1 - c) * v
        out[i] = e
    return out


def compress(x: np.ndarray, thresh_db=-18.0, ratio=3.0, att=0.005, rel=0.12, knee_db=6.0,
             makeup_db=0.0, block=48) -> np.ndarray:
    """feed-forward RMS compressor, block-rate gain computer (1 ms), interpolated gain."""
    mono = np.abs(x) if x.ndim == 1 else np.max(np.abs(x), axis=1)
    n = len(mono); nb = (n + block - 1) // block
    pad = np.zeros(nb * block); pad[:n] = mono ** 2
    lvl = np.sqrt(pad.reshape(nb, block).mean(1) + 1e-12)
    env = _env_follow(lvl, att, rel, block)
    db = 20 * np.log10(env + 1e-9)
    over = db - thresh_db
    gr = np.where(over <= -knee_db / 2, 0.0,
                  np.where(over >= knee_db / 2, over * (1 - 1 / ratio),
                           (1 - 1 / ratio) * (over + knee_db / 2) ** 2 / (2 * knee_db)))
    g = 10 ** ((makeup_db - gr) / 20)
    gi = np.interp(np.arange(n), np.arange(nb) * block + block / 2, g)
    return x * (gi if x.ndim == 1 else gi[:, None])


def true_peak(x: np.ndarray, over: int = 4) -> float:
    y = signal.resample_poly(x, over, 1, axis=0)
    return float(np.max(np.abs(y)))


def limiter(x: np.ndarray, ceiling_db=-1.0, lookahead=0.004, release=0.08, over=4) -> np.ndarray:
    """look-ahead brickwall limiter on the true-peak (oversampled) level."""
    ceil = 10 ** (ceiling_db / 20)
    y = signal.resample_poly(x, over, 1, axis=0)
    pk = np.max(np.abs(y), axis=1) if y.ndim == 2 else np.abs(y)
    pk = pk.reshape(-1, over).max(1)[: len(x)]
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    la = max(1, int(lookahead * SR))
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * la + 1, mode="nearest")
    # smooth: instant attack already handled by look-ahead min; release one-pole
    g = np.minimum(g, 1.0)
    cr = np.exp(-1.0 / (release * SR))
    gs = signal.lfilter([1 - cr], [1, -cr], g - 1.0) + 1.0     # rough smoothing
    gs = np.minimum(gs, g)                                        # never exceed required reduction
    # short attack ramp so min() steps are not clicks
    sm = np.ones(la) / la
    gs = np.minimum(np.convolve(gs, sm, mode="same"), 1.0)
    out = x * (gs[:, None] if x.ndim == 2 else gs)
    # final safety: scale if residual over ceiling
    tp = true_peak(out, over)
    if tp > ceil:
        out *= ceil / tp
    return out


# ----------------------------------------------------------------------------- space
def make_ir(dur=1.8, predelay=0.012, damp_hz=5500, bright_end_hz=1800, seed=7, early=True,
            density=1.0) -> np.ndarray:
    """synthetic stereo hall/room impulse response (decorrelated L/R filtered noise,
    frequency dependent decay, a few early reflections)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    r = rng(seed)
    ir = np.zeros((n, 2))
    rt = dur * 0.85
    for ch in range(2):
        w = r.standard_normal(n)
        lo = lp(w, bright_end_hz) * np.exp(-6.9 * t / rt)            # lows decay slower
        hi = hp(w, bright_end_hz) * np.exp(-6.9 * t / (rt * 0.55))   # highs die faster
        tail = lp(lo + hi, damp_hz)
        tail *= np.clip(t / 0.03, 0, 1) ** 1.5 * density
        ir[:, ch] = tail
    ir /= np.sqrt(np.sum(ir ** 2) / 2) + 1e-12
    if early:
        for k in range(10):
            d = predelay + r.uniform(0.003, 0.05)
            g = r.uniform(0.25, 0.6) * (1 - k / 12)
            i = int(d * SR)
            ir[i, k % 2] += g
            ir[i + int(r.uniform(0.0005, 0.002) * SR), 1 - k % 2] += g * 0.7
    pd = np.zeros((int(predelay * SR), 2))
    return np.vstack([pd, ir])


def reverb(x: np.ndarray, ir: np.ndarray, wet=0.2, dry=1.0) -> np.ndarray:
    """x mono or stereo -> stereo (len + len(ir) - 1 trimmed to len + tail)."""
    if x.ndim == 1:
        xs = np.stack([x, x], 1)
    else:
        xs = x
    y = np.stack([signal.fftconvolve(xs[:, c], ir[:, c]) for c in range(2)], 1)
    out = y * wet
    out[: len(xs)] += xs * dry
    return out


def pan(x: np.ndarray, p: float = 0.0) -> np.ndarray:
    """equal-power pan, p in [-1, 1]; mono -> stereo, stereo -> balance"""
    a = (p + 1) * np.pi / 4
    gl, gr = np.cos(a) * np.sqrt(2), np.sin(a) * np.sqrt(2)
    if x.ndim == 1:
        return np.stack([x * gl, x * gr], 1)
    return np.stack([x[:, 0] * gl, x[:, 1] * gr], 1)


def stereo(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 2 else np.stack([x, x], 1)


def widen(x: np.ndarray, delay_ms=11.0, amount=0.35) -> np.ndarray:
    """Haas-style width from mono: M +/- delayed-filtered side."""
    d = int(delay_ms * SR / 1000)
    side = np.concatenate([np.zeros(d), x[:-d] if d else x]) - x
    side = bp(side, 300, 9000)
    return np.stack([x + amount * side, x - amount * side], 1)


def add_at(buf: np.ndarray, x: np.ndarray, t: float, gain: float = 1.0) -> None:
    """mix x into buf at time t (clipped to buffer); stereo/mono aware."""
    i = ns(t)
    if i < 0:
        x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if n <= 0:
        return
    if buf.ndim == 2 and x.ndim == 1:
        buf[i:i + n] += gain * x[:n, None]
    else:
        buf[i:i + n] += gain * x[:n]


def normalize_peak(x: np.ndarray, peak_db: float = -1.0) -> np.ndarray:
    m = np.max(np.abs(x))
    return x if m == 0 else x * (10 ** (peak_db / 20) / m)


def db(x: float) -> float:
    return 20 * np.log10(max(x, 1e-12))

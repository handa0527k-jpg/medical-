"""Synthesised sound effects and ambiences for the story films (made here from noise and oscillators;
no third-party audio). Writes 48 kHz WAVs to $OUT (default production/nucleus-hq/audio/se/synth)."""
import os, wave
import numpy as np

SR = 48000
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(os.path.dirname(here))
out = os.environ.get('OUT') or os.path.join(root, 'production', 'nucleus-hq', 'audio', 'se', 'synth'); os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(2)

def write(name, x, stereo=None):
    x = np.asarray(x, dtype=np.float64)
    if stereo is None: st = np.stack([x, x], 1)
    else: st = stereo
    peak = np.max(np.abs(st)) or 1
    st = st / peak * 0.89
    with wave.open(os.path.join(out, name + '.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())

def colored(n, lo, hi, tilt=0.0, seed=None):
    """noise with energy between lo..hi Hz, spectral tilt (dB/oct)"""
    r = np.random.default_rng(seed) if seed is not None else rng
    X = np.fft.rfft(r.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    m = ((f >= lo) & (f <= hi)).astype(float)
    edge = 0.15
    m = np.where(f < lo, np.exp(-((lo - f) / (lo * edge + 1)) ** 2), m); m = np.where(f > hi, np.exp(-((f - hi) / (hi * edge + 1)) ** 2), m)
    if tilt: m = m * np.power(np.maximum(f, 20) / 1000, tilt / 6.02)
    y = np.fft.irfft(X * m, n); return y / (np.max(np.abs(y)) + 1e-9)

def env(n, a, d, shape=1.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d); return e ** shape

def t_(sec): return int(sec * SR)

# --- a single key click (several variants) and a typing burst
def key(seed):
    n = t_(0.07); r = np.random.default_rng(seed)
    click = colored(n, 1500, 7000, seed=seed) * env(n, 0.0005, 0.006)
    thock = colored(n, 150, 900, seed=seed + 50) * env(n, 0.001, 0.02) * 0.6
    return (click * (0.7 + 0.3 * r.random()) + thock)
def typing(sec, rate, seed, name):
    n = t_(sec); y = np.zeros(n + t_(0.1)); r = np.random.default_rng(seed); t = 0.05
    while t < sec:
        k = key(int(r.integers(0, 999))); i = t_(t); y[i:i + len(k)] += k * (0.5 + 0.5 * r.random())
        t += r.exponential(1 / rate) + 0.03
        if r.random() < 0.06: t += 0.35  # a thinking pause
    write(name, y)
typing(5.5, 7, 1, 'typing_long'); typing(1.2, 6, 2, 'typing_short'); typing(3.2, 11, 3, 'typing_fast')

# --- empty can: lift, shake (dry rattle of a few drops), set down
n = t_(1.6); y = np.zeros(n)
for i, tt in enumerate([0.25, 0.42, 0.58, 0.74]):
    m = t_(0.12); s = colored(m, 2500, 9000, seed=10 + i) * env(m, 0.001, 0.02) * 0.35 + colored(m, 600, 2000, seed=20 + i) * env(m, 0.002, 0.03) * 0.25
    y[t_(tt):t_(tt) + m] += s
write('can_shake', y)
m = t_(0.25); write('can_set', colored(m, 300, 4000, seed=31) * env(m, 0.001, 0.03) + np.sin(2 * np.pi * 1900 * np.arange(m) / SR) * env(m, 0.001, 0.05) * 0.2)

# --- phone vibrating on a desk (two pulses)
n = t_(1.5); t = np.arange(n) / SR
buzz = (np.sign(np.sin(2 * np.pi * 165 * t)) * 0.5 + np.sin(2 * np.pi * 330 * t) * 0.5) * (colored(n, 100, 3000, seed=40) * 0.3 + 0.7)
gate = ((t > 0.0) & (t < 0.42)) | ((t > 0.62) & (t < 1.04))
write('phone_buzz', buzz * gate * 0.6 * (0.9 + 0.1 * np.sin(2 * np.pi * 9 * t)))

# --- power down: relay clunk, the hum dropping in pitch and dying
n = t_(3.0); t = np.arange(n) / SR
f = 100 * np.exp(-t * 0.9) + 20; ph = 2 * np.pi * np.cumsum(f) / SR
hum = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.exp(-t * 1.6) * 0.35
clunk = colored(n, 60, 1800, seed=50) * env(n, 0.001, 0.05) * 1.0
tick = colored(n, 2000, 8000, seed=51) * env(n, 0.0003, 0.004) * 0.6
write('power_down', hum + clunk + tick)

# --- power up: relays clicking through the floors, tubes ticking on, hum rising
n = t_(3.5); t = np.arange(n) / SR; y = np.zeros(n)
for i, tt in enumerate([0.0, 0.18, 0.31, 0.55, 0.7, 0.92, 1.3]):
    m = t_(0.08); y[t_(tt):t_(tt) + m] += colored(m, 800, 6000, seed=60 + i) * env(m, 0.0005, 0.008) * (0.8 - i * 0.07)
ph = 2 * np.pi * 100 * t; rise = np.clip((t - 0.2) / 1.2, 0, 1)
y += (np.sin(ph) * 0.5 + 0.25 * np.sin(2 * ph)) * rise * 0.18
write('power_up', y)

# --- heartbeat (lub-dub)
n = t_(0.9); t = np.arange(n) / SR
def thump(at, f0, amp):
    e = np.where(t >= at, np.exp(-(t - at) / 0.06), 0) * np.clip((t - at) / 0.004, 0, 1)
    return np.sin(2 * np.pi * f0 * (t - at)) * e * amp
write('heartbeat', thump(0.0, 52, 1) + thump(0.16, 46, 0.7))

# --- fluorescent tick, laptop fan spin-down, phone camera shutter
m = t_(0.06); write('tube_tick', colored(m, 1500, 9000, seed=70) * env(m, 0.0003, 0.006))
m = t_(0.35); y = colored(m, 1200, 8000, seed=71) * env(m, 0.0005, 0.012); y[t_(0.09):] += colored(m - t_(0.09), 900, 7000, seed=72) * env(m - t_(0.09), 0.0005, 0.02) * 0.8
write('shutter', y)

# --- tea poured from a flask into a cup (a gurgling, filling stream)
n = t_(2.6); t = np.arange(n) / SR
stream = colored(n, 300, 5000, seed=80) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t + np.sin(2 * np.pi * 1.3 * t) * 3))
fill = np.clip(t / 2.2, 0, 1); bub = np.zeros(n)
for i in range(40):
    at = rng.random() * 2.2; f0 = 500 + 900 * fill[min(n - 1, t_(at))] + rng.random() * 200; m = t_(0.03)
    s = np.sin(2 * np.pi * f0 * np.arange(m) / SR) * env(m, 0.001, 0.008); bub[t_(at):t_(at) + m] += s * 0.3
write('pour', (stream * 0.5 + bub) * np.clip((2.4 - t) / 0.2, 0, 1) * np.clip(t / 0.08, 0, 1))

# --- marker on a whiteboard (squeaky strokes) and an eraser wipe
def strokes(sec, seed, name, squeak=True):
    n = t_(sec); t = np.arange(n) / SR; y = np.zeros(n); r = np.random.default_rng(seed); at = 0.05
    while at < sec - 0.3:
        d = 0.12 + r.random() * 0.35; m = t_(d); tt = np.arange(m) / SR
        f0 = 900 + r.random() * 900
        s = colored(m, 2000, 9000, seed=int(r.integers(0, 9999))) * 0.35
        if squeak: s += np.sin(2 * np.pi * (f0 + 300 * np.sin(2 * np.pi * 3 * tt)) * tt) * 0.12
        s *= np.sin(np.pi * np.arange(m) / m) ** 0.5
        y[t_(at):t_(at) + m] += s; at += d + 0.05 + r.random() * 0.25
    write(name, y)
strokes(4.0, 90, 'marker'); strokes(1.4, 91, 'marker_short')
n = t_(1.2); t = np.arange(n) / SR; write('erase', colored(n, 300, 3500, seed=92) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 2.5 * t))) * np.sin(np.pi * t / 1.2))

# --- can of coffee opened (pssht) and an elevator chime (morning lobby)
m = t_(0.5); write('can_open', colored(m, 2000, 12000, seed=95) * env(m, 0.002, 0.12) + colored(m, 200, 2000, seed=96) * env(m, 0.0005, 0.01))
n = t_(2.2); t = np.arange(n) / SR
write('chime', np.sin(2 * np.pi * 880 * t) * np.exp(-t * 2.2) * 0.6 + np.sin(2 * np.pi * 1318.5 * t) * np.exp(-(t - 0.35).clip(0) * 2.2) * (t > 0.35) * 0.5)

# ================= ambiences (long, stereo, loopable by crossfade) =================
def amb(name, sec, layers):
    n = t_(sec); L = np.zeros(n); R = np.zeros(n)
    for fn in layers:
        a, b = fn(n); L += a; R += b
    write(name, None, np.stack([L, R], 1))
def hvac(n):  # air handling: broadband rumble + a soft 100 Hz hum
    t = np.arange(n) / SR
    a = colored(n, 40, 1200, tilt=-4, seed=101) * 0.5 + np.sin(2 * np.pi * 100 * t) * 0.03 + np.sin(2 * np.pi * 50 * t) * 0.02
    b = colored(n, 40, 1200, tilt=-4, seed=102) * 0.5 + np.sin(2 * np.pi * 100 * t) * 0.03 + np.sin(2 * np.pi * 50 * t) * 0.02
    return a, b
def city_far(n):  # distant traffic through glass: low rumble swelling with passing cars
    t = np.arange(n) / SR
    sw = 0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t) * np.sin(2 * np.pi * 0.13 * t + 1)
    return colored(n, 30, 400, tilt=-6, seed=110) * 0.45 * sw, colored(n, 30, 400, tilt=-6, seed=111) * 0.45 * sw
def glass_wind(n):  # a faint wind on the glass
    t = np.arange(n) / SR; g = 0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t) ** 2
    return colored(n, 200, 2500, tilt=-3, seed=120) * 0.12 * g, colored(n, 200, 2500, tilt=-3, seed=121) * 0.12 * g
def street(n):  # the street at night from outside: traffic, a passing car, wind
    t = np.arange(n) / SR; a = colored(n, 40, 3000, tilt=-5, seed=130) * 0.35; b = colored(n, 40, 3000, tilt=-5, seed=131) * 0.35
    for c in [3.0, 9.5, 17.0, 26.0, 35.0, 48.0]:
        e = np.exp(-((t - c) / 1.6) ** 2); pan = np.clip((t - c) / 3 + 0.5, 0, 1)
        car = colored(n, 80, 2500, tilt=-3, seed=int(c * 10)) * e * 0.8; a += car * (1 - pan); b += car * pan
    return a, b
def morning(n):  # morning street: traffic a little busier and a few small birds
    a, b = street(n); t = np.arange(n) / SR; r = np.random.default_rng(140)
    for i in range(30):
        at = r.random() * (n / SR - 1); f0 = 3200 + r.random() * 1800; m = t_(0.12)
        tt = np.arange(m) / SR; s = np.sin(2 * np.pi * (f0 + 900 * np.sin(2 * np.pi * 18 * tt)) * tt) * np.sin(np.pi * tt / 0.12) * 0.12
        k = r.random(); a[t_(at):t_(at) + m] += s * k; b[t_(at):t_(at) + m] += s * (1 - k)
    return a * 1.2, b * 1.2
amb('amb_office_hum', 60, [hvac, city_far])
amb('amb_dark', 60, [city_far, glass_wind])
amb('amb_street_night', 60, [street])
amb('amb_morning', 60, [morning])
print('synth SE written to', out)

#!/usr/bin/env python3
"""
BLOOD STORY sound effects, synthesised with numpy/scipy (no samples, no copyright issues).

    python3 tools/sfx.py            -> audio/se/*.wav (48 kHz stereo, 24-bit, peak -1 dBFS)

Every effect is a function returning a stereo array, so the full episode can call them with
other parameters (lengths, seeds, pitches).  Layering recipe used throughout:
body (tonal / filtered noise) + transient + air, each with its own envelope, then a small space.
"""
from __future__ import annotations

import os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import (SR, AUDIO, write_wav, t_axis, white, pink, brown, sine, saw, lp, hp, bp, eq,  # noqa: E402
                       sweep_filter, exp_decay, fade, make_ir, reverb, pan, stereo, widen, rng,
                       normalize_peak, mtof, note)

SE_DIR = os.path.join(AUDIO, "se")


def sat(x, drive=1.5):
    return np.tanh(drive * x) / np.tanh(drive)


def pad_to(x, n):
    if len(x) >= n:
        return x[:n]
    return np.concatenate([x, np.zeros((n - len(x),) + x.shape[1:])])


def mix(*parts, n=None):
    n = n or max(len(p) for p in parts)
    out = np.zeros((n, 2))
    for p in parts:
        out += stereo(pad_to(p, n))
    return out


def glide(f0, f1, dur, curve=4.0):
    t = t_axis(dur)
    return f1 + (f0 - f1) * np.exp(-curve * t / dur)


def autopan(x, p0, p1):
    """mono -> stereo with pan moving linearly from p0 to p1"""
    p = np.linspace(p0, p1, len(x))
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)


# ----------------------------------------------------------------------------- heartbeat
def heartbeat(intensity=1.0, seed=1):
    """one lub-dub (0.95 s): sub-bass thump + chest body + soft valve click, dark in-body space"""
    def beat(f0, f1, tau, body_f, amp, click, s):
        d = 0.6
        t = t_axis(d)
        sub = sine(glide(f0, f1, d, 6.0)) * np.exp(-t / tau) * np.clip(t / 0.004, 0, 1)
        body = sine(glide(body_f * 1.4, body_f, d, 10.0)) * np.exp(-t / (tau * 0.45)) * 0.45
        n = lp(white(d, s), 900) * np.exp(-t / 0.018) * click
        thud = lp(white(d, s + 1), 220) * np.exp(-t / 0.05) * 0.6
        return sat(amp * (sub + body + n + thud), 1.8)
    lub = beat(64, 40, 0.13, 105, 1.0, 0.35, seed)
    dub = beat(78, 52, 0.09, 130, 0.72, 0.5, seed + 7)
    out = np.zeros(int(0.95 * SR))
    out[: len(lub)] += lub
    i = int(0.27 * SR)
    out[i:i + len(dub)] += dub[: len(out) - i]
    out = eq(out, [("lowshelf", 60, 0.7, 3.0), ("peak", 350, 1.0, -3.0), ("lp", 2500, 0.7, 0)])
    ir = make_ir(dur=0.6, predelay=0.004, damp_hz=1200, bright_end_hz=400, seed=21)
    y = reverb(out * intensity, ir, wet=0.18)
    return fade(y[: int(1.25 * SR)], 0.001, 0.2)


# ----------------------------------------------------------------------------- whooshes
def whoosh(dur=1.3, f_lo=350, f_hi=4200, peak_at=0.62, p0=-0.7, p1=0.7, size=1.0, seed=3, tone=True):
    """accelerating pass-by: band-passed noise sweeping up then down, moving across the stereo field,
    plus a low swell and (optionally) a doppler-ish pitched rush."""
    t = t_axis(dur)
    u = t / dur
    env = np.where(u < peak_at, (u / peak_at) ** 2.2, np.exp(-5.5 * (u - peak_at) / (1 - peak_at)))
    fc = lambda v: f_lo + (f_hi - f_lo) * (np.sin(np.pi * min(1, v / (peak_at * 2))) if v < peak_at * 2 else 0.05)
    n = pink(dur, seed)
    air = sweep_filter(n, lambda v: max(f_lo, fc(v)), None, kind="bp", q=1.4) * 2.4
    hiss = hp(white(dur, seed + 1), 5000) * 0.06
    low = lp(brown(dur, seed + 2), 160) * 0.9 * size
    parts = [autopan((air + hiss) * env, p0, p1), stereo(low * env ** 1.5)]
    if tone:
        f = 180 * np.where(u < peak_at, 1 + 0.25 * u / peak_at, 1.25 - 0.45 * (u - peak_at) / (1 - peak_at))
        rush = lp(saw(f), 700) * 0.12 * env
        parts.append(autopan(rush, p0 * 0.5, p1 * 0.5))
    y = mix(*parts)
    ir = make_ir(dur=0.9, damp_hz=7000, seed=5)
    return fade(reverb(y, ir, wet=0.15)[: int((dur + 0.5) * SR)], 0.005, 0.3)


def dash(seed=9):
    """dash start: short heavy swoosh + low kick-off thump + grit"""
    sw = whoosh(0.55, 500, 5200, peak_at=0.3, p0=-0.3, p1=0.5, size=0.6, seed=seed, tone=False)
    t = t_axis(0.5)
    thump = sine(glide(120, 48, 0.5, 8)) * np.exp(-t / 0.07) * 0.9
    grit = bp(white(0.5, seed + 3), 1500, 6000) * np.exp(-t / 0.03) * 0.35
    return fade(mix(sw, sat(thump + grit, 1.4)), 0.001, 0.1)


def turn_whip(seed=13):
    """fast whip / swish for a turn of the head / body"""
    d = 0.42
    t = t_axis(d)
    u = t / d
    env = np.where(u < 0.25, (u / 0.25) ** 3, np.exp(-9 * (u - 0.25)))
    n = white(d, seed)
    sw = sweep_filter(n, lambda v: 900 + 6500 * min(1, (v / 0.3)) ** 1.5 if v < 0.3 else 7400 - 4000 * (v - 0.3),
                      None, kind="bp", q=2.2)
    cloth = bp(pink(d, seed + 1), 300, 2500) * 0.3
    y = autopan((sw * 1.3 + cloth) * env, -0.4, 0.4)
    ir = make_ir(dur=0.5, seed=31)
    return fade(reverb(y, ir, wet=0.12)[: int(0.7 * SR)], 0.001, 0.15)


# ----------------------------------------------------------------------------- beds
def flow_bed(dur=11.5, pulse_hz=1.15, seed=17):
    """blood-flow bed: deep rumble + rushing wind with slow movement + pulsatile surges, wide stereo."""
    t = t_axis(dur)
    pulse = 0.75 + 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * pulse_hz * t - np.pi / 2)) ** 3
    chans = []
    for c in range(2):
        rum = lp(brown(dur, seed + c), 140, 4) * 0.8
        wind_src = pink(dur, seed + 10 + c)
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (0.13 + 0.03 * c) * t + c)
        wind = sweep_filter(wind_src, lambda v, c=c: 500 + 700 * (0.5 + 0.5 * np.sin(2 * np.pi * v * 1.6 + c)),
                            None, kind="bp", q=0.8) * (0.9 + 0.6 * lfo)
        hiss = hp(white(dur, seed + 20 + c), 3500) * 0.03
        chans.append((rum + wind * pulse + hiss) * pulse)
    y = np.stack(chans, 1)
    y = fade(y, 0.9, 1.4)
    return y


def squeeze(dur=3.2, seed=23):
    """capillary squeeze: soft rubbery stretch (stick-slip friction through a resonant, slowly closing tube)"""
    t = t_axis(dur)
    u = t / dur
    r = rng(seed)
    # stick-slip: low saw whose pitch wanders and jitters
    jitter = np.repeat(r.normal(0, 1, int(dur * 60) + 1), SR // 60)[: len(t)]
    f = 38 + 22 * np.sin(np.pi * u) + 6 * lp(jitter, 8) * 10
    rub = saw(np.clip(f, 20, 120))
    rub = eq(rub, [("lp", 900, 0.7, 0), ("peak", 420, 4.0, 8), ("peak", 780, 5.0, 6)])
    # tube resonance: narrowing (formant rises as the vessel narrows)
    src = pink(dur, seed + 1)
    tube = sweep_filter(src, lambda v: 260 + 520 * np.sin(np.pi * min(1, v * 1.2)) ** 1.5, None, kind="bp", q=6)
    env = np.sin(np.pi * u) ** 0.8 * (0.8 + 0.2 * np.sin(2 * np.pi * 1.7 * t))
    creak = np.zeros_like(t)
    for k in range(7):                       # a few rubbery creaks
        c0 = r.uniform(0.2, dur - 0.4)
        d = r.uniform(0.12, 0.3)
        tt = t_axis(d)
        cf = r.uniform(180, 320) * (1 + 0.6 * tt / d)
        cr = lp(saw(cf), 1500) * np.sin(np.pi * tt / d) ** 2 * r.uniform(0.15, 0.3)
        i = int(c0 * SR); creak[i:i + len(cr)] += cr[: len(t) - i]
    y = (rub * 0.25 + tube * 0.9 + creak) * env
    y = widen(lp(y, 2500), 9, 0.4)
    ir = make_ir(dur=0.5, damp_hz=2500, seed=41)
    return fade(reverb(y, ir, wet=0.15)[: int((dur + 0.3) * SR)], 0.2, 0.4)


# ----------------------------------------------------------------------------- tonal effects
def bell(f, dur=2.0, amp=1.0, bright=1.0, seed=0):
    t = t_axis(dur)
    ratios = [(1.0, 1.0, 1.0), (2.0, 0.45, 0.6), (2.76, 0.35 * bright, 0.4), (5.4, 0.18 * bright, 0.22),
              (8.93, 0.08 * bright, 0.12)]
    y = np.zeros_like(t)
    for r_, a, tau in ratios:
        y += a * np.sin(2 * np.pi * f * r_ * t + seed * r_) * np.exp(-t / (tau * dur * 0.5))
    y += 0.25 * hp(white(dur, seed + 50), 4000) * np.exp(-t / 0.004)
    return amp * y * np.clip(t / 0.0015, 0, 1)


def o2_pickup(seed=29):
    """sparkle gathering into the hands: rising D-major pentatonic pings + shimmer + soft bloom"""
    d = 1.8
    out = np.zeros((int(d * SR), 2))
    r = rng(seed)
    scale = [note(n) for n in ["D6", "E6", "F#6", "A6", "B6", "D7", "E7", "F#7", "A7"]]
    for k in range(16):
        tt = 0.03 + 0.055 * k + r.uniform(-0.01, 0.01)
        m = scale[min(len(scale) - 1, k * len(scale) // 16)] + r.choice([0, 0, 12]) * 0
        b = bell(mtof(m) * (1 + r.uniform(-0.003, 0.003)), dur=0.8, amp=0.25 * (0.6 + 0.4 * k / 16), seed=k)
        i = int(tt * SR)
        out[i:i + len(b)] += pan(b, r.uniform(-0.6, 0.6))[: len(out) - i]
    t = t_axis(d)
    shimmer = hp(white(d, seed), 6500) * np.sin(np.pi * np.clip(t / 1.2, 0, 1)) ** 2 * 0.12
    bloom = (sine(mtof(note("D4")), d) + 0.5 * sine(mtof(note("A4")), d)) * np.sin(np.pi * np.clip(t / 1.6, 0, 1)) ** 2 * 0.18
    out += widen(shimmer, 13, 0.6) + stereo(bloom)
    ir = make_ir(dur=1.6, damp_hz=9000, seed=43)
    return fade(reverb(out, ir, wet=0.35)[: int(2.6 * SR)], 0.002, 0.6)


def o2_deliver(seed=31):
    """O2 delivery chime: two-note bell (A6 -> D7) with glassy overtones and a warm pad under it"""
    d = 2.4
    out = np.zeros((int(d * SR), 2))
    for tt, n, p in [(0.0, "A6", -0.2), (0.14, "D7", 0.2), (0.28, "F#7", 0.0)]:
        b = bell(mtof(note(n)), 2.0, 0.5, 1.2, seed=int(tt * 100))
        i = int(tt * SR); out[i:i + len(b)] += pan(b, p)[: len(out) - i]
    t = t_axis(d)
    pad = sum(sine(mtof(note(n)) * (1 + det), d) for n in ["D5", "F#5", "A5"] for det in (-0.002, 0.002))
    pad = pad * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * 0.06
    out += widen(pad, 9, 0.3)
    ir = make_ir(dur=2.0, damp_hz=10000, seed=47)
    return fade(reverb(out, ir, wet=0.3)[: int(3.2 * SR)], 0.002, 0.8)


def relief(seed=37):
    """relief: a soft exhale-like noise swell over a warm falling dyad (tonal, not a voice)"""
    d = 1.6
    t = t_axis(d)
    u = t / d
    env = np.sin(np.pi * np.clip(u / 0.9, 0, 1)) ** 1.5
    f = mtof(note("A4")) * (1 - 0.06 * u)
    dy = (sine(f) + 0.6 * sine(f * 2 / 3 * 2) + 0.2 * sine(f * 0.5)) * env * 0.25
    air = sweep_filter(pink(d, seed), 1800, 600, kind="bp", q=1.2) * env * 0.35
    y = widen(lp(dy + air, 3500), 12, 0.4)
    ir = make_ir(dur=1.4, damp_hz=5000, seed=53)
    return fade(reverb(y, ir, wet=0.3)[: int(2.3 * SR)], 0.05, 0.5)


def siren(dur=4.0, cycles=5, f_lo=560, f_hi=1050, seed=41):
    """emergency wail 'ウウウウウッ': repeated rising/falling whoops, two slightly detuned horns,
    hard cut at the end ('ッ') softened by the space."""
    t = t_axis(dur)
    ph = (t * cycles / dur) % 1.0
    contour = np.where(ph < 0.55, (ph / 0.55) ** 0.6, 1 - (np.maximum(ph - 0.55, 0) / 0.45) ** 1.6 * 0.85)
    f = f_lo + (f_hi - f_lo) * contour
    f = lp(f, 25)
    horn = np.zeros_like(t)
    for det, a in [(1.0, 1.0), (1.012, 0.7)]:
        ff = f * det
        h = sum(np.sin(2 * np.pi * np.cumsum(ff * k) / SR) / k for k in (1, 3, 5, 7, 9))
        horn += a * h
    horn = sat(horn * 0.7, 2.0)
    horn = eq(horn, [("hp", 300, 0.7, 0), ("peak", 1800, 1.0, 3), ("lp", 5000, 0.7, 0)])
    env = np.clip(t / 0.08, 0, 1) * np.clip((dur - t) / 0.02, 0, 1)
    env *= 0.85 + 0.15 * np.sin(2 * np.pi * cycles / dur * t)
    y = horn * env
    y = np.stack([y, np.concatenate([np.zeros(int(0.007 * SR)), y[:-int(0.007 * SR)]])], 1)  # wide, distant
    ir = make_ir(dur=1.8, predelay=0.03, damp_hz=4000, seed=57)
    return fade(reverb(y, ir, wet=0.45, dry=0.8)[: int((dur + 1.2) * SR)], 0.01, 0.8)


def impact(seed=43):
    """final hit: sub drop + punchy body + crack + metallic crash tail + big space"""
    d = 3.0
    t = t_axis(d)
    sub = sine(glide(95, 34, d, 3.5)) * np.exp(-t / 0.55)
    body = sine(glide(220, 90, d, 25)) * np.exp(-t / 0.09) * 0.6
    crack = bp(white(d, seed), 800, 7000) * np.exp(-t / 0.035) * 0.9
    r = rng(seed)
    metal = np.zeros_like(t)
    for k in range(40):
        fk = r.uniform(400, 9000)
        metal += np.sin(2 * np.pi * fk * t + r.uniform(0, 6)) * np.exp(-t / r.uniform(0.3, 1.2)) / 40
    crash = (hp(white(d, seed + 1), 3500) * np.exp(-t / 0.7) * 0.18 + metal * 0.9) * np.clip(t / 0.003, 0, 1)
    core = sat((sub * 1.1 + body + crack) * np.clip(t / 0.0015, 0, 1), 1.6)
    y = mix(stereo(core), widen(crash, 15, 0.7))
    ir = make_ir(dur=2.6, damp_hz=6000, seed=61)
    return fade(reverb(y, ir, wet=0.28)[: int(3.6 * SR)], 0.0005, 1.0)


# ----------------------------------------------------------------------------- footsteps
def step_light(seed=0):
    """Akane: small fast shoe - tight click, soft thud, a little wet slap of the vessel floor"""
    r = rng(seed)
    d = 0.25
    t = t_axis(d)
    pitch = r.uniform(0.9, 1.1)
    thud = sine(glide(170 * pitch, 95 * pitch, d, 14)) * np.exp(-t / 0.028) * 0.45
    click = bp(white(d, seed), 2500, 9000) * np.exp(-t / 0.006) * 0.8
    slap = bp(white(d, seed + 3), 700 * pitch, 2400 * pitch) * np.exp(-np.maximum(t - 0.008, 0) / 0.03) * 0.35 \
        * (t > 0.008)
    y = (thud + click + slap) * np.clip(t / 0.0008, 0, 1)
    return fade(stereo(y), 0.0005, 0.05)


def step_boot(seed=0):
    """Shirou: heavier boots - low heel thump, leather knock, a short gear jingle"""
    r = rng(seed + 100)
    d = 0.32
    t = t_axis(d)
    pitch = r.uniform(0.92, 1.06)
    thump = sine(glide(120 * pitch, 58 * pitch, d, 10)) * np.exp(-t / 0.055) * 1.0
    knock = bp(white(d, seed + 5), 250, 1200) * np.exp(-t / 0.02) * 0.6
    heel = bp(white(d, seed + 6), 1800, 5000) * np.exp(-t / 0.008) * 0.3
    jingle = np.zeros_like(t)
    for k in range(5):
        fk = r.uniform(3500, 7500)
        jingle += np.sin(2 * np.pi * fk * t) * np.exp(-np.maximum(t - 0.02, 0) / 0.04) * (t > 0.02) * 0.04
    y = sat((thump + knock + heel + jingle) * np.clip(t / 0.001, 0, 1), 1.3)
    return fade(stereo(y), 0.0005, 0.06)


# ----------------------------------------------------------------------------- build
def build():
    os.makedirs(SE_DIR, exist_ok=True)
    items = {
        "heartbeat.wav": heartbeat(),
        "whoosh_1.wav": whoosh(1.3, seed=3),
        "whoosh_2.wav": whoosh(1.7, 300, 5200, peak_at=0.68, p0=0.6, p1=-0.6, size=1.3, seed=4),
        "flow_bed.wav": flow_bed(),
        "o2_pickup.wav": o2_pickup(),
        "dash.wav": dash(),
        "squeeze.wav": squeeze(),
        "o2_deliver.wav": o2_deliver(),
        "relief.wav": relief(),
        "siren.wav": siren(),
        "turn.wav": turn_whip(),
        "impact.wav": impact(),
        **{f"step_akane_{i}.wav": step_light(i) for i in range(4)},
        **{f"step_shirou_{i}.wav": step_boot(i) for i in range(4)},
    }
    for name, y in items.items():
        y = normalize_peak(stereo(y), -1.0)
        write_wav(os.path.join(SE_DIR, name), y)
        print(f"  se/{name:20s} {len(y) / SR:5.2f}s")


# ============================================================================= episode 1 additions
def holo(up=True, seed=61):
    """hologram on/off: quick digital arpeggio blips (sine + soft square edge) + glassy shimmer sweep"""
    d = 0.9
    out = np.zeros((int(d * SR), 2))
    seq = ["A5", "E6", "A6", "C#7", "E7"] if up else ["E7", "C#7", "A6", "E6", "A5"]
    for k, nm in enumerate(seq):
        f = mtof(note(nm))
        t = t_axis(0.12)
        b = (np.sin(2 * np.pi * f * t) + 0.25 * np.sign(np.sin(2 * np.pi * f * t))) * np.exp(-t / 0.035)
        b = lp(b * np.clip(t / 0.002, 0, 1), 7000) * 0.35
        i = int(k * 0.045 * SR)
        out[i:i + len(b)] += pan(b, -0.5 + 0.25 * k if up else 0.5 - 0.25 * k)
    t = t_axis(d)
    sh = sweep_filter(white(d, seed), 2500 if up else 9000, 9000 if up else 2500, kind="bp", q=3.0)
    sh *= np.sin(np.pi * np.clip(t / 0.6, 0, 1)) ** 2 * 0.25
    out += widen(sh, 9, 0.6)
    ir = make_ir(dur=0.9, damp_hz=9000, seed=63)
    return fade(reverb(out, ir, wet=0.3)[: int(1.4 * SR)], 0.001, 0.3)


def centrifuge(up=0.5, hold=1.0, down=1.0, seed=65):
    """motor whir: spin-up (pitch rises), steady whine with rotor beating, spin-down (pitch falls, clunk)"""
    d = up + hold + down
    t = t_axis(d + 0.3)
    rate = np.interp(t, [0, up, up + hold, d, d + 0.3], [3, 60, 62, 0.5, 0])   # rotations per second
    ph = np.cumsum(rate) / SR
    whine = sum(np.sin(2 * np.pi * ph * k * 8) / k for k in (1, 2, 3)) * (rate / 62) ** 0.8
    motor = saw(np.maximum(rate * 2.0, 1.0)) * 0.2 * (rate / 62)
    beat = 0.6 + 0.4 * np.sin(2 * np.pi * ph)                # rotor imbalance wobble
    air = bp(pink(len(t) / SR, seed), 400, 3000) * (rate / 62) ** 1.5 * 0.5
    y = (lp(whine, 4000) * 0.4 + lp(motor, 1200) + air) * beat
    clunk = np.zeros_like(t)
    tt = t_axis(0.25)
    c = (sine(glide(160, 70, 0.25, 10)) * np.exp(-tt / 0.04) + bp(white(0.25, seed + 1), 600, 3000) * np.exp(-tt / 0.01) * 0.4)
    i = int((d - 0.05) * SR); clunk[i:i + len(c)] += c[: len(t) - i]
    y = y + clunk * 0.6
    y = widen(y, 7, 0.35)
    ir = make_ir(dur=0.6, damp_hz=5000, seed=67)
    return fade(reverb(y, ir, wet=0.15)[: int((d + 0.6) * SR)], 0.01, 0.2)


def ding(nm="A6", seed=0):
    """layer label accent: soft glassy ding with a sparkle"""
    b = bell(mtof(note(nm)), 1.6, 0.6, 0.8, seed=seed)
    t = t_axis(1.6)
    sp = hp(white(1.6, seed + 3), 7000) * np.exp(-t / 0.08) * 0.08
    y = widen(b + sp, 8, 0.3)
    ir = make_ir(dur=1.4, damp_hz=9000, seed=71)
    return fade(reverb(y, ir, wet=0.3)[: int(2.2 * SR)], 0.001, 0.5)


def squelch(dur=0.9, seed=73):
    """clot / thickening: wet low squelch (resonant falling formant over gloopy noise + bubbles)"""
    t = t_axis(dur)
    u = t / dur
    src = brown(dur, seed) * 0.6 + pink(dur, seed + 1) * 0.4
    y = sweep_filter(src, lambda v: 900 - 650 * v ** 0.7, None, kind="bp", q=5)
    y *= np.sin(np.pi * np.clip(u / 0.95, 0, 1)) ** 0.7
    r = rng(seed)
    for k in range(5):
        tt = t_axis(0.08)
        f0 = r.uniform(180, 420)
        bl = sine(glide(f0, f0 * 1.8, 0.08, 3)) * np.exp(-tt / 0.02) * 0.4
        i = int(r.uniform(0.05, dur - 0.1) * SR); y[i:i + len(bl)] += bl[: len(y) - i]
    y = lp(sat(y * 1.5, 1.3), 2500)
    ir = make_ir(dur=0.5, damp_hz=3000, seed=75)
    return fade(reverb(stereo(y), ir, wet=0.15)[: int((dur + 0.3) * SR)], 0.005, 0.2)


def soft_pop(f=520, seed=0):
    """bubbly pop: short upward-gliding sine + tiny click"""
    d = 0.35
    t = t_axis(d)
    y = sine(glide(f * 0.6, f * 1.5, d, 12)) * np.exp(-t / 0.05)
    y += bp(white(d, seed), 1500, 6000) * np.exp(-t / 0.004) * 0.2
    y = widen(y * np.clip(t / 0.001, 0, 1), 6, 0.2)
    ir = make_ir(dur=0.7, damp_hz=7000, seed=77)
    return fade(reverb(y, ir, wet=0.25)[: int(0.8 * SR)], 0.0005, 0.2)


def rotate_whoosh(seed=79):
    """slow model rotation: airy circular whoosh (pan sweeps L->R->L) with a faint shimmer"""
    d = 1.6
    t = t_axis(d)
    u = t / d
    env = np.sin(np.pi * u) ** 1.5
    n = sweep_filter(pink(d, seed), lambda v: 600 + 2200 * np.sin(np.pi * v), None, kind="bp", q=1.6)
    p = np.sin(2 * np.pi * u) * 0.7
    a = (p + 1) * np.pi / 4
    y = np.stack([n * env * np.cos(a), n * env * np.sin(a)], 1) * np.sqrt(2)
    sh = hp(white(d, seed + 1), 8000) * env * 0.05
    y += widen(sh, 11, 0.6)
    ir = make_ir(dur=1.0, seed=81)
    return fade(reverb(y, ir, wet=0.2)[: int(2.0 * SR)], 0.05, 0.3)


def stretch_spring(seed=83):
    """membrane stretch (rubbery rising creak, 0-0.9 s) then elastic spring-back 'boing' (0.9 s-)"""
    d = 0.9
    t = t_axis(d)
    u = t / d
    f = 90 + 160 * u ** 1.4
    rub = eq(saw(f), [("lp", 1600, 0.7, 0), ("peak", 500 + 500 * 0.5, 4.0, 6)])
    rub *= (0.3 + 0.7 * u) * 0.3
    tube = sweep_filter(pink(d, seed), 250, 900, kind="bp", q=6) * (0.3 + 0.7 * u) * 0.6
    st = rub + tube
    d2 = 0.9
    t2 = t_axis(d2)
    boing = sine(260 * (1 + 0.5 * np.exp(-t2 / 0.05)) * (1 + 0.04 * np.sin(2 * np.pi * 14 * t2) * np.exp(-t2 / 0.3))) \
        * np.exp(-t2 / 0.25) * 0.6
    boing += sine(130 * np.ones_like(t2)) * np.exp(-t2 / 0.15) * 0.3
    y = np.concatenate([st, boing])
    y = widen(y, 8, 0.35)
    ir = make_ir(dur=0.6, damp_hz=5000, seed=85)
    return fade(reverb(y, ir, wet=0.15)[: int(2.1 * SR)], 0.02, 0.2)


def o2_click(nm="D7", seed=0):
    """O2 binding to heme iron: metallic click + small bright chime"""
    d = 1.0
    t = t_axis(d)
    clk = bp(white(d, seed), 2000, 9000) * np.exp(-t / 0.003) * 0.8
    clk += sine(glide(1800, 900, d, 40)) * np.exp(-t / 0.01) * 0.4
    ch = bell(mtof(note(nm)), d, 0.35, 1.0, seed=seed)
    y = widen(clk + ch, 7, 0.3)
    ir = make_ir(dur=1.0, damp_hz=9000, seed=87)
    return fade(reverb(y, ir, wet=0.22)[: int(1.4 * SR)], 0.0005, 0.3)


def breath(seed=89):
    """lung breath: inhale swell (1.3 s, rising) + exhale (1.5 s, falling), soft and airy, with an organic low swell"""
    def part(d, f0, f1, s):
        t = t_axis(d)
        u = t / d
        env = np.sin(np.pi * np.clip(u, 0, 1)) ** 1.3
        n = sweep_filter(pink(d, s), f0, f1, kind="bp", q=0.9) * env
        low = lp(brown(d, s + 1), 200) * env * 0.4
        return n + low
    y = np.concatenate([part(1.3, 500, 1800, seed), np.zeros(int(0.15 * SR)), part(1.5, 1600, 400, seed + 5)])
    y = widen(y, 12, 0.6)
    ir = make_ir(dur=1.2, damp_hz=4000, seed=91)
    return fade(reverb(y, ir, wet=0.2)[: int(3.5 * SR)], 0.05, 0.4)


def bubbles(dur=2.5, density=14, seed=93):
    """CO2 bubbling: many small rising sine blips scattered in stereo over a soft fizz"""
    out = np.zeros((int((dur + 0.3) * SR), 2))
    r = rng(seed)
    for k in range(int(dur * density)):
        tt = r.uniform(0, dur)
        d = r.uniform(0.04, 0.09)
        t = t_axis(d)
        f0 = r.uniform(400, 1300)
        b = sine(glide(f0, f0 * 2.2, d, 2)) * np.sin(np.pi * t / d) * r.uniform(0.15, 0.35)
        i = int(tt * SR)
        out[i:i + len(b)] += pan(b, r.uniform(-0.7, 0.7))[: len(out) - i]
    t = t_axis(dur + 0.3)
    fz = hp(white(dur + 0.3, seed), 5000) * 0.03 * np.sin(np.pi * np.clip(t / (dur + 0.3), 0, 1))
    out += widen(fz, 9, 0.6)
    ir = make_ir(dur=0.8, damp_hz=6000, seed=95)
    return fade(reverb(out, ir, wet=0.2)[: int((dur + 0.6) * SR)], 0.05, 0.3)


def ion_plink(nm="E6", seed=0):
    """ion 'plink': plucked high tone with a tiny pitch drop (water-drop like)"""
    d = 0.6
    t = t_axis(d)
    f = mtof(note(nm))
    y = (sine(f * (1 + 0.15 * np.exp(-t / 0.01))) + 0.3 * sine(f * 2.01 * np.ones_like(t))) * np.exp(-t / 0.09)
    y = widen(y * np.clip(t / 0.001, 0, 1) * 0.6, 6, 0.3)
    ir = make_ir(dur=0.9, damp_hz=8000, seed=97)
    return fade(reverb(y, ir, wet=0.28)[: int(1.1 * SR)], 0.0005, 0.3)


def marrow_pulse(n=4, period=0.85, seed=99):
    """bone-marrow 'life' pulse: soft, warm, muffled heartbeat-ish swells"""
    d = n * period + 0.6
    out = np.zeros(int(d * SR))
    for k in range(n):
        t = t_axis(0.6)
        y = sine(glide(70, 48, 0.6, 5)) * np.exp(-t / 0.16) * np.clip(t / 0.02, 0, 1)
        y += lp(white(0.6, seed + k), 300) * np.exp(-t / 0.06) * 0.3
        i = int(k * period * SR); out[i:i + len(y)] += y * (0.7 + 0.3 * k / max(1, n - 1))
    y = stereo(lp(out, 900))
    ir = make_ir(dur=0.8, damp_hz=1500, bright_end_hz=500, seed=101)
    return fade(reverb(y, ir, wet=0.25)[: int((d + 0.4) * SR)], 0.005, 0.3)


def enucleate_pop(seed=103):
    """nucleus pushed out: squishy push (rising) then a round 'pop' with a sparkle"""
    sq = squelch(0.45, seed)
    p = soft_pop(380, seed + 1)
    t = t_axis(1.0)
    sp = hp(white(1.0, seed + 2), 6000) * np.exp(-t / 0.15) * 0.06
    y = np.zeros((int(1.4 * SR), 2))
    y[: len(sq)] += sq[: len(y)] * 0.7
    i = int(0.4 * SR)
    y[i:i + len(p)] += p[: len(y) - i] * 1.2
    y[i:i + len(sp)] += widen(sp, 9, 0.6)[: len(y) - i]
    return fade(y, 0.002, 0.2)


def clock_tick(hi=True, seed=0):
    d = 0.2
    t = t_axis(d)
    y = bp(white(d, seed), 2500 if hi else 1800, 7000) * np.exp(-t / 0.004)
    y += sine((2400 if hi else 1900) * np.ones_like(t)) * np.exp(-t / 0.012) * 0.25
    return fade(stereo(y), 0.0003, 0.05)


def page_flip(seed=0):
    """calendar page flip: short paper flutter (band-passed noise bursts) + soft whoosh"""
    d = 0.35
    t = t_axis(d)
    r = rng(seed)
    flutter = (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * r.uniform(28, 40) * t))) * np.sin(np.pi * t / d)
    y = bp(white(d, seed), 1500, 8000) * flutter * 0.5 + bp(pink(d, seed + 1), 300, 1500) * np.sin(np.pi * t / d) * 0.4
    return fade(autopan(y, 0.3, -0.3), 0.002, 0.08)


def bacteria_growl(dur=1.6, seed=105):
    """pathogen growl: low wobbling gurgle through a moving formant + wet noise, menacing but not a voice"""
    t = t_axis(dur)
    u = t / dur
    r = rng(seed)
    f = 55 + 12 * np.sin(2 * np.pi * 3.1 * t) + 6 * lp(r.standard_normal(len(t)), 20) * 20
    src = saw(np.clip(f, 30, 120)) * (0.8 + 0.2 * np.sin(2 * np.pi * 11 * t))
    y = sweep_filter(src, lambda v: 350 + 300 * np.sin(np.pi * v * 3), None, kind="bp", q=3.5) * 1.5
    y += sweep_filter(brown(dur, seed), 300, 600, kind="bp", q=2) * 0.4
    y = sat(y * np.sin(np.pi * np.clip(u / 0.95, 0, 1)) ** 0.6, 2.0)
    y = widen(lp(y, 2200), 10, 0.5)
    ir = make_ir(dur=0.8, damp_hz=2500, seed=107)
    return fade(reverb(y, ir, wet=0.2)[: int((dur + 0.4) * SR)], 0.05, 0.3)


def engulf(seed=109):
    """engulf 'whoomp': big wet swallow - low sweep down, membrane closing squelch, air suck"""
    d = 1.2
    t = t_axis(d)
    suck = sweep_filter(pink(d, seed), 3000, 300, kind="bp", q=1.2) * np.exp(-t / 0.35) * np.clip(t / 0.08, 0, 1)
    low = sine(glide(140, 40, d, 4)) * np.exp(-t / 0.3) * 0.9
    y = stereo(sat(low + suck * 0.8, 1.4))
    sq = squelch(0.6, seed + 1)
    i = int(0.12 * SR)
    y[i:i + len(sq)] += sq[: len(y) - i] * 0.7
    y = widen(y.mean(1), 10, 0.5)
    ir = make_ir(dur=1.0, damp_hz=3000, seed=111)
    return fade(reverb(y, ir, wet=0.2)[: int(1.7 * SR)], 0.002, 0.3)


def fizz(dur=2.0, seed=113):
    """digestion fizz (reactive oxygen): crackling high noise + tiny effervescent pops, fading"""
    t = t_axis(dur)
    r = rng(seed)
    cr = np.zeros(len(t))
    idx = r.integers(0, len(t), int(dur * 900))
    cr[idx] = r.uniform(-1, 1, len(idx))
    cr = bp(cr, 2500, 12000) * 1.4
    hiss = hp(white(dur, seed + 1), 4000) * 0.15
    env = np.clip(t / 0.08, 0, 1) * np.exp(-t / (dur * 0.5))
    y = widen((cr + hiss) * env, 9, 0.7)
    y += bubbles(dur * 0.8, 20, seed + 2)[: len(y)] * 0.4
    return fade(y, 0.01, 0.3)


def stinger(variant=0, seed=115):
    """character pose stinger: whoosh-in + short brass stab chord + glock sparkle; 4 colours"""
    chords = [["E4", "G#4", "B4", "E5"],     # eosinophil (E major, bright)
              ["F4", "A4", "C5", "F5"],      # basophil
              ["G4", "B4", "D5", "G5"],      # monocyte
              ["A4", "C#5", "E5", "A5"]]     # B cell (rising sequence)
    ch = chords[variant % 4]
    from bgm import brass, glock               # same instruments as the score
    d = 1.4
    out = np.zeros((int(d * SR), 2))
    sw = turn_whip(seed + variant)
    out[: len(sw)] += sw[: len(out)] * 0.5
    i = int(0.16 * SR)
    for k, nm in enumerate(ch):
        b = brass(note(nm) - 12, 0.22, 0.9, att=0.008, rel=0.25, seed=seed + k)
        out[i:i + len(b)] += pan(b, (k - 1.5) * 0.2)[: len(out) - i] * 0.6
    for k, nm in enumerate(ch[1:]):
        g = glock(note(nm) + 12, 0.35, seed=k)
        j = i + int(k * 0.05 * SR)
        out[j:j + len(g)] += pan(g, 0.4 - 0.4 * k)[: len(out) - j] * 0.5
    ir = make_ir(dur=1.2, damp_hz=7000, seed=117)
    return fade(reverb(out, ir, wet=0.22)[: int(1.9 * SR)], 0.002, 0.4)


def wound_rip(seed=119):
    """vessel wall tearing: low thump + granular tearing noise (crackle bursts) + wet gush"""
    d = 1.1
    t = t_axis(d)
    r = rng(seed)
    thump = sine(glide(110, 45, d, 8)) * np.exp(-t / 0.12)
    grains = np.zeros(len(t))
    for k in range(70):
        tt = 0.02 + 0.35 * (k / 70) ** 0.8 + r.uniform(0, 0.01)
        g = bp(white(0.02, seed + k), r.uniform(700, 2500), 7000) * np.hanning(int(0.02 * SR))
        i = int(tt * SR); grains[i:i + len(g)] += g * r.uniform(0.3, 1.0)
    gush = sweep_filter(pink(d, seed + 1), 2500, 500, kind="bp", q=1.0) * np.clip((t - 0.3) / 0.1, 0, 1) * np.exp(-np.maximum(t - 0.3, 0) / 0.4) * 0.6
    y = sat(thump * 0.9 + grains * 0.8 + gush, 1.3)
    y = widen(y, 8, 0.5)
    ir = make_ir(dur=0.8, damp_hz=4000, seed=121)
    return fade(reverb(y, ir, wet=0.15)[: int(1.5 * SR)], 0.001, 0.3)


def platelet_clicks(n=10, span=1.2, seed=123):
    """platelets sticking: a cluster of small sticky clicks, slightly pitched, accelerating"""
    out = np.zeros((int((span + 0.5) * SR), 2))
    r = rng(seed)
    for k in range(n):
        tt = span * (k / n) ** 0.7
        d = 0.08
        t = t_axis(d)
        f = r.uniform(1400, 2600)
        c = (sine(f * np.ones_like(t)) * np.exp(-t / 0.008) * 0.5 + bp(white(d, seed + k), 2000, 8000) * np.exp(-t / 0.003))
        c += lp(white(d, seed + 50 + k), 900) * np.exp(-t / 0.015) * 0.3          # sticky 'tck'
        i = int(tt * SR)
        out[i:i + len(c)] += pan(c, r.uniform(-0.6, 0.6))[: len(out) - i] * r.uniform(0.5, 1.0)
    ir = make_ir(dur=0.6, damp_hz=7000, seed=125)
    return fade(reverb(out, ir, wet=0.18)[: int((span + 0.8) * SR)], 0.0005, 0.2)


def mesh_tighten(dur=2.0, seed=127):
    """fibrin mesh weaving and tightening: fibrous creaks + rising tension tone + final cinch"""
    t = t_axis(dur)
    u = t / dur
    r = rng(seed)
    tone = sum(sine(mtof(note(n)) * (1 + 0.25 * u ** 2)) for n in ("D4", "A4")) * u ** 1.5 * 0.12
    creak = np.zeros(len(t))
    for k in range(14):
        tt = r.uniform(0.0, dur - 0.25)
        d = r.uniform(0.08, 0.2)
        tc = t_axis(d)
        c = lp(saw(r.uniform(150, 400) * (1 + 0.4 * tc / d)), 2000) * np.sin(np.pi * tc / d) ** 2 * r.uniform(0.1, 0.25)
        i = int(tt * SR); creak[i:i + len(c)] += c[: len(t) - i]
    y = tone + creak
    tc = t_axis(0.3)
    cinch = (bp(white(0.3, seed), 800, 5000) * np.exp(-tc / 0.02) * 0.5 + sine(glide(300, 160, 0.3, 10)) * np.exp(-tc / 0.06) * 0.5)
    y = np.concatenate([y, cinch])
    y = widen(y, 9, 0.5)
    ir = make_ir(dur=0.9, damp_hz=6000, seed=129)
    return fade(reverb(y, ir, wet=0.2)[: int((dur + 0.8) * SR)], 0.02, 0.3)


def ecg_blip(seed=131):
    """monitor beep (two short pure blips like an ECG monitor, then a soft trailing echo)"""
    d = 0.9
    out = np.zeros(int(d * SR))
    for tt, a in [(0.0, 1.0)]:
        t = t_axis(0.13)
        b = sine(1000 * np.ones_like(t)) * np.clip(t / 0.004, 0, 1) * np.clip((0.13 - t) / 0.01, 0, 1) * a
        i = int(tt * SR); out[i:i + len(b)] += b
    y = widen(out * 0.5, 13, 0.3)
    ir = make_ir(dur=1.0, damp_hz=8000, seed=133)
    return fade(reverb(y, ir, wet=0.3)[: int(1.5 * SR)], 0.001, 0.3)


def step_walk(seed=0):
    """soft walking step (epilogue)"""
    return step_light(seed + 40) * 0.6


EPISODE01_ITEMS = {
    "ep_holo_on.wav": lambda: holo(True),
    "ep_holo_off.wav": lambda: holo(False, 62),
    "ep_centrifuge.wav": lambda: centrifuge(0.5, 1.0, 1.0),
    "ep_ding_1.wav": lambda: ding("E6", 1),
    "ep_ding_2.wav": lambda: ding("A6", 2),
    "ep_ding_3.wav": lambda: ding("C#7", 3),
    "ep_squelch.wav": lambda: squelch(0.9),
    "ep_squelch_long.wav": lambda: squelch(1.6, 74),
    **{f"ep_pop_{k}.wav": (lambda k=k: soft_pop([440, 554, 659, 880][k], k)) for k in range(4)},
    "ep_rotate.wav": rotate_whoosh,
    "ep_stretch.wav": stretch_spring,
    **{f"ep_o2_click_{k}.wav": (lambda k=k: o2_click(["A6", "C#7", "E7", "A7"][k], k)) for k in range(4)},
    "ep_breath.wav": breath,
    "ep_bubbles.wav": lambda: bubbles(2.5),
    **{f"ep_plink_{k}.wav": (lambda k=k: ion_plink(["E6", "G#6", "B6", "E7"][k], k)) for k in range(4)},
    "ep_marrow_pulse.wav": lambda: marrow_pulse(5, 0.85),
    "ep_enucleate.wav": enucleate_pop,
    "ep_tick_hi.wav": lambda: clock_tick(True, 1),
    "ep_tick_lo.wav": lambda: clock_tick(False, 2),
    **{f"ep_page_{k}.wav": (lambda k=k: page_flip(k)) for k in range(3)},
    "ep_growl.wav": lambda: bacteria_growl(1.6),
    "ep_growl_long.wav": lambda: bacteria_growl(2.6, 106),
    "ep_squish.wav": lambda: squelch(0.5, 141),
    "ep_engulf.wav": engulf,
    "ep_fizz.wav": lambda: fizz(2.0),
    **{f"ep_stinger_{k}.wav": (lambda k=k: stinger(k)) for k in range(4)},
    "ep_wound_rip.wav": wound_rip,
    "ep_platelet_clicks.wav": lambda: platelet_clicks(10, 1.2),
    "ep_mesh_tighten.wav": lambda: mesh_tighten(2.0),
    "ep_ecg_blip.wav": ecg_blip,
    **{f"ep_step_walk_{k}.wav": (lambda k=k: step_walk(k)) for k in range(4)},
}


def build_episode01():
    os.makedirs(SE_DIR, exist_ok=True)
    for name, fn in EPISODE01_ITEMS.items():
        y = normalize_peak(stereo(fn()), -1.0)
        write_wav(os.path.join(SE_DIR, name), y)
        print(f"  se/{name:24s} {len(y) / SR:5.2f}s", flush=True)


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode01", action="store_true", help="build only the episode-1 effects (se/ep_*.wav)")
    if ap.parse_args().episode01:
        build_episode01()
    else:
        build()

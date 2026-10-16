#!/usr/bin/env python3
"""
BLOOD STORY intro mix.

    python3 tools/voices.py && python3 tools/sfx.py && python3 tools/bgm.py && python3 tools/mix.py

Reads  the voice takes via audio_lib.voice_meta() (audio/voice_sbv2/ = Style-Bert-VITS2, default;
       BS_VOICE_ENGINE=edge -> audio/voice/ edge-tts), audio/se/*.wav, audio/bgm/intro_bgm.wav and tools/intro_timeline.py.
Writes audio/mix_intro.wav     30.000 s, 48 kHz stereo, 24-bit, ~-16 LUFS integrated, <= -1 dBTP
       audio/stems/voice.wav, bgm.wav, sfx.wav   (float32, same gain as in the mix, pre-limiter:
                                                 voice + bgm + sfx ~= mix before the master limiter)
       audio/cues.json         line times + 30 fps mouth values, sfx times, footsteps, bgm sections
       audio/mix_report.json   measured loudness / peaks / checks
"""
from __future__ import annotations

import json, os, sys
import numpy as np
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import SR, AUDIO, read_wav, write_wav, pan, stereo, compress, limiter, true_peak, eq, voice_meta, VOICE_ENGINE  # noqa: E402
import intro_timeline as TL  # noqa: E402

TARGET_LUFS = -16.0
CEILING_DBTP = -1.0
VOICE_LINE_LUFS = -18.0      # every line is matched to this loudness before character trims
BGM_LUFS = -21.0             # music bed (before ducking)
DUCK_DB = 7.0                # music dip under dialogue
SFX_BED_DUCK_DB = 4.0        # beds (flow, siren, squeeze) dip a little under dialogue
SFX_BUS_DB = 0.0
BED_SFX = {"flow_bed", "siren", "squeeze"}


def lufs(x):
    import pyloudnorm as pyln
    meter = pyln.Meter(SR, block_size=0.4 if len(x) / SR >= 0.4 else len(x) / SR * 0.99)
    return meter.integrated_loudness(stereo(x))


def snap(t, fps=TL.FPS):
    return round(t * fps) / fps


def activity_env(v, att=0.05, rel=0.40, look=0.06, thr_db=-42):
    """0..1 dialogue activity (for side-chain ducking), with look-ahead"""
    m = np.max(np.abs(stereo(v)), 1)
    h = SR // 200                                         # 5 ms blocks
    n = len(m) // h + 1
    pad = np.zeros(n * h); pad[: len(m)] = m
    lvl = np.sqrt(np.mean(pad.reshape(n, h) ** 2, 1))
    ref = np.max(lvl) + 1e-12
    a = (20 * np.log10(lvl / ref + 1e-9) > thr_db).astype(float)
    # look-ahead: shift earlier
    k = int(look * 200)
    a = np.concatenate([a[k:], np.zeros(k)])
    ca, cr = np.exp(-1 / (att * 200)), np.exp(-1 / (rel * 200))
    e, out = 0.0, np.zeros_like(a)
    for i, x in enumerate(a):
        c = ca if x > e else cr
        e = c * e + (1 - c) * x
        out[i] = e
    return np.interp(np.arange(len(m)), np.arange(n) * h, out)


def main():
    N = int(round(TL.DURATION * SR))
    meta = voice_meta()

    # ------------------------------------------------------------------ voices
    voice = np.zeros((N, 2))
    lines_out, prev_end, problems = [], -1.0, []
    for lid, t in TL.LINES:
        m = meta[lid]
        t = snap(t)
        x = read_wav(os.path.join(AUDIO, m["file"]))
        g = 10 ** ((VOICE_LINE_LUFS - lufs(x) + TL.VOICE_GAIN_DB[m["who"]]) / 20)
        y = pan(x * g, TL.VOICE_PAN[m["who"]])
        i = int(round(t * SR)); n = min(len(y), N - i)
        voice[i:i + n] += y[:n]
        start, end = t + m["speech_on"], t + m["speech_off"]
        if start < prev_end + 0.05:
            problems.append(f"voice overlap / too close: {lid} starts {start:.3f} < previous end {prev_end:.3f}")
        prev_end = end
        nfr = int(np.ceil((m["speech_off"]) * TL.FPS)) + 1
        mouth = (m["mouth"] + [0.0] * nfr)[:nfr]
        mouth[-1] = 0.0
        lines_out.append(dict(id=lid, who=m["who"], text=m["text"], start=round(t, 3), end=round(end, 3),
                              speech_start=round(start, 3), start_frame=int(round(t * TL.FPS)),
                              file=m["file"], mouth=mouth))
    if lines_out[-1]["end"] > 29.8 + 1e-6:
        problems.append(f"last line ends {lines_out[-1]['end']:.3f} > 29.8")

    # ------------------------------------------------------------------ sfx
    sfx_bed = np.zeros((N, 2)); sfx_fx = np.zeros((N, 2))
    sfx_out = []
    for name, t, f, gdb, p in TL.SFX:
        x = read_wav(os.path.join(AUDIO, "se", f))
        x = stereo(x)
        if p:
            x = pan(x, p)
        i = int(round(t * SR)); n = min(len(x), N - i)
        if n <= 0:
            continue
        (sfx_bed if name in BED_SFX else sfx_fx)[i:i + n] += x[:n] * 10 ** (gdb / 20)
        sfx_out.append(dict(name=name, start=round(t, 3), file=f"se/{f}"))

    # ------------------------------------------------------------------ bgm
    bgm = read_wav(os.path.join(AUDIO, "bgm", "intro_bgm.wav"))[:N]
    bgm = bgm * 10 ** ((BGM_LUFS - lufs(bgm)) / 20)

    # side-chain ducking from the dialogue
    act = activity_env(voice)
    duck = 10 ** (-DUCK_DB * act / 20)
    bgm_d = bgm * duck[:, None]
    bed_d = sfx_bed * (10 ** (-SFX_BED_DUCK_DB * act / 20))[:, None]
    sfx = (bed_d + sfx_fx) * 10 ** (SFX_BUS_DB / 20)

    # ------------------------------------------------------------------ master
    pre = voice + bgm_d + sfx
    pre = compress(pre, thresh_db=-14, ratio=1.6, att=0.015, rel=0.2)          # gentle glue
    # loudness to target, then true-peak limiter; iterate a little because the limiter costs loudness
    gain_db = TARGET_LUFS - lufs(pre)
    for _ in range(4):
        mix = limiter(pre * 10 ** (gain_db / 20), ceiling_db=CEILING_DBTP - 0.1)
        err = TARGET_LUFS - lufs(mix)
        if abs(err) < 0.1:
            break
        gain_db += err
    # last 0.3 s: short fade (the music rings on - no hard stop, no click)
    k = int(0.3 * SR)
    mix[-k:] *= np.cos(np.linspace(0, np.pi / 2, k))[:, None] ** 2
    mix = mix[:N]
    write_wav(os.path.join(AUDIO, "mix_intro.wav"), mix, subtype="PCM_24")

    G = 10 ** (gain_db / 20)
    sd = os.path.join(AUDIO, "stems")
    os.makedirs(sd, exist_ok=True)
    for name, s in [("voice", voice), ("bgm", bgm_d), ("sfx", sfx)]:
        write_wav(os.path.join(sd, f"{name}.wav"), s * G, subtype="FLOAT")
    write_wav(os.path.join(sd, "bgm_unducked.wav"), bgm * G, subtype="FLOAT")

    # ------------------------------------------------------------------ cues
    cues = dict(
        duration=TL.DURATION, fps=TL.FPS, voice_engine=VOICE_ENGINE,
        note="line start = time the voice file starts (on the frame grid); mouth[k] = frame start_frame + k "
             "(0..1, 30 fps) until end. speech_start = first audible sound.",
        lines=lines_out,
        sfx=sfx_out,
        steps=dict(akane=TL.STEPS["akane"], shirou=TL.STEPS["shirou"],
                   akane_runPhase="runPhase = ((t - 8.6) / 0.4) % 1  (contact at 0 and 0.5; valid 8.6-12.0)",
                   shirou_runPhase="runPhase = ((t - 25.6) / 0.36) % 1  (contact at 0 and 0.5; valid 25.6-29.6)"),
        bgm_sections=[dict(s, bpm=TL.BPM) for s in TL.BGM_SECTIONS],
        files=dict(mix="mix_intro.wav", stems=["stems/voice.wav", "stems/bgm.wav", "stems/sfx.wav"],
                   bgm="bgm/intro_bgm.wav"),
    )
    with open(os.path.join(AUDIO, "cues.json"), "w", encoding="utf-8") as f:
        json.dump(cues, f, ensure_ascii=False, indent=1)

    # ------------------------------------------------------------------ report
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    rep = dict(duration_s=len(mix) / SR, integrated_lufs=round(meter.integrated_loudness(mix), 2),
               true_peak_dbtp=round(20 * np.log10(true_peak(mix)), 2),
               sample_peak_dbfs=round(20 * np.log10(np.max(np.abs(mix))), 2),
               clipped_samples=int(np.sum(np.abs(mix) >= 0.9999)),
               master_gain_db=round(gain_db, 2), voice_engine=VOICE_ENGINE,
               lines=[(l["id"], l["start"], l["end"]) for l in lines_out], problems=problems)
    # short-term loudness of the stems at the dialogue (voice vs ducked music)
    rep["voice_lufs"] = round(meter.integrated_loudness(voice * G), 2)
    rep["bgm_lufs_ducked"] = round(meter.integrated_loudness(bgm_d * G), 2)
    rep["sfx_lufs"] = round(meter.integrated_loudness(sfx * G), 2)
    with open(os.path.join(AUDIO, "mix_report.json"), "w", encoding="utf-8") as f:
        json.dump(rep, f, ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

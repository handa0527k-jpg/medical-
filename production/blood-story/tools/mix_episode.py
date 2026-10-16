#!/usr/bin/env python3
"""
BLOOD STORY episode 1 mix.

    python3 tools/voices.py --only-prefix E01-      # episode lines (intro lines already exist)
    python3 tools/sfx.py --episode01                # se/ep_*.wav (intro effects reused)
    python3 tools/bgm.py --cue episode01            # bgm/episode01/<cue>.wav
    python3 tools/mix_episode.py

Timeline: tools/episode01_timeline.py.  Does not touch the intro deliverables (mix_intro.wav, cues.json, stems/).
Writes audio/mix_episode01.wav           48 kHz stereo 24-bit, ~-16 LUFS integrated, <= -1 dBTP
       audio/stems_episode01/{voice,bgm,bgm_unducked,sfx}.wav  (float, post-gain, pre-limiter)
       audio/bgm/episode01_bgm.wav       assembled score (crossfaded cues, unducked, normalised)
       audio/cues_episode01.json         lines (+30 fps mouth), scenes + beats, sfx, steps, bgm_sections
       audio/mix_report_episode01.json   loudness / peak / overlap checks
"""
from __future__ import annotations

import json, os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import SR, AUDIO, read_wav, write_wav, pan, stereo, compress, limiter, true_peak  # noqa: E402
from mix import lufs, activity_env, TARGET_LUFS, CEILING_DBTP, VOICE_LINE_LUFS, DUCK_DB, SFX_BED_DUCK_DB  # noqa: E402
import episode01_timeline as TL  # noqa: E402

RING = {"avant": 0.6, "battle": 1.6}      # outgoing cues that ring past the boundary instead of a centred crossfade
FINAL_FADE = 1.0


def at(t):
    """sample index; times on the 30 fps grid (stored rounded to 4 decimals) are placed exactly on the frame"""
    f = t * TL.FPS
    if abs(f - round(f)) < 0.01:
        return int(round(f)) * (SR // TL.FPS)
    return int(round(t * SR))


def activity_env_ref(v, ref_span=27.0, **kw):
    """as mix.activity_env, but the -42 dB gate is relative to the loudest dialogue in 0-27 s (same as the intro),
    so the ducking of the avant is identical to mix_intro.wav"""
    import mix as M
    m = np.max(np.abs(stereo(v)), 1)
    h = SR // 200
    k = int(ref_span * SR) // h
    lvl = np.sqrt(np.mean(m[: k * h].reshape(k, h) ** 2, 1))
    peak = np.max(lvl)
    # scale so that the reference peak equals the episode-wide peak used inside activity_env
    n = len(m) // h
    full = np.sqrt(np.mean(m[: n * h].reshape(n, h) ** 2, 1))
    pad_n = len(m) // h + 1
    pad = np.zeros(pad_n * h); pad[: len(m)] = m
    gmax = np.max(np.sqrt(np.mean(pad.reshape(pad_n, h) ** 2, 1)))
    thr = kw.pop("thr_db", -42) + 20 * np.log10(peak / gmax)
    return M.activity_env(v, thr_db=thr, **kw)


def build_bgm(N):
    out = np.zeros((N, 2))
    secs = TL.BGM_SECTIONS
    for i, s in enumerate(secs):
        y = read_wav(os.path.join(AUDIO, "bgm", "episode01", f"{s['cue']}.wav"))
        o = json.load(open(os.path.join(AUDIO, "bgm", "episode01", f"{s['cue']}.wav.json")))["origin"]
        t = o + np.arange(len(y)) / SR
        # loudness normalisation on the cue's own span (avant: 0-30 like the intro mix)
        a, b = (0.0, 30.0) if s["cue"] == "avant" else (s["start"], s["end"])
        seg = y[(t >= a) & (t < b)]
        y = y * 10 ** ((s["lufs"] - lufs(seg)) / 20)
        g = np.ones(len(y))
        if i > 0 and s["xfade"] > 0:
            x = s["xfade"]
            g *= np.clip((t - (s["start"] - x / 2)) / x, 0, 1) ** 0.5
        if i + 1 < len(secs):
            nxt = secs[i + 1]
            if s["cue"] in RING:
                f0, f1 = s["end"] - 0.05, s["end"] + RING[s["cue"]]
            else:
                f0, f1 = s["end"] - nxt["xfade"] / 2, s["end"] + nxt["xfade"] / 2
            g *= np.cos(np.clip((t - f0) / max(f1 - f0, 1e-3), 0, 1) * np.pi / 2)
        y = y * g[:, None]
        i0 = int(round(o * SR)); n = min(len(y), N - i0)
        out[i0:i0 + n] += y[:n]
    return out


def main():
    N = int(round(TL.DURATION * SR))
    meta = json.load(open(os.path.join(AUDIO, "voice", "voices.json"), encoding="utf-8"))
    problems = []

    # ------------------------------------------------------------------ voices
    voice = np.zeros((N, 2))
    lines_out, prev_end = [], -1.0
    for lid, t in TL.LINES:
        m = meta[lid]
        x = read_wav(os.path.join(AUDIO, m["file"]))
        g = 10 ** ((VOICE_LINE_LUFS - lufs(x) + TL.VOICE_GAIN_DB[m["who"]]) / 20)
        y = pan(x * g, TL.VOICE_PAN[m["who"]])
        i = at(t); n = min(len(y), N - i)
        voice[i:i + n] += y[:n]
        start, end = t + m["speech_on"], t + m["speech_off"]
        min_gap = 0.25 if lid.startswith("E01-") else 0.05          # intro spacing is the intro mix's (unchanged)
        if start < prev_end + min_gap:
            problems.append(f"voice overlap / too close: {lid} speech {start:.3f} < previous end {prev_end:.3f} + {min_gap}")
        gap = start - prev_end if prev_end > 0 else None
        prev_end = end
        nfr = int(np.ceil(m["speech_off"] * TL.FPS)) + 1
        mouth = (m["mouth"] + [0.0] * nfr)[:nfr]
        mouth[-1] = 0.0
        lines_out.append(dict(id=TL.LINE_ID.get(lid, lid), who=m["who"], text=m["text"], start=round(t, 3), end=round(end, 3),
                              speech_start=round(start, 3), start_frame=int(round(t * TL.FPS)),
                              gap_before=None if gap is None else round(gap, 3), file=m["file"], mouth=mouth))
    if lines_out[-1]["end"] > TL.SCENES[-1]["start"] + 1e-6:
        problems.append("last line runs into the 'next' scene")

    # ------------------------------------------------------------------ sfx
    sfx_bed = np.zeros((N, 2)); sfx_fx = np.zeros((N, 2))
    sfx_out = []
    for name, t, f, gdb, p in TL.SFX:
        x = stereo(read_wav(os.path.join(AUDIO, "se", f)))
        if p:
            x = pan(x, p)
        i = at(t); n = min(len(x), N - i)
        if n <= 0:
            problems.append(f"sfx {name} at {t} outside the episode"); continue
        (sfx_bed if name in TL.BED_SFX else sfx_fx)[i:i + n] += x[:n] * 10 ** (gdb / 20)
        sfx_out.append(dict(name=name, start=round(t, 3), frame=int(round(t * TL.FPS)), end=round(t + len(x) / SR, 3),
                            file=f"se/{f}", gain_db=gdb))

    # ------------------------------------------------------------------ bgm
    bgm = build_bgm(N)
    write_wav(os.path.join(AUDIO, "bgm", "episode01_bgm.wav"), bgm / max(1e-9, np.max(np.abs(bgm))) * 0.89)
    act = activity_env_ref(voice)
    bgm_d = bgm * (10 ** (-DUCK_DB * act / 20))[:, None]
    bed_d = sfx_bed * (10 ** (-SFX_BED_DUCK_DB * act / 20))[:, None]
    sfx = bed_d + sfx_fx

    # ------------------------------------------------------------------ master
    pre = voice + bgm_d + sfx
    pre = compress(pre, thresh_db=-14, ratio=1.6, att=0.015, rel=0.2)
    gain_db = TARGET_LUFS - lufs(pre)
    for _ in range(5):
        mix = limiter(pre * 10 ** (gain_db / 20), ceiling_db=CEILING_DBTP - 0.1)
        err = TARGET_LUFS - lufs(mix)
        if abs(err) < 0.08:
            break
        gain_db += err
    k = int(FINAL_FADE * SR)
    mix[-k:] *= np.cos(np.linspace(0, np.pi / 2, k))[:, None] ** 2
    mix = mix[:N]
    write_wav(os.path.join(AUDIO, "mix_episode01.wav"), mix, subtype="PCM_24")

    G = 10 ** (gain_db / 20)
    sd = os.path.join(AUDIO, "stems_episode01")
    os.makedirs(sd, exist_ok=True)
    for name, s in [("voice", voice), ("bgm", bgm_d), ("sfx", sfx), ("bgm_unducked", bgm)]:
        write_wav(os.path.join(sd, f"{name}.wav"), s * G, subtype="FLOAT")

    # ------------------------------------------------------------------ cues
    scenes = [dict(id=s["id"], start=s["start"], end=s["end"], start_frame=int(round(s["start"] * TL.FPS)),
                   end_frame=int(round(s["end"] * TL.FPS)), desc=s["desc"],
                   lines=[l["id"] for l in lines_out if s["start"] <= l["start"] < s["end"]],
                   beats=dict(sorted(s["beats"].items(), key=lambda kv: kv[1]))) for s in TL.SCENES]
    for s in scenes:
        for k_, v in s["beats"].items():
            if not (s["start"] - 1e-6 <= v <= s["end"] + 1e-6):
                problems.append(f"beat {s['id']}.{k_}={v} outside scene {s['start']}-{s['end']}")
    cues = dict(
        duration=TL.DURATION, fps=TL.FPS, frames=int(round(TL.DURATION * TL.FPS)),
        note="times in seconds on the 30 fps grid. line start = voice file start; speech_start = first audible sound; "
             "end = speech end; mouth[k] belongs to frame start_frame + k (0..1). beats = visual action times "
             "(absolute seconds). 0-30 s = intro (mix_intro.wav) except N2 = full sentence; the 29.5 hit is a transition.",
        lines=lines_out, scenes=scenes, sfx=sfx_out,
        steps=dict(**{k_: v for k_, v in TL.STEPS.items()},
                   akane_runPhase="runPhase = ((t - 8.6) / 0.4) % 1  (8.6-12.0)",
                   shirou_runPhase="runPhase = ((t - 25.6) / 0.36) % 1  (25.6-29.6)",
                   squad_runPhase=f"runPhase = ((t - {TL.STEPS['squad'][0]}) / 0.36) % 1  "
                                  f"({TL.STEPS['squad'][0]}-{TL.STEPS['squad'][-1]}; contact at 0 and 0.5)",
                   epilogue_walk_phase=f"walkPhase = ((t - {TL.STEPS['epilogue_walk'][0]}) / 1.0) % 1  "
                                       f"({TL.STEPS['epilogue_walk'][0]}-{TL.STEPS['epilogue_walk'][-1]})"),
        bgm_sections=[dict(name=s["name"], cue=s["cue"], start=s["start"], end=s["end"], crossfade_in=s["xfade"],
                           desc=s["desc"]) for s in TL.BGM_SECTIONS],
        files=dict(mix="mix_episode01.wav", stems=[f"stems_episode01/{n}.wav" for n in ("voice", "bgm", "sfx")],
                   bgm="bgm/episode01_bgm.wav"),
    )
    with open(os.path.join(AUDIO, "cues_episode01.json"), "w", encoding="utf-8") as f:
        json.dump(cues, f, ensure_ascii=False, indent=1)

    # ------------------------------------------------------------------ report
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    rep = dict(duration_s=round(len(mix) / SR, 4), integrated_lufs=round(meter.integrated_loudness(mix), 2),
               true_peak_dbtp=round(20 * np.log10(true_peak(mix)), 2),
               sample_peak_dbfs=round(20 * np.log10(np.max(np.abs(mix))), 2),
               clipped_samples=int(np.sum(np.abs(mix) >= 0.9999)), master_gain_db=round(gain_db, 2),
               voice_lufs=round(meter.integrated_loudness(voice * G), 2),
               bgm_lufs_ducked=round(meter.integrated_loudness(bgm_d * G), 2),
               sfx_lufs=round(meter.integrated_loudness(sfx * G), 2),
               min_gap_episode=min(l["gap_before"] for l in lines_out if l["gap_before"] is not None and l["id"].startswith("E01-")),
               scenes=[(s["id"], s["start"], s["end"]) for s in scenes], problems=problems)
    # per-scene loudness (short sections, for balance checks)
    rep["scene_lufs"] = {}
    for s in scenes:
        a, b = int(s["start"] * SR), int(s["end"] * SR)
        rep["scene_lufs"][s["id"]] = round(meter.integrated_loudness(mix[a:b]), 1)
    with open(os.path.join(AUDIO, "mix_report_episode01.json"), "w", encoding="utf-8") as f:
        json.dump(rep, f, ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""30秒の試作動画を作る（本編と同じ音声・描画・字幕・ミックスの部品を使う）。

  python scripts/make_prototype.py [--scale 1.0]

出力  video/previews/prototype_30s.mp4（字幕焼き込み）, subtitles/prototype_30s.srt
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_timeline import FPS, SR, envelope  # noqa: E402
from gqlib.paths import ASSETS, AUDIO, CONFIG, FONTS, SCRIPT, SUBS, VIDEO  # noqa: E402
from gqlib.render import render_scene  # noqa: E402
from make_subtitles import split_cues, ts_ass, ts_srt, wrap, ass_color  # noqa: E402
from mix_audio import db2g, load_mp3, smooth_env  # noqa: E402

PLAN = [  # (cue, line_id, 開始時刻の目安)
    ("l1", "SC0101-01", 0.8),
    ("l2", "SC0101-03", 5.0),
    ("l3", "SC0103-02", 10.0),
    ("l4", "SC0104-02", 15.0),
    ("l5", "SC0203-03", 19.3),
    ("l6", "SC0102-01", 27.0),
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    args = ap.parse_args()
    lines = {ln["line_id"]: ln for ln in json.loads((SCRIPT / "dialogue.json").read_text(encoding="utf-8"))["lines"]}
    voices = yaml.safe_load((CONFIG / "voice_config.yaml").read_text(encoding="utf-8"))["characters"]
    t = 0.0
    tl_lines, cues = [], {}
    audio_parts = []
    for cue, lid, at in PLAN:
        a, sr = sf.read(AUDIO / "processed" / f"{lid}.wav", dtype="float32")
        start = max(at, t + 0.45)
        audio_parts.append((start, a))
        ln = lines[lid]
        tl_lines.append({"line_id": lid, "character_id": ln["character_id"], "text": ln["text"], "emotion": ln["emotion"],
                         "cue": cue, "note": "", "rel_start": round(start, 3), "rel_end": round(start + len(a) / SR, 3),
                         "start": round(start, 3), "end": round(start + len(a) / SR, 3), "env": envelope(a, SR)})
        cues[cue] = round(start, 3)
        t = start + len(a) / SR
    dur = t + 2.2
    frames = int(np.ceil(dur * FPS))
    dur = frames / FPS
    sd = {"scene_id": "PROTO", "title": "30秒試作", "chapter": 1, "chapter_title": "細胞の中の冒険", "visual": "prototype",
          "bgm": "mystery", "pages": [3, 5], "sfx": [], "start": 0.0, "end": dur, "duration": dur, "frames": frames,
          "lines": tl_lines, "cues": cues}
    # セリフ
    dia = np.zeros(int(round(dur * SR)), np.float32)
    for st, a in audio_parts:
        i = int(st * SR)
        dia[i:i + len(a)] += a[: len(dia) - i]
    (AUDIO / "dialogue" / "scenes").mkdir(parents=True, exist_ok=True)
    sf.write(AUDIO / "dialogue" / "scenes" / "PROTO.wav", dia, SR, subtype="PCM_16")
    # 映像
    t0 = time.time()
    vid = render_scene("PROTO", scale=args.scale, workers=4, tl={"scenes": [sd]}, out_dir=VIDEO / "previews" / "proto_parts",
                       force=True, mux_audio=False)
    render_s = time.time() - t0
    # ミックス（BGM：mystery → wonder、効果音）
    cfg = yaml.safe_load((CONFIG / "project_config.yaml").read_text(encoding="utf-8"))
    N = len(dia)
    bgm = np.zeros((N, 2), np.float32)
    for key, s, e in (("mystery", 0, cues["l3"] - 0.3), ("wonder", cues["l3"] - 1.0, dur)):
        tr = load_mp3(ASSETS / "music" / "src" / cfg["bgm"][key]["file"])
        i0, i1 = int(s * SR), min(N, int(e * SR))
        seg = tr[: i1 - i0]
        ramp = np.ones(len(seg), np.float32)
        nf = min(len(seg) // 2, SR)
        ramp[:nf] = np.linspace(0, 1, nf)
        ramp[-nf:] = np.linspace(1, 0, nf)
        bgm[i0:i0 + len(seg)] += seg * ramp[:, None] * db2g(cfg["bgm"][key]["gain_db"])
    meter = pyln.Meter(SR)
    bgm *= db2g(-20 + cfg["audio"]["bgm_gain_db"] - meter.integrated_loudness(bgm))
    env = smooth_env(dia, 0.12, 0.6, 480)
    bgm *= (db2g(cfg["audio"]["bgm_duck_db"]) ** np.clip(env / db2g(-34), 0, 1))[:, None]
    sfx = np.zeros(N, np.float32)
    for name, at in (("shimmer", 0.2), ("whoosh", cues["l3"] - 0.8), ("sparkle", cues["l4"] - 0.5), ("rumble", cues["l5"] - 0.4),
                     ("impact", cues["l6"] - 0.3)):
        x, _ = sf.read(ASSETS / "sound_effects" / f"{name}.wav", dtype="float32")
        i = int(at * SR)
        sfx[i:i + len(x)] += x[: N - i] * db2g(cfg["audio"]["sfx_gain_db"])
    mix = bgm + dia[:, None] + sfx[:, None]
    mix *= db2g(cfg["audio"]["target_lufs"] - meter.integrated_loudness(mix))
    mix = np.clip(mix, -0.89, 0.89)
    wav = VIDEO / "previews" / "proto_parts" / "mix.wav"
    sf.write(wav, mix, SR, subtype="PCM_16")
    # 字幕
    srt, ev = [], []
    n = 0
    for ln in tl_lines:
        for ch in split_cues(ln["text"]):
            n += 1
            name = voices[ln["character_id"]]["name"].split("（")[0]
            who = "" if ln["character_id"] == "narr" else name + "："
            srt.append(f"{n}\n{ts_srt(ln['start'])} --> {ts_srt(ln['end'])}\n{who}{wrap(ch)}\n")
            body = wrap(ch).replace("\n", "\\N")
            col = voices[ln["character_id"]].get("color", "#FFFFFF")
            txt = body if ln["character_id"] == "narr" else "{\\fs34\\c" + ass_color(col) + "}" + name + "　{\\fs52\\c&H00FFFFFF&}" + body
            rows = wrap(ch).split("\n")
            w = min(1500, max(len(r) for r in rows) * 53 + (0 if ln["character_id"] == "narr" else (len(name) + 1) * 34) + 90)
            h = 66 * len(rows) + 34
            y0 = 1052 - h
            ev.append(f"Dialogue: -1,{ts_ass(ln['start'])},{ts_ass(ln['end'])},Default,,0,0,0,,{{\\an7\\pos(0,0)\\bord0\\shad0\\1c&H0A0618&\\1a&H48&\\p1}}"
                      f"m {960 - w / 2:.0f} {y0} l {960 + w / 2:.0f} {y0} l {960 + w / 2:.0f} 1052 l {960 - w / 2:.0f} 1052{{\\p0}}")
            ev.append(f"Dialogue: 0,{ts_ass(ln['start'])},{ts_ass(ln['end'])},Default,,0,0,0,,{txt}")
    SUBS.mkdir(exist_ok=True)
    (SUBS / "prototype_30s.srt").write_text("\n".join(srt), encoding="utf-8")
    head = (SUBS / "gene_quest.ass").read_text(encoding="utf-8").split("[Events]")[0] if (SUBS / "gene_quest.ass").exists() else None
    if head is None:
        raise SystemExit("先に scripts/make_subtitles.py を実行してください（ASS の書式を共有するため）")
    ass = VIDEO / "previews" / "proto_parts" / "proto.ass"
    ass.write_text(head + "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n" + "\n".join(ev) + "\n",
                   encoding="utf-8")
    out = VIDEO / "previews" / "prototype_30s.mp4"
    vf = f"subtitles={ass}:fontsdir={FONTS}"
    if args.scale != 1.0:
        vf = f"scale=1920:1080:flags=lanczos,{vf}"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(vid), "-i", str(wav), "-vf", vf, "-c:v", "libx264", "-preset", "medium",
                    "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest",
                    str(out)], check=True)
    print(f"試作 {dur:.1f} 秒 → {out}（描画 {render_s:.0f} 秒）")
    print(json.dumps(cues))


if __name__ == "__main__":
    main()

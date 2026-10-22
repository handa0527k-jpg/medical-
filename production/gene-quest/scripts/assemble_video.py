#!/usr/bin/env python3
"""シーンの映像・ミックス音声・字幕を統合して完成版を書き出し、検証する。

  python scripts/assemble_video.py                 # 完成版（字幕焼き込み＋字幕トラック）
  python scripts/assemble_video.py --no-burn       # 字幕を焼き込まない版
  python scripts/assemble_video.py --check-only    # 既存の完成版を検証するだけ

入力  video/scenes/<scene_id>.mp4（timeline の順）, audio/final/gene_quest_mix.wav, subtitles/gene_quest.ass / .srt
出力  video/final/gene_quest_full.mp4, video/final/verification.json
ffmpeg への引数はリストで渡すので、パスに空白・日本語が含まれていても動く（Windows でも同じ）。
字幕フィルタの中のパスだけはフィルタ構文のエスケープが必要なので、作業フォルダからの相対パスにして渡す。
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import AUDIO, CONFIG, FONTS, ROOT, SCRIPT, SUBS, VIDEO  # noqa: E402


def ffprobe(path: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def filter_path(p: Path) -> str:
    """subtitles= フィルタに渡すパス（: \\ ' をエスケープ）。"""
    s = os.path.relpath(p, ROOT).replace("\\", "/")
    return s.replace(":", "\\:").replace("'", "\\'")


def verify(path: Path, expect_dur: float, cfg: dict, decode: bool = True) -> dict:
    info = ffprobe(path)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = [s for s in info["streams"] if s["codec_type"] == "audio"]
    subs = [s for s in info["streams"] if s["codec_type"] == "subtitle"]
    num, den = (int(x) for x in v["r_frame_rate"].split("/"))
    dur = float(info["format"]["duration"])
    res = {
        "file": str(path.relative_to(ROOT)), "size_mb": round(path.stat().st_size / 1e6, 1), "duration_s": round(dur, 2),
        "duration_expected_s": round(expect_dur, 2), "duration_diff_s": round(dur - expect_dur, 2),
        "width": v["width"], "height": v["height"], "fps": round(num / den, 3), "video_codec": v["codec_name"],
        "audio_streams": len(a), "audio_codec": a[0]["codec_name"] if a else None,
        "audio_sample_rate": a[0].get("sample_rate") if a else None, "subtitle_streams": len(subs),
    }
    res["checks"] = {
        "file_exists": path.exists(), "resolution_ok": (v["width"], v["height"]) == (cfg["video"]["width"], cfg["video"]["height"]),
        "fps_ok": abs(num / den - cfg["video"]["fps"]) < 0.01, "has_audio": len(a) > 0, "duration_close": abs(dur - expect_dur) < 1.0,
    }
    if decode:
        t0 = time.time()
        p = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "null", "-"], capture_output=True, text=True)
        res["decode_errors"] = p.stderr.strip()[:2000]
        res["decode_seconds"] = round(time.time() - t0, 1)
        res["checks"]["decodes_without_error"] = p.returncode == 0 and not p.stderr.strip()
        # 真っ黒な区間（0.5秒以上）を検出
        p = subprocess.run(["ffmpeg", "-v", "info", "-i", str(path), "-vf", "blackdetect=d=0.5:pix_th=0.06", "-an", "-f", "null", "-"],
                           capture_output=True, text=True)
        blacks = [ln.split("blackdetect")[1].strip() for ln in p.stderr.splitlines() if "black_start" in ln]
        res["black_segments"] = blacks
    return res


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-burn", action="store_true")
    ap.add_argument("--check-only", action="store_true")
    ap.add_argument("--crf", type=int)
    ap.add_argument("--out")
    args = ap.parse_args()
    cfg = yaml.safe_load((CONFIG / "project_config.yaml").read_text(encoding="utf-8"))
    tl = json.loads((SCRIPT / "timeline.json").read_text(encoding="utf-8"))
    out = Path(args.out) if args.out else VIDEO / "final" / "gene_quest_full.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    if not args.check_only:
        scenes = [VIDEO / "scenes" / f"{s['scene_id']}.mp4" for s in tl["scenes"]]
        missing = [p.name for p in scenes if not p.exists()]
        if missing:
            raise SystemExit(f"未描画のシーンがあります: {missing}（scripts/generate_scene.py を実行）")
        # フレーム数の確認（映像と音声の長さのずれを隠さない）
        for s, p in zip(tl["scenes"], scenes):
            info = ffprobe(p)
            v = next(x for x in info["streams"] if x["codec_type"] == "video")
            nb = int(v.get("nb_frames", 0))
            if nb and nb != s["frames"]:
                raise SystemExit(f"{s['scene_id']}: フレーム数 {nb} ≠ タイムライン {s['frames']}")
        work = VIDEO / "final" / ".work"
        work.mkdir(exist_ok=True)
        lst = work / "scenes.txt"
        lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in scenes), encoding="utf-8")
        joined = work / "video_only.mp4"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-map", "0:v", "-c", "copy",
                        str(joined)], check=True)
        mix = AUDIO / "final" / "gene_quest_mix.wav"
        srt = SUBS / "gene_quest.srt"
        # 映像と音声の長さを照合する（ずれていれば止める。-shortest で切り詰めて隠さない。
        # -shortest は字幕トラックの最後の字幕で動画を終わらせてしまうので使わない）
        v_dur = float(ffprobe(joined)["format"]["duration"])
        a_dur = float(ffprobe(mix)["format"]["duration"])
        if abs(v_dur - a_dur) > 1 / cfg["video"]["fps"]:
            raise SystemExit(f"映像 {v_dur:.3f}s と音声 {a_dur:.3f}s の長さが一致しません（mix_audio.py を再実行）")
        cmd = ["ffmpeg", "-y", "-v", "error", "-stats", "-i", str(joined), "-i", str(mix), "-i", str(srt), "-map", "0:v", "-map", "1:a",
               "-map", "2:s"]
        if not args.no_burn:
            cmd += ["-vf", f"subtitles={filter_path(SUBS / 'gene_quest.ass')}:fontsdir={filter_path(FONTS)}"]
        crf = args.crf or cfg["video"]["crf"]
        cmd += ["-c:v", "libx264", "-preset", cfg["video"]["preset"], "-crf", str(crf), "-pix_fmt", "yuv420p", "-tune", "animation",
                "-c:a", "aac", "-b:a", cfg["audio"]["bitrate"], "-c:s", "mov_text", "-metadata:s:s:0", "language=jpn",
                "-metadata:s:a:0", "language=jpn", "-metadata", "title=GENE QUEST 遺伝情報を読み解け！", "-movflags", "+faststart",
                str(out)]
        t0 = time.time()
        subprocess.run(cmd, check=True, cwd=ROOT)
        print(f"書き出し {time.time() - t0:.0f}s → {out}")
    res = verify(out, tl["duration"], cfg)
    (out.parent / "verification.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(res, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

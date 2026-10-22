#!/usr/bin/env python3
"""実際の音声の長さから、全編のタイムラインを作る（尺は推測しない）。

  python scripts/build_timeline.py

入力  script/dialogue.json, script/scene_manifest.json, audio/processed/*.wav
出力  script/timeline.json   シーンとセリフの開始・終了時刻（秒）、映像の同期点（cue）、口パク用の音量包絡
      audio/dialogue/scenes/<scene_id>.wav   シーンごとのセリフ音声（48 kHz）
      audio/dialogue/dialogue_full.wav       全編のセリフだけの音声

シーンの尺 = 先頭の余白 + Σ(前の間 + セリフ + 後の間) + 末尾の余白 + 演出のための追加時間（scene_extra）。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import AUDIO, SCRIPT  # noqa: E402

FPS = 30
SR = 48000
LEAD_IN = 0.35
LEAD_OUT = 0.45
# 映像を見せるための追加時間（秒）：セリフのない演出の時間を、音声とは別に確保する
SCENE_EXTRA = {
    "SC0101": 1.5,   # らせんの前進
    "SC0102": 1.0,   # ロゴ
    "SC0103": 0.5,
    "SC0105": 0.8,
    "SC0201": 0.8,   # 章タイトル
    "SC0301": 0.8, "SC0401": 0.8, "SC0501": 0.8, "SC0601": 0.8, "SC0701": 0.8, "SC0801": 0.8, "SC0901": 0.8,
    "SC0303": 0.6, "SC0402": 0.8, "SC0403": 0.6, "SC0605": 1.0, "SC0704": 0.6,
    "SC0907": 0.0,
}


def envelope(a: np.ndarray, sr: int) -> list[float]:
    """1フレーム（1/30秒）ごとの口の開き 0〜1。"""
    hop = sr // FPS
    n = int(np.ceil(len(a) / hop))
    pad = np.pad(a, (0, n * hop - len(a)))
    rms = np.sqrt(np.mean(pad.reshape(n, hop) ** 2, axis=1))
    if rms.max() <= 0:
        return [0.0] * n
    ref = np.percentile(rms[rms > rms.max() * 0.05], 90) if np.any(rms > rms.max() * 0.05) else rms.max()
    v = np.clip((rms / (ref + 1e-9) - 0.12) / 0.75, 0, 1)
    # 細かすぎる口の動きを少しならす
    k = np.array([0.25, 0.5, 0.25])
    v = np.convolve(v, k, mode="same")
    return [round(float(x), 3) for x in v]


def main() -> None:
    lines = {ln["line_id"]: ln for ln in json.loads((SCRIPT / "dialogue.json").read_text(encoding="utf-8"))["lines"]}
    scenes = json.loads((SCRIPT / "scene_manifest.json").read_text(encoding="utf-8"))["scenes"]
    proc = AUDIO / "processed"
    outdir = AUDIO / "dialogue" / "scenes"
    outdir.mkdir(parents=True, exist_ok=True)
    t = 0.0
    tl_scenes = []
    full = []
    missing = []
    for sc in scenes:
        start = t
        rel = LEAD_IN
        tl_lines = []
        chunks = [np.zeros(int(LEAD_IN * SR), np.float32)]
        for lid in sc["lines"]:
            ln = lines[lid]
            p = proc / f"{lid}.wav"
            if not p.exists():
                missing.append(lid)
                a = np.zeros(int(SR * max(1.0, len(ln["text"]) / 7.0)), np.float32)
            else:
                a, sr = sf.read(p, dtype="float32")
                assert sr == SR, p
            rel += ln["pause_before"]
            chunks.append(np.zeros(int(round(ln["pause_before"] * SR)), np.float32))
            dur = len(a) / SR
            tl_lines.append({
                "line_id": lid, "character_id": ln["character_id"], "text": ln["text"], "emotion": ln["emotion"],
                "cue": ln["cue"], "note": ln["note"], "why": ln.get("why", ""), "rel_start": round(rel, 3), "rel_end": round(rel + dur, 3),
                "start": round(start + rel, 3), "end": round(start + rel + dur, 3), "env": envelope(a, SR),
            })
            chunks.append(a)
            rel += dur + ln["pause_after"]
            chunks.append(np.zeros(int(round(ln["pause_after"] * SR)), np.float32))
        rel += LEAD_OUT + SCENE_EXTRA.get(sc["scene_id"], 0.0)
        # シーンの長さをフレームの整数倍にそろえる（映像と音声のずれを防ぐ）
        nframes = int(np.ceil(rel * FPS))
        dur = nframes / FPS
        audio = np.concatenate(chunks)
        audio = np.pad(audio, (0, max(0, int(round(dur * SR)) - len(audio))))[: int(round(dur * SR))]
        sf.write(outdir / f"{sc['scene_id']}.wav", audio, SR, subtype="PCM_16")
        full.append(audio)
        cues = {}
        for ln in tl_lines:
            cues.setdefault(ln["line_id"], ln["rel_start"])
            if ln["cue"]:
                cues[ln["cue"]] = ln["rel_start"]
        tl_scenes.append({
            "scene_id": sc["scene_id"], "title": sc["title"], "chapter": sc["chapter"], "chapter_title": sc["chapter_title"],
            "visual": sc.get("visual"), "bgm": sc.get("bgm"), "pages": sc["pages"], "sfx": sc["sfx"],
            "start": round(start, 3), "end": round(start + dur, 3), "duration": round(dur, 3), "frames": nframes,
            "lines": tl_lines, "cues": cues,
            # ファインマン・チェックの板書（原稿の card_* 見出し）
            "cards": {k[5:]: v for k, v in sc.items() if k.startswith("card_")},
        })
        t = start + dur
    sf.write(AUDIO / "dialogue" / "dialogue_full.wav", np.concatenate(full), SR, subtype="PCM_16")
    (SCRIPT / "timeline.json").write_text(json.dumps({"fps": FPS, "sample_rate": SR, "duration": round(t, 3),
                                                       "scenes": tl_scenes}, ensure_ascii=False), encoding="utf-8")
    m, s = divmod(t, 60)
    print(f"全編 {int(m)}分{s:04.1f}秒 / {len(tl_scenes)} シーン / {sum(len(s['lines']) for s in tl_scenes)} 行")
    chapters = {}
    for s in tl_scenes:
        chapters.setdefault(s["chapter"], [s["start"], s["end"]])[1] = s["end"]
    for c, (a, b) in chapters.items():
        print(f"  CH{c}: {int(a // 60)}:{a % 60:04.1f} – {int(b // 60)}:{b % 60:04.1f}（{b - a:.0f}秒）")
    if missing:
        print(f"！ 音声がない行 {len(missing)}（仮の無音を入れた）: {missing[:8]}")


if __name__ == "__main__":
    main()

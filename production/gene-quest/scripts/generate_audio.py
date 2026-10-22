#!/usr/bin/env python3
"""セリフ単位の音声生成（再開可能・変更分だけ再生成）。

  python scripts/generate_audio.py                 # 全セリフ（生成済みで変更のないものは飛ばす）
  python scripts/generate_audio.py --scene SC0101  # 指定シーンだけ
  python scripts/generate_audio.py --line SC0203-02 --force   # 1行だけ作り直す
  python scripts/generate_audio.py --device cuda   # GPU（Kaggle など）

入力  script/dialogue.json, config/voice_config.yaml
出力  audio/raw/<line_id>.wav（モデルの出力そのまま）
      audio/raw/manifest.json（行ごとの設定・ハッシュ・長さ・処理時間）
      logs/generate_audio.jsonl（実行ログ）

各行のハッシュは「読み・声の設定・感情」から作る。台本や声を変えた行だけハッシュが変わり、作り直される。
途中で止まっても、manifest は1行ごとに保存するので、再実行すると続きから進む。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import soundfile as sf
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import AUDIO, CONFIG, LOGS, SCRIPT  # noqa: E402
from gqlib.tts import Voice, synth  # noqa: E402


def voice_for(line: dict, vc: dict) -> Voice:
    c = vc[line["character_id"]]
    emo = line["emotion"]
    is_emotional = emo != "Neutral"
    return Voice(
        engine=c["engine"], model=c["model"],
        style=emo if is_emotional else c.get("style", "Neutral"),
        style_weight=line["emotion_strength"],
        length=c.get("length", 1.0), pitch=c.get("pitch", 1.0), intonation=c.get("intonation", 1.0),
    )


def line_hash(line: dict, v: Voice) -> str:
    key = json.dumps({"reading": line["reading"], "voice": v.__dict__}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(key.encode()).hexdigest()[:16]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", action="append")
    ap.add_argument("--line", action="append")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    lines = json.loads((SCRIPT / "dialogue.json").read_text(encoding="utf-8"))["lines"]
    vc = yaml.safe_load((CONFIG / "voice_config.yaml").read_text(encoding="utf-8"))["characters"]
    raw = AUDIO / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    LOGS.mkdir(exist_ok=True)
    man_path = raw / "manifest.json"
    manifest = json.loads(man_path.read_text(encoding="utf-8")) if man_path.exists() else {}

    if args.device != "cpu":
        from gqlib import tts
        tts._ENGINES["sbv2"] = tts.SBV2Engine(device=args.device)

    todo = []
    for ln in lines:
        if args.scene and ln["scene_id"] not in args.scene:
            continue
        if args.line and ln["line_id"] not in args.line:
            continue
        v = voice_for(ln, vc)
        h = line_hash(ln, v)
        out = raw / f"{ln['line_id']}.wav"
        done = manifest.get(ln["line_id"], {})
        if not args.force and out.exists() and done.get("hash") == h:
            continue
        todo.append((ln, v, h, out))
    print(f"生成するセリフ: {len(todo)} / {len(lines)}")
    if args.dry_run:
        for ln, v, h, _ in todo:
            print(ln["line_id"], v.engine, v.model, v.style, ln["reading"][:40])
        return

    log = open(LOGS / "generate_audio.jsonl", "a", encoding="utf-8")
    t_all = time.time()
    for i, (ln, v, h, out) in enumerate(todo, 1):
        rec = {"time": datetime.now().isoformat(timespec="seconds"), "task": "tts", "line_id": ln["line_id"],
               "model": f"{v.engine}:{v.model}", "style": v.style, "input": ln["reading"], "output": str(out.relative_to(AUDIO.parent))}
        try:
            a, sr, dt = synth(ln["reading"], v)
            sf.write(out, a, sr, subtype="PCM_16")
            manifest[ln["line_id"]] = {
                "scene_id": ln["scene_id"], "line_id": ln["line_id"], "character_id": ln["character_id"],
                "text": ln["text"], "reading": ln["reading"], "voice_model": f"{v.engine}:{v.model}",
                "speaking_rate": round(1.0 / v.length, 3), "emotion": v.style, "emotion_strength": v.style_weight,
                "pitch": v.pitch, "pause_before": ln["pause_before"], "pause_after": ln["pause_after"],
                "output_path": str(out.relative_to(AUDIO.parent)), "sample_rate": sr,
                "duration": round(len(a) / sr, 3), "synth_seconds": round(dt, 2), "hash": h,
            }
            man_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
            rec.update(status="ok", seconds=round(dt, 2), duration=round(len(a) / sr, 3))
            print(f"[{i}/{len(todo)}] {ln['line_id']} {v.model}/{v.style} {len(a) / sr:.1f}s ({dt:.1f}s)", flush=True)
        except Exception as e:  # 1行の失敗で全体を止めない。失敗した行は次回の実行で再挑戦される
            rec.update(status="error", error=f"{type(e).__name__}: {e}")
            print(f"[{i}/{len(todo)}] {ln['line_id']} 失敗: {e}", flush=True)
        log.write(json.dumps(rec, ensure_ascii=False) + "\n")
        log.flush()
    print(f"完了 {time.time() - t_all:.0f}s")


if __name__ == "__main__":
    main()

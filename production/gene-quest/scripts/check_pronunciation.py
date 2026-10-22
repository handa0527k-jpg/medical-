#!/usr/bin/env python3
"""全セリフの読みを、音声認識（Whisper small）で確かめる。

  python scripts/check_pronunciation.py            # 全セリフ
  python scripts/check_pronunciation.py --scene SC0402

方法：合成音声を書き起こし、台本の「読み」とかな換算で比べる（文字誤り率 CER）。
英字の用語は書き起こしが英字や数字（例 TF2D）になり、読みが正しくても誤りに数えられることがあるので、
CER が高い行は「要確認」として一覧にし、書き起こし結果を並べて人が判断する。
出力  audio/pronunciation_check/report.csv, reports/pronunciation_check.md
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import AUDIO, MODELS, REPORTS, SCRIPT  # noqa: E402
from gqlib.text import to_reading  # noqa: E402


def kana(s: str) -> str:
    import pyopenjtalk
    k = pyopenjtalk.g2p(s, kana=True)
    return re.sub(r"[、。，．,.！？!?\s・ー]", "", k)


def cer(r: str, h: str) -> float:
    d = np.arange(len(h) + 1)
    for i, rc in enumerate(r, 1):
        prev, d[0] = d[0], i
        for j, hc in enumerate(h, 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (rc != hc))
            prev, d[j] = d[j], cur
    return d[len(h)] / max(1, len(r))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", action="append")
    ap.add_argument("--threshold", type=float, default=0.15)
    args = ap.parse_args()
    from faster_whisper import WhisperModel
    asr = WhisperModel(str(MODELS / "whisper-small"), device="cpu", compute_type="int8")
    lines = json.loads((SCRIPT / "dialogue.json").read_text(encoding="utf-8"))["lines"]
    rows = []
    for ln in lines:
        if args.scene and ln["scene_id"] not in args.scene:
            continue
        p = AUDIO / "processed" / f"{ln['line_id']}.wav"
        segs, _ = asr.transcribe(str(p), language="ja", beam_size=5)
        hyp = "".join(s.text for s in segs)
        ref_k = kana(ln["reading"])
        hyp_k = kana(to_reading(hyp))
        rows.append({"line_id": ln["line_id"], "character": ln["character_id"], "text": ln["text"], "reading": ln["reading"],
                     "asr": hyp, "cer": round(cer(ref_k, hyp_k), 3)})
        print(ln["line_id"], rows[-1]["cer"], hyp[:40], flush=True)
    out = AUDIO / "pronunciation_check"
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "report.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    cers = [r["cer"] for r in rows]
    by_char = {}
    for r in rows:
        by_char.setdefault(r["character"], []).append(r["cer"])
    md = ["# 発音の確認（Whisper small による書き起こし）", "",
          f"対象 {len(rows)} 行。かな換算の文字誤り率（CER）：平均 {np.mean(cers):.3f}、中央値 {np.median(cers):.3f}。", "",
          "| 話者 | 行数 | 平均CER |", "|---|---|---|"]
    for ch, v in by_char.items():
        md.append(f"| {ch} | {len(v)} | {np.mean(v):.3f} |")
    md += ["", f"## CER が {args.threshold} を超えた行（要確認）", "",
           "英字の用語（TFIID など）は書き起こしが英字・数字になるため、読みが正しくても CER が上がる。書き起こしを見て判断した結果を「判断」に記す。", "",
           "| 行 | 字幕 | 書き起こし | CER | 判断 |", "|---|---|---|---|---|"]
    for r in sorted(rows, key=lambda r: -r["cer"]):
        if r["cer"] > args.threshold:
            md.append(f"| {r['line_id']} | {r['text']} | {r['asr']} | {r['cer']} | |")
    (REPORTS / "pronunciation_check.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"平均CER {np.mean(cers):.3f}、要確認 {sum(c > args.threshold for c in cers)} 行")


if __name__ == "__main__":
    main()

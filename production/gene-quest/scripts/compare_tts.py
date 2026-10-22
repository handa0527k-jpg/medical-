#!/usr/bin/env python3
"""音声合成モデルの比較（同じ文章を各モデルで合成し、客観指標を記録する）。

  python scripts/compare_tts.py            # 全候補
  python scripts/compare_tts.py --quick    # 各エンジン1声だけ

出力
  audio/comparison/<engine>__<voice>__<n>.wav   聴き比べ用
  reports/audio_comparison.csv                  文ごとの指標
  reports/audio_comparison.md                   集計（scripts/compare_tts.py が上書き）

指標
  CER   : Whisper(small) の書き起こしと台本の、かな換算の文字誤り率（低いほど聞き取りやすい）
  RTF   : 処理時間 / 音声の長さ（CPU）
  mora/s: 話速
  F0 sd : 基本周波数の標準偏差（半音）。抑揚の大きさの目安で、良し悪しではない
自動指標は「聴いて確かめる」ことの代わりにはならない。人の耳による評価は reports/audio_quality_report.md に別に記録する。
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import AUDIO, MODELS, REPORTS  # noqa: E402
from gqlib.text import to_reading  # noqa: E402
from gqlib.tts import Voice, synth  # noqa: E402

SENTENCES = [
    "RNAポリメラーゼは、鋳型鎖を3'から5'の方向に読み、RNAを5'から3'の方向に合成する。",
    "TFIIDがTBPというサブユニットを介してTATAボックスに結合し、隣にTFIIBが結合できるようになる。",
    "U1 snRNPがイントロンの5'末端にあるGU配列に結合する。",
    "エンドヌクレアーゼのDroshaが、60から70ヌクレオチドのpre-miRNAに切り出す。",
    "え、なに？ 顕微鏡の光が、吸い込まれる！",
    "じゃあ、どこから書き写すかも決まっているの？ DNAってすごく長いのに。",
    "BMAL1とCLOCKが結合して、E-boxという配列に結合する。",
    "発現しない遺伝子は、凝集したクロマチン、ヘテロクロマチンの領域にあるんだ。",
]

CANDIDATES = [
    Voice("sbv2", "jvnv-F1-jp"),
    Voice("sbv2", "jvnv-F2-jp"),
    Voice("sbv2", "jvnv-M1-jp"),
    Voice("sbv2", "jvnv-M2-jp"),
    Voice("sbv2", "amitaro"),
    Voice("sbv2", "koharune-ami"),
    Voice("kokoro", "jf_alpha"),
    Voice("kokoro", "jf_gongitsune"),
    Voice("kokoro", "jf_nezumi"),
    Voice("kokoro", "jf_tebukuro"),
    Voice("kokoro", "jm_kumo"),
    Voice("edge", "ja-JP-NanamiNeural"),
]


def kana(text: str) -> str:
    import pyopenjtalk

    k = pyopenjtalk.g2p(to_reading(text), kana=True)
    return re.sub(r"[、。，．,.！？!?\s・ー]", "", k)


def cer(ref: str, hyp: str) -> float:
    r, h = kana(ref), kana(hyp)
    d = np.arange(len(h) + 1)
    for i, rc in enumerate(r, 1):
        prev, d[0] = d[0], i
        for j, hc in enumerate(h, 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (rc != hc))
            prev, d[j] = d[j], cur
    return d[len(h)] / max(1, len(r))


def f0_sd_semitones(a: np.ndarray, sr: int) -> float:
    import pyworld

    x = a.astype(np.float64)
    f0, _ = pyworld.dio(x, sr, frame_period=10)
    f0 = f0[f0 > 0]
    if len(f0) < 5:
        return float("nan")
    st = 12 * np.log2(f0 / np.median(f0))
    return float(np.std(st))


def morae(text: str) -> int:
    return len(kana(text))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--no-asr", action="store_true")
    args = ap.parse_args()

    out = AUDIO / "comparison"
    out.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(exist_ok=True)

    asr = None
    if not args.no_asr:
        from faster_whisper import WhisperModel

        asr = WhisperModel(str(MODELS / "whisper-small"), device="cpu", compute_type="int8")

    voices = CANDIDATES
    if args.quick:
        seen, voices = set(), []
        for v in CANDIDATES:
            if v.engine not in seen:
                seen.add(v.engine)
                voices.append(v)

    rows = []
    for v in voices:
        for n, text in enumerate(SENTENCES):
            path = out / f"{v.engine}__{v.model}__{n}.wav"
            row = {"engine": v.engine, "voice": v.model, "n": n, "text": text}
            try:
                if path.exists():
                    a, sr = sf.read(path, dtype="float32")
                    dt = float("nan")
                else:
                    a, sr, dt = synth(to_reading(text), v)
                    sf.write(path, a, sr)
            except Exception as e:  # エンジンが使えない環境でも比較を続ける
                row.update(error=f"{type(e).__name__}: {str(e)[:120]}")
                rows.append(row)
                print(v.engine, v.model, n, "ERROR", row["error"], flush=True)
                continue
            dur = len(a) / sr
            row.update(duration=round(dur, 2), rtf=round(dt / dur, 3) if dt == dt else "",
                       mora_per_s=round(morae(text) / dur, 2), f0_sd=round(f0_sd_semitones(a, sr), 2),
                       peak=round(float(np.abs(a).max()), 3))
            if asr is not None:
                t0 = time.time()
                segs, _ = asr.transcribe(str(path), language="ja", beam_size=5)
                hyp = "".join(s.text for s in segs)
                row.update(asr=hyp, cer=round(cer(text, hyp), 3))
            rows.append(row)
            print(v.engine, v.model, n, row.get("cer"), row.get("rtf"), flush=True)

    keys = ["engine", "voice", "n", "text", "duration", "rtf", "mora_per_s", "f0_sd", "peak", "cer", "asr", "error"]
    with open(REPORTS / "audio_comparison.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in keys})

    # 集計
    lines = ["# 音声合成モデルの比較（自動指標）", "",
             "同じ8文（医学用語4文・会話4文）を各モデルで合成した。CER は Whisper small の書き起こしと台本のかな換算の文字誤り率。",
             "F0 sd は抑揚の大きさの目安（半音）。RTF は CPU（4コア）での処理時間 / 音声長。", "",
             "| エンジン | 声 | CER（医学用語4文） | CER（会話4文） | 話速 mora/s | F0 sd | RTF | 備考 |",
             "|---|---|---|---|---|---|---|---|"]
    from collections import defaultdict

    g = defaultdict(list)
    for r in rows:
        g[(r["engine"], r["voice"])].append(r)
    for (e, vname), rs in g.items():
        ok = [r for r in rs if "error" not in r]
        if not ok:
            lines.append(f"| {e} | {vname} | – | – | – | – | – | 使用不可：{rs[0]['error']} |")
            continue
        med = [r["cer"] for r in ok if r["n"] < 4 and "cer" in r]
        conv = [r["cer"] for r in ok if r["n"] >= 4 and "cer" in r]
        rtf = [r["rtf"] for r in ok if r.get("rtf") not in ("", None)]
        fmt = lambda xs: f"{np.mean(xs):.3f}" if xs else "–"  # noqa: E731
        lines.append(f"| {e} | {vname} | {fmt(med)} | {fmt(conv)} | {np.mean([r['mora_per_s'] for r in ok]):.1f} | "
                     f"{np.nanmean([r['f0_sd'] for r in ok]):.2f} | {fmt(rtf)} | |")
    (REPORTS / "audio_comparison.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

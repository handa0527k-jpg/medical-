#!/usr/bin/env python3
"""セリフ音声の検査と仕上げ（測ってから、必要な処理だけを行う）。

  python scripts/process_audio.py            # 全セリフ
  python scripts/process_audio.py --stages   # 比較用に段階別のファイルも保存（各話者の最初の3行）

処理の順序（どれも「測定 → 必要なら適用」）
  1. 検証：無音・NaN・音割れ（最大値に3サンプル以上連続して張り付く箇所）
  2. 無音区間の検出：前後の無音を切る（-45 dBFS 未満、40 ms は残す）。文中の間は残す
  3. 音量の測定：ラウドネス（LUFS）、ピーク、ノイズフロア（最も静かな 20 ms の RMS。間のない行は測定不可）
  4. ノイズの確認：ノイズフロアが -60 dBFS より大きい行を「要確認」として記録する（除去はしない。
     該当行の最大値でも −50.6 dBFS で、合成音声の無音部分の値のため。除去すると声を傷める恐れのほうが大きい）
  5. EQ：70 Hz 以下の低域カット（全行）。2〜5 kHz の帯域が 0.2〜1 kHz より 12 dB 以上低い行だけ +2 dB の明瞭度補正
  6. 音量の正規化：-20 LUFS（セリフどうしの音量差をなくす）
  7. コンプレッサー：ピークとラウドネスの差（クレストファクター）が 17 dB を超える行だけ、2:1 で軽く
  8. ピーク制限：-1.5 dBFS
出力
  audio/processed/<line_id>.wav（48 kHz / 16 bit / モノラル）
  audio/processed/report.json（行ごとの測定値と適用した処理）
  audio/processed/stages/<line_id>__1_raw.wav … __5_final.wav（--stages 指定時）
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import AUDIO, SCRIPT  # noqa: E402

SR = 48000
TARGET_LUFS = -20.0
PEAK_DB = -1.5


def db(x: float) -> float:
    return 20 * np.log10(max(x, 1e-9))


def trim(a: np.ndarray, sr: int, thr_db=-45.0, keep=0.04) -> tuple[np.ndarray, float, float]:
    win = int(sr * 0.01)
    n = len(a) // win
    if n == 0:
        return a, 0.0, 0.0
    rms = np.sqrt(np.mean(a[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    loud = np.where(20 * np.log10(rms) > thr_db)[0]
    if len(loud) == 0:
        return a, 0.0, 0.0
    s = max(0, loud[0] * win - int(keep * sr))
    e = min(len(a), (loud[-1] + 1) * win + int(keep * sr))
    return a[s:e], s / sr, (len(a) - e) / sr


def noise_floor(a: np.ndarray, sr: int) -> float | None:
    """最も静かな 20 ms 窓の音量。-50 dBFS 以上しかない行（間のない短いセリフ）は None（測定できない）。"""
    win = int(sr * 0.02)
    n = len(a) // win
    if n < 2:
        return None
    rms = np.sqrt(np.mean(a[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    m = db(float(np.min(rms)))
    return m if m < -50 else None


def band_db(a: np.ndarray, sr: int, lo: float, hi: float) -> float:
    f, p = signal.welch(a, sr, nperseg=2048)
    m = (f >= lo) & (f < hi)
    return 10 * np.log10(np.sum(p[m]) + 1e-20)


def peaking(a, sr, f0, gain_db, q=1.0):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / sr
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A]
    aa = [1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A]
    return signal.lfilter(np.array(b) / aa[0], np.array(aa) / aa[0], a)


def compress(a, sr, thr_db=-24.0, ratio=2.0, attack=0.005, release=0.08):
    env = np.zeros_like(a)
    ga, gr = np.exp(-1 / (attack * sr)), np.exp(-1 / (release * sr))
    e = 0.0
    x = np.abs(a)
    for i in range(len(a)):  # 1行は数秒なので素直なループで十分
        g = ga if x[i] > e else gr
        e = g * e + (1 - g) * x[i]
        env[i] = e
    lvl = 20 * np.log10(env + 1e-9)
    over = np.maximum(0.0, lvl - thr_db)
    gain = 10 ** (-(over - over / ratio) / 20)
    return a * gain


def process(path: Path, stages_dir: Path | None) -> tuple[np.ndarray, dict]:
    a, sr = sf.read(path, dtype="float64")
    if a.ndim > 1:
        a = a.mean(1)
    info: dict = {"source_sr": sr}
    stage = {}
    if not np.all(np.isfinite(a)) or len(a) == 0:
        raise ValueError("無効な音声")
    # 音割れ＝最大値に3サンプル以上連続して張り付いている箇所（単発の最大値はモデルのピーク正規化によるもの）
    m = (np.abs(a) >= 0.999).astype(np.int8)
    runs = np.diff(np.flatnonzero(np.diff(np.concatenate([[0], m, [0]])))) [::2] if m.any() else np.array([0])
    info["full_scale_samples"] = int(m.sum())
    info["clipped_runs"] = int(np.sum(runs >= 3))
    if sr != SR:
        g = np.gcd(sr, SR)
        a = signal.resample_poly(a, SR // g, sr // g)
    stage["1_raw"] = a.copy()
    a, cut_head, cut_tail = trim(a, SR)
    info.update(trim_head=round(cut_head, 3), trim_tail=round(cut_tail, 3))
    meter = pyln.Meter(SR)
    info["lufs_in"] = round(float(meter.integrated_loudness(a)) if len(a) > SR * 0.4 else db(np.sqrt(np.mean(a ** 2))) - 3, 1)
    info["peak_in_db"] = round(db(float(np.max(np.abs(a)))), 1)
    nf = noise_floor(a, SR)
    info["noise_floor_db"] = None if nf is None else round(nf, 1)
    applied = []
    if nf is not None and nf > -60:
        # 簡易なスペクトル減算の代わりに、ffmpeg の afftdn 相当は使わず、雑音の多い行として記録だけする
        applied.append("denoise_needed(flagged)")
    # EQ
    b, aa = signal.butter(2, 70 / (SR / 2), "highpass")
    a = signal.lfilter(b, aa, a)
    applied.append("hpf70")
    pres = band_db(a, SR, 2000, 5000) - band_db(a, SR, 200, 1000)
    info["presence_db"] = round(pres, 1)
    if pres < -12:
        a = peaking(a, SR, 3500, 2.0, 0.8)
        applied.append("presence+2dB")
    stage["2_eq"] = a.copy()
    # 正規化
    if len(a) > SR * 0.4:
        lufs = meter.integrated_loudness(a)
    else:
        lufs = db(np.sqrt(np.mean(a ** 2))) - 3
    a = a * 10 ** ((TARGET_LUFS - lufs) / 20)
    stage["3_norm"] = a.copy()
    crest = db(float(np.max(np.abs(a)))) - TARGET_LUFS
    info["crest_db"] = round(crest, 1)
    if crest > 17:
        a = compress(a, SR)
        if len(a) > SR * 0.4:
            a = a * 10 ** ((TARGET_LUFS - meter.integrated_loudness(a)) / 20)
        applied.append("comp2:1")
    stage["4_comp"] = a.copy()
    pk = np.max(np.abs(a))
    lim = 10 ** (PEAK_DB / 20)
    if pk > lim:
        a = np.tanh(a / lim * 0.9) * lim / np.tanh(0.9) if pk > lim * 1.5 else a * (lim / pk)
        applied.append("peak_limit")
    stage["5_final"] = a.copy()
    info["applied"] = applied
    info["duration"] = round(len(a) / SR, 3)
    info["lufs_out"] = round(float(meter.integrated_loudness(a)) if len(a) > SR * 0.4 else TARGET_LUFS, 1)
    if stages_dir is not None:
        for k, v in stage.items():
            sf.write(stages_dir / f"{path.stem}__{k}.wav", v.astype(np.float32), SR, subtype="PCM_16")
    return a.astype(np.float32), info


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stages", action="store_true")
    ap.add_argument("--scene", action="append")
    args = ap.parse_args()
    raw = AUDIO / "raw"
    out = AUDIO / "processed"
    out.mkdir(parents=True, exist_ok=True)
    stages_dir = out / "stages"
    if args.stages:
        stages_dir.mkdir(exist_ok=True)
    manifest = json.loads((raw / "manifest.json").read_text(encoding="utf-8"))
    current_ids = {ln["line_id"] for ln in json.loads((SCRIPT / "dialogue.json").read_text(encoding="utf-8"))["lines"]}
    rep_path = out / "report.json"
    report = json.loads(rep_path.read_text(encoding="utf-8")) if rep_path.exists() else {}
    seen_chars: dict[str, int] = {}
    n = 0
    for lid, m in sorted(manifest.items()):
        if lid not in current_ids:
            continue
        if args.scene and m["scene_id"] not in args.scene:
            continue
        src = raw / f"{lid}.wav"
        dst = out / f"{lid}.wav"
        # 生成元が変わっていなければ飛ばす
        if dst.exists() and report.get(lid, {}).get("hash") == m["hash"] and not args.stages:
            continue
        ch = m["character_id"]
        seen_chars[ch] = seen_chars.get(ch, 0) + 1
        sd = stages_dir if args.stages and seen_chars[ch] <= 3 else None
        a, info = process(src, sd)
        sf.write(dst, a, SR, subtype="PCM_16")
        info["hash"] = m["hash"]
        info["character_id"] = ch
        report[lid] = info
        n += 1
    # 原稿から消えた行（シーン番号の振り直しなど）の記録は残さない（集計がずれるため）
    current = {ln["line_id"] for ln in json.loads((SCRIPT / "dialogue.json").read_text(encoding="utf-8"))["lines"]}
    report = {k: v for k, v in report.items() if k in current}
    rep_path.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    vals = list(report.values())
    print(f"処理 {n} 行 / 全 {len(vals)} 行")
    if vals:
        nf = [v["noise_floor_db"] for v in vals if v["noise_floor_db"] is not None]
        print(f"ノイズフロア（無音区間のある {len(nf)} 行）最大 {max(nf):.1f} dBFS / 中央値 {np.median(nf):.1f}")
        print("EQ補正:", sum("presence+2dB" in v["applied"] for v in vals), "行 / コンプ:",
              sum("comp2:1" in v["applied"] for v in vals), "行 / ピーク制限:", sum("peak_limit" in v["applied"] for v in vals),
              "行 / ノイズ除去が必要:", sum("denoise_needed(flagged)" in v["applied"] for v in vals), "行")
        print("音割れ（連続3サンプル以上）のある行:", [k for k, v in report.items() if v["clipped_runs"] > 0])


if __name__ == "__main__":
    main()

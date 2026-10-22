#!/usr/bin/env python3
"""セリフ・BGM・効果音をミックスする。

  python scripts/mix_audio.py                 # 全編
  python scripts/mix_audio.py --range 0 30    # 0〜30秒だけ（試作の確認用）

入力  audio/dialogue/dialogue_full.wav, script/timeline.json, assets/music/src/*.mp3, assets/sound_effects/*.wav
出力  audio/final/gene_quest_mix.wav（48 kHz ステレオ、-16 LUFS、ピーク -1.5 dBFS）
      audio/final/stems/{dialogue,bgm,sfx}.wav（確認用の素材別トラック）
      audio/final/mix_report.json（ラウドネス、セリフ中の BGM の下がり幅など）

BGM はシーンの bgm が同じあいだ1曲を流し続け、曲が変わるところで 2 秒のクロスフェード。
セリフのあるところでは BGM を自動で下げる（ダッキング：立ち上がり 0.12 秒、戻り 0.6 秒）。
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import ASSETS, AUDIO, CONFIG, SCRIPT  # noqa: E402

SR = 48000


def load_mp3(path: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(SR), "pipe:1"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def db2g(d: float) -> float:
    return 10 ** (d / 20)


def smooth_env(x: np.ndarray, attack: float, release: float, hop: int) -> np.ndarray:
    n = len(x) // hop
    r = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1))
    out = np.zeros(n)
    a = np.exp(-hop / (attack * SR))
    b = np.exp(-hop / (release * SR))
    e = 0.0
    for i, v in enumerate(r):
        g = a if v > e else b
        e = g * e + (1 - g) * v
        out[i] = e
    full = np.repeat(out, hop) if n else np.zeros(0)
    return np.pad(full, (0, max(0, len(x) - len(full))), mode="edge" if len(full) else "constant")[: len(x)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--range", nargs=2, type=float)
    ap.add_argument("--out")
    args = ap.parse_args()
    cfg = yaml.safe_load((CONFIG / "project_config.yaml").read_text(encoding="utf-8"))
    ac = cfg["audio"]
    tl = json.loads((SCRIPT / "timeline.json").read_text(encoding="utf-8"))
    dia, sr = sf.read(AUDIO / "dialogue" / "dialogue_full.wav", dtype="float32")
    assert sr == SR
    N = len(dia)
    # ---- BGM
    music_dir = ASSETS / "music" / "src"
    segs = []
    for sc in tl["scenes"]:
        key = sc.get("bgm")
        if segs and segs[-1][0] == key:
            segs[-1][2] = sc["end"]
        else:
            segs.append([key, sc["start"], sc["end"]])
    bgm = np.zeros((N, 2), np.float32)
    cache: dict[str, np.ndarray] = {}
    XF = 2.0
    for key, s, e in segs:
        m = cfg["bgm"].get(key)
        if not m:
            continue
        if m["file"] not in cache:
            cache[m["file"]] = load_mp3(music_dir / m["file"])
        tr = cache[m["file"]]
        i0 = max(0, int((s - XF / 2) * SR))
        i1 = min(N, int((e + XF / 2) * SR))
        n = i1 - i0
        reps = int(np.ceil(n / len(tr))) + 1
        seg = np.concatenate([tr] * reps)[:n] * db2g(m.get("gain_db", 0))
        ramp = np.ones(n, np.float32)
        nf = min(n // 2, int(XF * SR))
        ramp[:nf] = np.linspace(0, 1, nf) ** 0.5
        ramp[-nf:] = np.linspace(1, 0, nf) ** 0.5
        bgm[i0:i1] += seg * ramp[:, None]
    # BGM の基準音量：セリフ（-20 LUFS）に対して bgm_gain_db
    meter = pyln.Meter(SR)
    lb = meter.integrated_loudness(bgm[: min(N, SR * 600)]) if np.any(bgm) else -70
    bgm *= db2g(ac["dialogue_lufs"] + ac["bgm_gain_db"] - lb)
    # ダッキング
    env = smooth_env(dia, 0.12, 0.6, 480)
    speech = np.clip(env / (db2g(-34)), 0, 1)  # セリフの音量が -34 dBFS 以上で最大まで下げる
    duck = db2g(ac["bgm_duck_db"]) ** speech
    bgm *= duck[:, None].astype(np.float32)
    # ---- 効果音
    sfx = np.zeros(N, np.float32)
    sdir = ASSETS / "sound_effects"
    placed = []
    for sc in tl["scenes"]:
        line_start = {ln["line_id"]: ln["start"] for ln in sc["lines"]}
        for item in sc.get("sfx", []):
            name, _, at = item.partition("@")
            if at in line_start:
                t = line_start[at]
            else:
                try:
                    t = sc["start"] + float(at)
                except ValueError:
                    continue
            f = sdir / f"{name}.wav"
            if not f.exists():
                continue
            x, _ = sf.read(f, dtype="float32")
            i = int(t * SR)
            j = min(N, i + len(x))
            sfx[i:j] += x[: j - i] * db2g(ac["sfx_gain_db"])
            placed.append({"scene": sc["scene_id"], "sfx": name, "time": round(t, 2)})
    # ---- 合成
    mix = bgm.copy()
    mix += dia[:, None]
    mix += sfx[:, None]
    lo, hi = 0, N
    if args.range:
        lo, hi = int(args.range[0] * SR), int(args.range[1] * SR)
        mix, bgm_r, dia_r, sfx_r = mix[lo:hi], bgm[lo:hi], dia[lo:hi], sfx[lo:hi]
    else:
        bgm_r, dia_r, sfx_r = bgm, dia, sfx
    L = meter.integrated_loudness(mix)
    g = db2g(ac["target_lufs"] - L)
    mix *= g
    peak = np.max(np.abs(mix))
    lim = db2g(ac["true_peak_db"])
    if peak > lim:
        # 柔らかいリミッター（ピーク付近だけを丸める）
        over = np.abs(mix) > lim * 0.8
        mix[over] = np.sign(mix[over]) * (lim * 0.8 + (lim * 0.2) * np.tanh((np.abs(mix[over]) - lim * 0.8) / (lim * 0.2)))
    out = Path(args.out) if args.out else AUDIO / "final" / "gene_quest_mix.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, mix, SR, subtype="PCM_24")
    stems = out.parent / "stems"
    stems.mkdir(exist_ok=True)
    if not args.range:
        sf.write(stems / "dialogue.wav", dia_r * g, SR, subtype="PCM_16")
        sf.write(stems / "bgm.wav", bgm_r * g, SR, subtype="PCM_16")
        sf.write(stems / "sfx.wav", sfx_r * g, SR, subtype="PCM_16")
    # 報告：セリフ中とセリフのないところの BGM の音量差
    sp = speech[lo:hi] > 0.5
    rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)  # noqa: E731
    rep = {"integrated_lufs_before": round(L, 2), "integrated_lufs_after": round(meter.integrated_loudness(mix), 2),
           "peak_dbfs": round(20 * np.log10(np.max(np.abs(mix)) + 1e-9), 2),
           "bgm_vs_dialogue_during_speech_db": round(rms(bgm_r[sp]) - rms(dia_r[sp]), 1) if sp.any() else None,
           "bgm_level_without_speech_db": round(rms(bgm_r[~sp] * g), 1) if (~sp).any() else None,
           "sfx_count": len(placed), "bgm_segments": segs, "duration": round((hi - lo) / SR, 2)}
    (out.parent / "mix_report.json").write_text(json.dumps(rep, ensure_ascii=False, indent=1, default=float), encoding="utf-8")
    print(json.dumps({k: v for k, v in rep.items() if k != "bgm_segments"}, ensure_ascii=False, default=float))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""比較用音声に、参照なしの品質推定（torchaudio SQUIM）を付ける。

  python scripts/score_tts_quality.py   → reports/audio_comparison_squim.csv と audio_comparison.md への追記

SQUIM_OBJECTIVE：STOI（明瞭度 0〜1）、PESQ（音質 1〜4.5）、SI-SDR（dB）の推定。
SQUIM_SUBJECTIVE：MOS（1〜5）の推定。非一致参照として、別のモデル（jvnv-M2-jp の同じ文）を使う。
どれも推定値であり、人の耳による評価の代わりにはならない。
"""
import csv
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
import torchaudio
import torchaudio.functional as AF

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gqlib.paths import AUDIO, REPORTS  # noqa: E402

obj = torchaudio.pipelines.SQUIM_OBJECTIVE.get_model()
sub = torchaudio.pipelines.SQUIM_SUBJECTIVE.get_model()


def load16(p):
    import soundfile as sf
    a, sr = sf.read(p, dtype="float32")
    if a.ndim > 1:
        a = a.mean(1)
    w = torch.from_numpy(a)[None]
    return AF.resample(w, sr, 16000)


rows = []
files = sorted((AUDIO / "comparison").glob("*.wav"))
for f in files:
    eng, voice, n = f.stem.split("__")
    w = load16(f)
    ref = load16(AUDIO / "comparison" / f"kokoro__jf_alpha__{(int(n) + 1) % 8}.wav")
    with torch.no_grad():
        stoi, pesq, sisdr = obj(w)
        mos = sub(w, ref)
    rows.append({"engine": eng, "voice": voice, "n": int(n), "stoi": float(stoi), "pesq": float(pesq),
                 "si_sdr": float(sisdr), "mos": float(mos)})
    print(f.stem, round(float(stoi), 3), round(float(pesq), 2), round(float(mos), 2), flush=True)

with open(REPORTS / "audio_comparison_squim.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)
g = defaultdict(list)
for r in rows:
    g[(r["engine"], r["voice"])].append(r)
lines = ["", "## 参照なし品質推定（torchaudio SQUIM）", "",
         "| エンジン | 声 | STOI推定 | PESQ推定 | SI-SDR推定 | MOS推定 |", "|---|---|---|---|---|---|"]
for (e, v), rs in g.items():
    m = lambda k: np.mean([r[k] for r in rs])  # noqa: E731
    lines.append(f"| {e} | {v} | {m('stoi'):.3f} | {m('pesq'):.2f} | {m('si_sdr'):.1f} | {m('mos'):.2f} |")
md = REPORTS / "audio_comparison.md"
md.write_text(md.read_text(encoding="utf-8").split("\n## 参照なし品質推定")[0].rstrip() + "\n" + "\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))

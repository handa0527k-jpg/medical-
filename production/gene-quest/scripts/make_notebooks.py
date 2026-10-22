#!/usr/bin/env python3
"""Kaggle 用ノートブックを生成する（nbformat v4 の JSON を直接書く）。

  python scripts/make_notebooks.py → notebooks/*.ipynb
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def md(s):
    return {"cell_type": "markdown", "metadata": {}, "source": s.strip("\n").splitlines(True)}


def code(s):
    return {"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": s.strip("\n").splitlines(True)}


def nb(cells):
    for i, cell in enumerate(cells):  # nbformat 4.5 ではセルに id が必要
        cell["id"] = f"cell-{i:02d}"
    return {"cells": cells, "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
                                         "language_info": {"name": "python"}}, "nbformat": 4, "nbformat_minor": 5}


COMMON_SETUP = '''
import importlib.util


def ensure(pkgs: dict) -> None:
    """入っていないパッケージだけを入れる（pip がなければ uv を使う）。フル版の unidic は MeCab の初期化に失敗するので外す。"""
    missing = [pip for mod, pip in pkgs.items() if importlib.util.find_spec(mod) is None]
    has_pip = importlib.util.find_spec("pip") is not None
    if missing:
        cmd = [sys.executable, "-m", "pip", "install", "-q"] if has_pip else ["uv", "pip", "install", "--python", sys.executable]
        subprocess.run(cmd + missing, check=True)
    if importlib.util.find_spec("unidic") is not None:
        cmd = [sys.executable, "-m", "pip", "uninstall", "-y", "-q"] if has_pip else ["uv", "pip", "uninstall", "--python", sys.executable]
        subprocess.run(cmd + ["unidic"], check=True)
    print("追加したパッケージ:", missing or "なし")

import os, sys, subprocess, shutil, platform
from pathlib import Path
ON_KAGGLE = Path("/kaggle").exists()
# プロジェクトの場所：Kaggle では Dataset として追加した production/gene-quest を /kaggle/working にコピーして使う
PROJECT = Path(os.environ.get("GQ_PROJECT", "/kaggle/working/gene-quest" if ON_KAGGLE else Path.cwd().parent))
SRC = Path("/kaggle/input/gene-quest") if ON_KAGGLE else None
if ON_KAGGLE and not PROJECT.exists() and SRC and SRC.exists():
    shutil.copytree(SRC, PROJECT)
print("project:", PROJECT, "exists:", PROJECT.exists())
'''

env_check = nb([
    md('''
# GENE QUEST 環境確認ノートブック

**目的**：この実行環境（Kaggle Notebook またはローカル）で、音声合成と動画合成に必要なものが揃っているかを確認する。

- 必要なもの：Python 3.10 以上、FFmpeg、（あれば）GPU と CUDA 版 PyTorch
- 入力：なし ／ 出力：画面の表示のみ
- **GPU が使えない場合**：CPU でも全工程を実行できる（音声合成は CPU で実時間の約0.3倍の処理時間。246行で約8分）
- **Kaggle の設定**：右側の Settings で Accelerator を「GPU T4 x2」または「GPU P100」、Internet を On にする（モデルのダウンロードに必要）。
  GPU の利用枠（週あたりの時間）には上限がある。上限を超える使い方や、セッション制限の回避はしないこと。
- **エラー時**：`nvidia-smi` が失敗する → Accelerator が None。`ffmpeg` がない → Kaggle には通常入っている。ローカルでは OS のパッケージで入れる
'''),
    code(COMMON_SETUP),
    code('''
print("Python", sys.version.split()[0], platform.platform())
print("ffmpeg:", shutil.which("ffmpeg"))
gpu = ""
if shutil.which("nvidia-smi"):  # GPU のない環境には nvidia-smi 自体がない
    gpu = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
                         capture_output=True, text=True).stdout.strip()
print("GPU:", gpu or "なし（CPU で実行）")
try:
    import torch
    print("torch", torch.__version__, "CUDA:", torch.cuda.is_available())
except ImportError:
    print("torch 未インストール")
du = shutil.disk_usage(PROJECT if PROJECT.exists() else "/")
print(f"空き容量 {du.free/1e9:.1f} GB")
'''),
])

audio_cmp = nb([
    md('''
# 音声合成モデルの比較ノートブック

**目的**：同じ文章を Style-Bert-VITS2（JVNV・小春音アミ）と Kokoro で合成し、書き起こし誤り率・速度・参照なし品質推定を比べる。
ローカルで実行した結果は `reports/audio_comparison.md` にある。

- 依存関係：`style-bert-vits2`, `kokoro-onnx`, `misaki[ja]`, `fugashi`, `unidic-lite`, `faster-whisper`, `torchaudio`, `pyworld`
- 入力：HuggingFace のモデル（初回に自動でダウンロード、約3 GB）／出力：`audio/comparison/*.wav`, `reports/audio_comparison*.{md,csv}`
- **GPU が使えない場合**：そのまま CPU で動く（12声×8文で約12分）
- **ライセンス**：JVNV モデルは CC BY-SA 4.0、小春音アミ・あみたろはクレジット表記が必要（README 参照）。生成音声を実在の人物の声として扱わない
- **注意**：`unidic`（フル版）が入っていると MeCab の初期化に失敗する。`unidic-lite` だけを使う
'''),
    code(COMMON_SETUP),
    code('''
ensure({"style_bert_vits2": "style-bert-vits2", "kokoro_onnx": "kokoro-onnx", "misaki": "misaki[ja]", "fugashi": "fugashi",
        "unidic_lite": "unidic-lite", "faster_whisper": "faster-whisper", "pyloudnorm": "pyloudnorm", "soundfile": "soundfile",
        "yaml": "pyyaml", "jaconv": "jaconv"})
'''),
    code('''
# モデルのダウンロード（済んでいれば飛ばす）
subprocess.run(["bash", str(PROJECT / "scripts" / "download_models.sh")], check=True)
'''),
    code('''
subprocess.run([sys.executable, "scripts/compare_tts.py"], cwd=PROJECT, check=True)
subprocess.run([sys.executable, "scripts/score_tts_quality.py"], cwd=PROJECT)
print((PROJECT / "reports" / "audio_comparison.md").read_text())
'''),
])

gen = nb([
    md('''
# 音声生成ノートブック（Kaggle GPU / CPU）

**目的**：台本の全セリフを、セリフ単位で合成する。止まっても続きから再開でき、変更したセリフだけを作り直す。

- 入力：`script/dialogue.json`（台本）, `config/voice_config.yaml`（声の設定）／出力：`audio/raw/*.wav`, `audio/raw/manifest.json`, `logs/generate_audio.jsonl`
- GPU があれば `--device cuda` で合成する。**GPU が使えない場合**は自動で CPU を使う
- **セッション切断への対策**：manifest を1行ごとに保存する。再接続したら同じセルをもう一度実行すれば、生成済みの行は飛ばされる。
  セッションが終わる前に、最後のセルで `/kaggle/working/gene_quest_audio.zip` を作り、Output からダウンロードする
- **エラー時**：特定の行だけ失敗した場合は `--line SC0302-03 --force` でその行だけ作り直す
- API キーは不要。認証が必要なサービスを使う場合も、ノートブックに直接書かず Kaggle の Secrets を使う
'''),
    code(COMMON_SETUP),
    code('''
ensure({"style_bert_vits2": "style-bert-vits2", "kokoro_onnx": "kokoro-onnx", "misaki": "misaki[ja]", "fugashi": "fugashi",
        "unidic_lite": "unidic-lite", "pyloudnorm": "pyloudnorm", "soundfile": "soundfile", "yaml": "pyyaml", "jaconv": "jaconv"})
subprocess.run(["bash", str(PROJECT / "scripts" / "download_models.sh")], check=True)
'''),
    code('''
try:
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    device = "cpu"
print("device:", device)
r = subprocess.run([sys.executable, "scripts/generate_audio.py", "--device", device], cwd=PROJECT)
print("exit", r.returncode)
'''),
    code('''
# 仕上げ（音量・EQ）とタイムラインは CPU で十分
subprocess.run([sys.executable, "scripts/process_audio.py"], cwd=PROJECT, check=True)
subprocess.run([sys.executable, "scripts/build_timeline.py"], cwd=PROJECT, check=True)
'''),
    code('''
if ON_KAGGLE:
    shutil.make_archive("/kaggle/working/gene_quest_audio", "zip", PROJECT, "audio")
    print("→ /kaggle/working/gene_quest_audio.zip を Output からダウンロード")
'''),
])

out = ROOT / "notebooks"
out.mkdir(exist_ok=True)
for name, n in (("environment_check.ipynb", env_check), ("audio_comparison.ipynb", audio_cmp), ("kaggle_audio_generation.ipynb", gen)):
    (out / name).write_text(json.dumps(n, ensure_ascii=False, indent=1), encoding="utf-8")
    print(out / name)

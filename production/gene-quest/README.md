# GENE QUEST — 遺伝情報を読み解け！

講義資料「転写（機構と疾患）」（2026年度 遺伝医学、2026.09.28）をもとにした、約38分（38分14.5秒）の日本語医学教育アニメーションと、その制作システム一式です。
医学部1年生が、アカリ（医学部生）と案内役ヌクの会話を通して、転写・転写調節・RNAプロセシング・非コードRNA・遺伝子発現と疾患を学びます。

学び方の軸は **必然性 × ファインマン法** です。

- **必然性**：仕組みごとに「なぜ、そうでなければならないのか」を問い、講義資料の記載から答える（19か所。画面左上に「なぜ ○○？」の札）
- **ファインマン法**：各章の終わりの「ファインマン・チェック」（7シーン）で、アカリが難しい言葉を使わずに説明し、よくある誤解をヌクが指摘し、アカリが言い直す。最終章では全体を自分の言葉で説明する

制作指示の「約30分」に対し、この取り込みで約38分になりました（v2 は30分32.9秒。内訳は `reports/production_report.md` の 2a.）。

| 成果物 | 場所 |
|---|---|
| 完成動画（1920×1080・30fps・H.264/AAC・字幕焼き込み＋字幕トラック） | `video/final/gene_quest_full.mp4`（容量の都合で git には入れない。再生成は下記）／配布用の軽量版 `video/final/gene_quest_full_720p.mp4` |
| 30秒の試作 | `video/previews/prototype_30s.mp4` |
| 日本語字幕 | `subtitles/gene_quest.srt`（焼き込み用 `gene_quest.ass`、対応表 `captions.json`） |
| 全編の脚本 | `script/master_script.md`（原稿の一次情報は `script/source_script.md`） |
| シーン構成表 | `script/scene_manifest.json`、タイミング `script/timeline.json`、セリフ `script/dialogue.json`、クイズ `script/quiz.json` |
| 医学用語の読み方辞書 | `config/pronunciation_dictionary.yaml` |
| キャラクター設定資料 | `characters/character_bible.md`、設定画 `characters/references/*.png` |
| 医学的正確性の確認表 | `research/accuracy_checklist.md`（講義資料の解析 `research/lecture_summary.md`、ページ対応 `research/page_mapping.csv`、重要用語 `research/key_terms.md`） |
| 報告書 | `reports/production_report.md`、`reports/audio_quality_report.md`、`reports/medical_accuracy_report.md`、比較 `reports/audio_comparison.md`、発音確認 `reports/pronunciation_check.md` |
| Kaggle Notebook | `notebooks/environment_check.ipynb`、`audio_comparison.ipynb`、`kaggle_audio_generation.ipynb` |

## 制作環境（実際に使ったもの）

- Linux（4コア CPU、メモリ 15 GB、GPU なし）。全工程を CPU だけで実行した
- Python 3.13（描画・合成）と Python 3.11（音声合成。`uv` で作成）
- FFmpeg（libx264, AAC, libass）
- 描画：skia-python（2D ベクター描画。3D の二重らせんは自前の透視投影）
- 音声合成：Style-Bert-VITS2 2.5.0（JVNV コーパスモデル・小春音アミモデル）、Kokoro-82M（kokoro-onnx 0.6.1）
- 評価：faster-whisper（small）、torchaudio SQUIM、pyworld、pyloudnorm

評価したが使わなかったもの（理由は `reports/production_report.md`）：edge-tts（この環境のプロキシが WebSocket を通さず接続不可）、Blender（GPU なしで30分の3Dレンダリングは非現実的）、OpenToonz／Krita（手描きの作画工程が必要で自動化に向かない）、DeepFilterNet（合成音声のノイズフロアが中央値 −71.8 dBFS で、ノイズ除去が不要）、画像生成AI（キャラクターの一貫性を保証できない）。

## インストール

```bash
cd production/gene-quest
# 描画・合成用（Python 3.10 以上）
python3 -m venv .venv && . .venv/bin/activate
pip install skia-python numpy scipy soundfile pyyaml pyloudnorm pillow
deactivate
# 音声合成用（Python 3.11 推奨。3.13 では一部の依存がビルドできない）
uv venv -p 3.11 .venv-tts && . .venv-tts/bin/activate
uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
uv pip install style-bert-vits2 kokoro-onnx "misaki[ja]" fugashi unidic-lite faster-whisper pyloudnorm soundfile pyyaml jaconv pyworld-prebuilt
uv pip uninstall unidic          # フル版 unidic があると MeCab の初期化に失敗する
deactivate
# Linux で skia が libEGL を要求する場合： apt-get install libegl1
bash scripts/download_models.sh   # 音声モデル（約3.5 GB、HuggingFace）
bash scripts/download_music.sh    # BGM 12曲（incompetech.com）
```

## 実行方法（全編を作る）

```bash
.venv-tts/bin/python scripts/build_script.py       # 原稿 → dialogue.json / scene_manifest.json（読みに英字が残ると停止）
.venv-tts/bin/python scripts/generate_audio.py     # セリフ単位の音声合成（約8分、再開可能）
.venv/bin/python scripts/process_audio.py          # 無音トリム・EQ・音量（必要な行だけ）
.venv/bin/python scripts/build_timeline.py         # 実際の音声の長さからタイムライン（全編の尺を表示）
.venv/bin/python scripts/make_subtitles.py         # SRT / ASS / captions.json
.venv/bin/python scripts/make_sfx.py               # 効果音（合成）
.venv/bin/python scripts/mix_audio.py              # セリフ＋BGM（ダッキング）＋効果音 → −16 LUFS
.venv/bin/python scripts/generate_scene.py         # 57シーンを描画（4並列で約20分）
.venv/bin/python scripts/assemble_video.py         # 連結・字幕焼き込み・書き出し・検証
.venv/bin/python scripts/export_docs.py            # 脚本・確認表などの資料を更新
.venv/bin/python scripts/progress.py               # 進捗（成果物から判定）
```

試作：`.venv/bin/python scripts/make_prototype.py`。確認用の静止画：`.venv/bin/python scripts/still.py SC0302 --grid 6`。

## 音声の生成と修正

- 原稿 `script/source_script.md` を直し、`build_script.py` → `generate_audio.py` を実行すると、**読み・声の設定・感情が変わった行だけ**が作り直される（行ごとのハッシュ）
- 読み違いは、`config/pronunciation_dictionary.yaml` に追加するか、原稿の行に `{say=よみ}` を付ける。字幕は正式な表記のまま
- 必然性の問いは、原稿の行に `{why=問い}` を付ける（？で終わる行は、次の行＝答えの終わりまで札を出す）
- ファインマン・チェックのシーンは `- visual: feynman_check` とし、板書を `- card_title / card_try / card_wrong / card_gap / card_fix` で書く。セリフに `cue=try`, `cue=gap`, `cue=fix` を付けると、板書がそのセリフに合わせて現れる
- 1行だけ作り直す：`generate_audio.py --line SC0302-03 --force`
- 声の割り当ては `config/voice_config.yaml`（キャラクターごとにモデル・話速・高さ・抑揚）
- 発音の確認：`.venv-tts/bin/python scripts/check_pronunciation.py`（Whisper で書き起こし、かな換算の誤り率を出す）

## Kaggle の利用

1. このフォルダ（`models/` と `.venv*` を除く）を Kaggle の Dataset「gene-quest」としてアップロードする
2. `notebooks/kaggle_audio_generation.ipynb` を Kaggle で開き、右の Settings で Accelerator を GPU、Internet を On にして上から実行する（Kaggle へのログインと電話番号認証は利用者本人の操作が必要）
3. 最後のセルの `/kaggle/working/gene_quest_audio.zip` を Output からダウンロードし、このフォルダに展開する
- GPU が使えないときは自動で CPU を使う。セッションが切れても、もう一度実行すれば生成済みの行は飛ばされる
- GPU の利用枠には週あたりの上限がある。上限やセッション時間の制限を回避する使い方はしないこと
- このノートブックは**ローカル（CPU）でのみ実行を確認した**。Kaggle 上では未検証（README 末尾「既知の制限」）

## 動画の再生成・失敗した処理の再実行

- 映像は、シーンの台本・タイミング・そのシーンの描画コードが変わったシーンだけ作り直される（`video/scenes/status.json`）。`generate_scene.py --list` で状態一覧、`--force SC0605` で強制
- 1シーンの失敗では全体は止まらない。もう一度 `generate_scene.py` を実行すると、未完成のシーンだけが描画される
- ログ：`logs/generate_audio.jsonl`（行ごとの実行時刻・モデル・入出力・処理時間・成否）、`logs/render.jsonl`
- 音声と映像の長さがずれた場合、`assemble_video.py` はシーンのフレーム数とタイムラインを照合して停止する（切り詰めや無音で隠さない）

## ファイルの保存先

```
config/        設定（作品・声・読み方辞書）       research/   講義資料の解析・ページ対応・正確性確認表
script/        原稿・台本・タイムライン・クイズ    characters/ キャラクター設定と設定画
source/        講義資料PDF                         assets/     フォント・効果音・BGM（BGM はダウンロード）
audio/         raw（合成そのまま）→ processed（仕上げ）→ dialogue（シーン別）→ final（ミックス）、comparison（比較）
video/         scenes（シーン別）→ final（完成版）、previews（試作・静止画）
subtitles/     字幕                                 scripts/    再実行用スクリプト（gqlib/ は描画・音声の共通部品）
notebooks/     Kaggle 用                            reports/    報告書
```

## ライセンスと利用上の注意

| 素材 | 出典・ライセンス |
|---|---|
| 医学的内容 | 講義資料「転写（機構と疾患）」（熊本大学大学院生命科学研究部 分子遺伝学）。資料の図そのものは映像に使わず、内容を模式図として描き直した。教育目的の利用を想定。講義資料の再配布の可否は資料の作成者に確認すること |
| 音声モデル | Style-Bert-VITS2（AGPL-3.0、litagin02）。JVNV コーパスモデル（CC BY-SA 4.0）。小春音アミモデル（あみたろの声素材工房の規約に従う。クレジット表記「Style-BertVITS2モデル：小春音アミ、あみたろの声素材工房（https://amitaro.net/）」が必要。生成音声を本人の声として扱わない）。Kokoro-82M（Apache-2.0）。BERT：ku-nlp/deberta-v2-large-japanese-char-wwm（CC BY-SA 4.0） |
| BGM | Kevin MacLeod（incompetech.com）"Lightless Dawn" "Floating Cities" "Investigations" "Hyperfun" "Deliberate Thought" "Movement Proposition" "Inspired" "Life of Riley" "Dreams Become Real" "Clean Soul" "Thinking Music" "Wholesome" — Licensed under Creative Commons: By Attribution 4.0 License（http://creativecommons.org/licenses/by/4.0/） |
| 効果音 | `scripts/make_sfx.py` で合成（オリジナル） |
| フォント | M PLUS Rounded 1c、Zen Kaku Gothic New（SIL Open Font License 1.1） |
| キャラクター・映像 | オリジナル（実在の作品・人物・声優に似せていない） |

指示書で第一候補とされた `pmplabs/Style-Bert-VITS2` は、この環境から GitHub のページを開けず確認できなかった。PyPI の `style-bert-vits2` のメタデータが示す公式リポジトリは `litagin02/Style-Bert-VITS2` で、こちらを使った。

## 既知の制限

- 全編を人の目と耳で通して視聴・聴取していない。確認は、全編の静止画（約15秒ごと）、書き起こし（Whisper）、客観指標、技術検証による（詳細は報告書）
- キャラクターは胸像と浮遊キャラクターの2D描画で、全身の動きや口形（母音ごとの口の形）はない。口は音量で開閉する
- 3D は自前の透視投影による二重らせんのみ。分子の多くは2.5Dの模式図
- Kaggle Notebook は Kaggle 上では未実行（ローカルの CPU で実行を確認）
- edge-tts（Microsoft の音声）はこの環境から接続できず、比較に含められなかった

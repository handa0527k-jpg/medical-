# 『人体は巨大な街だった！ 支持組織の秘密を探れ！』

〜 体を支え、つなぎ、守り、未来をつくる 〜

医学部1年生向け・組織学「支持組織」の2Dアニメーション授業（ANIME MEDICAL STUDIO）。
主人公の **蒼井 俊**（医学部1年生）と案内役の AI ガイド **サポちゃん** が「人体シティ」を冒険しながら、講義資料（2026 第6回 組織学総論「支持組織」）の内容を、たとえ話と正しい医学用語の両方で学びます。

| | |
|---|---|
| 長さ | 32分34秒（10シーン・239セリフ・字幕394枚） |
| 映像 | 1920×1080・30fps・H.264（Canvas で1コマずつ描画、全58,600コマ） |
| 音声 | Style-Bert-VITS2（JVNV の4話者モデル）で全セリフを収録、AAC |
| 音楽 | シーン別のオリジナル BGM 13曲＋効果音24種（すべてプログラムで合成） |
| 字幕 | 画面下の帯に話者名つきで表示（焼き込み）＋ SRT ＋ MP4 内の日本語字幕トラック |

## 成果物

| 指示書の成果物 | 場所 |
|---|---|
| 1. 完成した MP4 動画 | `output/medical_support_tissue.mp4`（全編1本・1920×1080・30fps・H.264 2パス・AAC 128k・日本語字幕トラック・95 MiB。GitHub の1ファイル100 MiB 制限に収めた版） |
| 2. 各シーンのアニメーション素材 | 絵のコード `render/js/scenes/s01.js`〜`s10.js`、代表カット `output/stills/`、シーン別の高画質動画 `output/scenes/s01.mp4`〜`s10.mp4`（CRF 23・合計367 MB。全編1本より画質が高いので、授業ではこちらも使えます） |
| 3. キャラクター素材 | `assets/characters/`（透過 PNG：俊・サポちゃんの8表情、細胞・線維など15種、素材シート3枚）、描画コード `render/js/chars.js` |
| 4. ナレーションと台詞の音声 | `audio/narration/<scene>/`（先生）、`audio/dialogue/<scene>/`（俊・サポちゃん・細胞たち）。1セリフ1ファイル |
| 5. BGM・効果音 | `assets/music/*.mp3`（13曲）、`assets/sound_effects/*.mp3`（24種） |
| 6. 字幕ファイル | `subtitles/medical_support_tissue.srt` |
| 7. 制作コード | `tools/`（音声・タイムライン・作曲・効果音・ミックス・書き出し）、`render/`（描画エンジン） |
| 8. 再生成手順の README | このファイル |
| （追加）医学的正確性の確認 | `MEDICAL_CHECK.md` |
| （追加）台本 | `script/script.txt`、クイズ `script/quiz.json` |

## シーン構成

| # | シーン | 開始 | 長さ | セリフ | BGM（キュー名） |
|---|---|---|---|---|---|
| 1 | 人体シティへようこそ！ | 0:00 | 2.7分 | 25 | adventure：壮大で明るい冒険（ブラス・弦・グロッケン・マーチ） |
| 2 | 支持組織の街づくり会社 | 2:40 | 2.7分 | 19 | pop：軽快なピアノとギター |
| 3 | 人体を支える4つの仕事 | 5:19 | 2.1分 | 20 | support（安定したオーケストラ）→ exchange（流れる電子音＋ピアノ）→ defense（速いアクション）→ storage（穏やか）→ support |
| 4 | 不思議なゼリーの正体 | 7:24 | 2.5分 | 20 | mystic：リディアの和音のパッドとベル、ピアノ |
| 5 | コラーゲン製造工場 | 9:53 | 3.0分 | 25 | factory：4つ打ちと金属音、ブラス |
| 6 | 3種類の線維を見分けろ！ | 12:54 | 2.4分 | 16 | rock：歪んだパワーコードとロックドラム |
| 7 | 結合組織の住人たち | 15:18 | 5.2分 | 28 | comic：ピチカートとウッドブロック、ファゴット風のベース |
| 8 | 基底膜の秘密 | 20:28 | 3.1分 | 20 | calm：ピアノとストリングス |
| 9 | 脂肪細胞のエネルギー倉庫 | 23:33 | 3.9分 | 25 | acoustic：アコースティックギターのアルペジオとピアノ |
| 10 | 最終試験！ 支持組織の秘密を解き明かせ | 27:26 | 5.1分 | 41 | climax：オーケストラと軽快なドラム（8問のクイズ → エンディング） |

各シーンの頭にタイトルカード、終わりは白へのフェードとBGMのフェードアウトでつなぎ、場面転換で音が急に切れないようにしています。セリフの間は BGM を自動で 11 dB 下げます（ダッキング）。全体の音量は約 −14 LUFS。

## 登場人物と声

| 役 | 声（Style-Bert-VITS2 JP-Extra） | 設定 |
|---|---|---|
| 蒼井 俊 | jvnv-M2-jp（感情スタイルをセリフの表情に合わせる） | 黒髪・青い瞳・白衣・リュック。疑問を持ち、間違え、理解していく |
| サポちゃん | jvnv-F1-jp（Happy 中心） | 白と水色のフード・水色の髪・大きな青い瞳・光るAIの宝石 |
| 先生（ナレーション） | jvnv-M1-jp（Neutral、ややゆっくり） | 要点と試験ポイントを整理 |
| 線維芽細胞（建築職人）／膠原線維（ロープ） | jvnv-M1-jp（Happy／Angry） | ピンクの星形の細胞・赤いロープ |
| マクロファージ（警備員）／褐色脂肪細胞（ヒーター） | jvnv-M2-jp（Angry／Happy） | 空豆形の核と突起／多胞性脂肪滴とミトコンドリア |
| 形質細胞（工場長）／肥満細胞（警報係）／細網線維（網）／白色脂肪細胞（タンク） | jvnv-F2-jp | 車軸核／顆粒／黒い網／単胞性脂肪滴 |
| 弾性線維（バネ） | jvnv-F1-jp（Happy） | 伸び縮みするコイル |

キャラクターは参考画像の配色と雰囲気をもとに Canvas の図形で描き直したオリジナルです（参考画像の崩れた文字は使っていません。画面の日本語はすべて M PLUS Rounded 1c で正確に描画）。体・腕・頭・目・口・眉・髪・小物を分けて描き、まばたき、声の音量から作る口パク、腕のポーズ、表情、歩き、浮遊、呼吸を付けています。

## 作り方（再生成）

### 1. 準備（一度だけ）

```bash
# Node（描画と書き出し）：リポジトリ直下で
npm ci                                      # @playwright/test（Chromium は /opt/pw-browsers/chromium を使う）

# Python（BGM・効果音・ミックス）
pip install numpy scipy mutagen

# Style-Bert-VITS2（CPU で動く）
python3.11 -m venv .venv-sbv2                # 3.13 だと pyopenjtalk のビルドに失敗する
.venv-sbv2/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
CMAKE_POLICY_VERSION_MINIMUM=3.5 .venv-sbv2/bin/pip install style-bert-vits2 "numpy<2" scipy librosa faster-whisper
.venv-sbv2/bin/python - <<'EOF'              # JVNV モデル（4話者・各240MB）を .sbv2/models に
from huggingface_hub import hf_hub_download
for spk, f in [('jvnv-F1-jp','jvnv-F1-jp_e160_s14000.safetensors'), ('jvnv-F2-jp','jvnv-F2_e166_s20000.safetensors'),
               ('jvnv-M1-jp','jvnv-M1-jp_e158_s14000.safetensors'), ('jvnv-M2-jp','jvnv-M2-jp_e159_s17000.safetensors')]:
    for x in ['config.json', 'style_vectors.npy', f]:
        hf_hub_download('litagin/style_bert_vits2_jvnv', f'{spk}/{x}', local_dir='.sbv2/models')
EOF
```

注意：
- CMake 4 では pyopenjtalk-dict のビルドが止まるため `CMAKE_POLICY_VERSION_MINIMUM=3.5` が必要です。
- pyopenjtalk が numpy 1 系でビルドされるため `numpy<2` に固定します。
- 新しい transformers は BERT を fp16 で読み込むので、`tools/tts.py` は読み込み後に `.float()` で float32 に戻しています。

### 2. 全部つくる

```bash
cd production/support-tissue
tools/build.sh          # 台本 → 音声 → タイムライン・字幕 → BGM → 効果音 → ミックス → 描画チェック → 映像（4並列）→ 結合 → 配布用に圧縮
tools/build.sh --video  # 音はそのままで、映像だけ作り直す（output/scenes/ にあるシーンはスキップ。作り直すシーンの mp4 を消してから）
```

所要時間の目安（4コア CPU・GPU なし）：音声の録音 約20分（初回のみ。以後は変わった文だけ）、BGM 約1.5分、映像 約30分（4並列で毎秒約35コマ）、配布用の2パス圧縮 約15分。

### 3. 部分ごとに

```bash
python3 tools/parse_script.py                 # script/script.txt → build/script.json（文分け・字幕チャンク・読み）
../../.venv-sbv2/bin/python tools/tts.py      # 録音（--only s03 で1シーン）
../../.venv-sbv2/bin/python tools/check_voice.py   # 音声認識で読み違いを検査（カナで比較）
python3 tools/timeline.py                     # 時刻表・字幕
python3 tools/music.py [--demo 30]            # BGM（--demo で各曲30秒の試聴版）
python3 tools/sfx.py && python3 tools/mix.py [s03]
node tools/check_frames.mjs 0.5               # 全シーンを0.5秒ごとに描いてエラー検出
node tools/render.mjs s03 [--from 10 --to 20] # 1シーン（の一部）を書き出し
tools/sheet.sh s03 out.png 10 40 80           # 静止画を並べた確認シート
node tools/serve.mjs                          # ブラウザで確認：/render/index.html?scene=s03&t=40（&play=1 で音つき再生）
node tools/export_assets.mjs                  # キャラクター・背景・代表カットを書き出し
python3 tools/encode_release.py --mb 94       # 配布用 MP4（容量指定の2パス）
```

### 台本の書き方

`script/script.txt` の1行が1セリフです。

```
@scene s05 | コラーゲン製造工場 | factory
nar.normal: 第1工程。粗面小胞体で、α鎖が合成されます。  ‖ label=st1 sfx=clank
@bgm exchange        … 次のセリフから曲を替える
@think 5             … クイズの考える時間（無音・時計の音）
```

`label` はそのセリフが始まる時刻の名前で、絵（`render/js/scenes/*.js`）は `S.on('st1')`・`S.p('st1', 0.8)` のようにラベル基準で動きます。声を録り直して長さが変わっても、絵と音はずれません。
読み（音声合成用）は `tools/readings.py` の辞書で字幕テキストから自動変換します（細網＝さいもう、疎性＝そせい、密性＝みっせい、鍍銀＝とぎん、翼細胞＝よくさいぼう、好中球＝こうちゅうきゅう、血中＝けっちゅう、α鎖＝アルファさ など、pyopenjtalk の誤読を確認して登録）。

## 仕組み

```
script/script.txt ──parse_script.py──▶ build/script.json ──tts.py（Style-Bert-VITS2）──▶ .sbv2/cache/*.wav, build/voice.json, audio/**/*.mp3
                                                                     │
                                         timeline.py ◀───────────────┘ ──▶ render/data/timeline.json, subtitles/*.srt
music.py ──▶ build/music/*.wav, assets/music/*.mp3      sfx.py ──▶ build/sfx/*.wav, assets/sound_effects/*.mp3
mix.py（声・BGM のダッキング・効果音）──▶ build/mix/sNN.wav
render/index.html + js/（main・core・chars・bg・tissue・scenes/sNN）──render.mjs（Chromium → JPEG → ffmpeg）──▶ output/scenes/sNN.mp4
build.sh：シーンを結合（再エンコードなし）＋字幕トラック ──▶ output/medical_support_tissue_master.mp4 ──encode_release.py──▶ output/medical_support_tissue.mp4
```

- 描画はすべて「時刻 t の純関数」です（乱数も種つき）。コマを並列・順不同に描いても結果は同じになります。
- 文字はすべて M PLUS Rounded 1c（`assets/fonts/`、SIL Open Font License 1.1）で描画します。
- 画面の「たとえ」札（橙）・「医学」札（緑）・「講義資料の表記」札（灰）・「試験ポイント」札（赤）で、たとえ話と医学的事実を区別しています。

## Kaggle について

この環境には Kaggle の認証情報（`~/.kaggle/kaggle.json` または `KAGGLE_USERNAME`/`KAGGLE_KEY`）がなかったため、Kaggle の GPU は使っていません。すべて CPU（4コア）で完結します。
音声合成を速くしたい場合は、`tools/tts.py`・`tools/voices.json`・`build/script.json`・`.sbv2/models` を Kaggle Notebook にアップロードし、`device='cuda'` に変えて実行すると、`.sbv2/cache/*.wav` と `build/voice.json` が得られます（それを戻して `timeline.py` 以降を実行）。

## 素材とライセンス

| 素材 | 出典・ライセンス |
|---|---|
| 医学的内容 | 2026 第6回 組織学総論「支持組織」講義資料（一次資料）。照合結果は `MEDICAL_CHECK.md` |
| 声 | Style-Bert-VITS2（litagin02、AGPL-3.0 のソフトウェアを制作ツールとして使用）＋ JVNV モデル `litagin/style_bert_vits2_jvnv`（CC BY-SA 4.0、JVNV コーパス由来）。生成した音声は CC BY-SA 4.0 の表示・継承の条件に従って扱ってください（クレジット：Style-Bert-VITS2 / JVNV） |
| BGM・効果音 | 本作のためのオリジナル。外部の音源・サンプルは使わず `tools/music.py`・`tools/sfx.py` の加算合成で生成。既存のアニメ・映画の楽曲は使っていません |
| キャラクター・背景 | 本作のためのオリジナル（参考画像の配色・雰囲気をもとに Canvas の図形で描画） |
| フォント | M PLUS Rounded 1c（M+ FONTS PROJECT、SIL Open Font License 1.1） |

## 確認したこと

- 全シーンを0.25秒ごとに描画し、描画エラーがないことを確認（`tools/check_frames.mjs`）。
- 録音した388文を音声認識（faster-whisper small）で書き起こし、意図した読みとカナで比較（平均一致率 0.92）。一致率の低い文を1つずつ見て、本当の誤読（血中・α鎖・GAG鎖）は読み辞書を直して録り直し。残りは同音異字や専門用語を音声認識が書き違えたもの。
- 完成した MP4 は ffprobe で長さ（32:34）・映像（1920×1080・30fps）・音声（AAC）・字幕トラック（jpn）を確認し、全編をデコードしてエラーがないことを確認。
- 書き出した動画からコマを取り出し、絵・字幕・セリフが合っていることを目で確認。全体のラウドネスは約 −14 LUFS。
- 全編1本の配布版は容量の都合で画質を落としています（高画質版との SSIM 約0.84）。高画質の全編は `tools/build.sh` が `output/medical_support_tissue_master.mp4`（367 MB、git には入れない）として作ります。シーン別の高画質版を順に再生しても同じ内容です。

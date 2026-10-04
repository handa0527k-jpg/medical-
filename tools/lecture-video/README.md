# MEDSTUDY 授業動画：Windows 側ツール

MEDSTUDY の「遺伝学 › 🎬 授業動画」が書き出す制作パッケージを、Windows 上の各ツールで動画にします。

| 担当 | 役割 | 実行場所 |
|---|---|---|
| **MEDSTUDY** | 教材を解析し、授業構成・シーン・台本（タイムコード付き）・医学図（SVG）・Wan 2.2 プロンプト・ComfyUI 設定・Kokoro 台本・FFmpeg 編集表を作る | ブラウザ |
| **Kokoro** | 日本語の講師音声（WAV）と、区間ごとの実測の長さ | Windows（CPU で動く） |
| **ComfyUI** | Wan 2.2 の生成ワークフローを管理する | Windows（GPU） |
| **Wan 2.2** | 映像の生成（動き・光・カメラ・質感）。文字や正確な構造は描かせない | Windows（GPU） |
| **FFmpeg** | 背景の映像、医学図レイヤー、字幕、講師音声、効果音、BGM を統合する | Windows |

> MEDSTUDY（ブラウザ）は ComfyUI・Wan 2.2・Kokoro・FFmpeg を実行しません。それぞれに渡す設定を作るだけです。
> ここにあるツールが、その設定どおりに各ツールを動かします。
> 将来ローカルサーバー経由でつなぐ場合も、同じパッケージ形式（`medstudy_video.json`）をそのまま使えます。

## 1. 準備（初回だけ）

```bat
:: Python 3.10 以上
pip install kokoro-onnx misaki pyopenjtalk soundfile numpy requests

:: Kokoro のモデルを tools\lecture-video\models\ に置く
::   kokoro-v1.0.onnx / voices-v1.0.bin
::   https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0

:: FFmpeg（libass 入りのビルド。例：https://www.gyan.dev/ffmpeg/builds/ の full）を PATH に通す
```

**ComfyUI と Wan 2.2**：モデルは ComfyUI の公式 Wan 2.2 テンプレートと同じものを、同じ場所に置きます（入手先は https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged ）。

| プロファイル | 置くファイル |
|---|---|
| `ti2v-5b`（軽量・24fps・1280×704・最大121フレーム） | `diffusion_models/wan2.2_ti2v_5B_fp16.safetensors`、`vae/wan2.2_vae.safetensors`、`text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors` |
| `i2v-14b`（高品質・16fps・1280×720・最大81フレーム） | `diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors`、`diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors`、`vae/wan_2.1_vae.safetensors`、`text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors`（`--fast` を使う場合は `loras/wan2.2_i2v_lightx2v_4steps_lora_v1_{high,low}_noise.safetensors` も） |

- ワークフロー（`comfy/<プロファイル>/*.api.json`）は ComfyUI の API 形式です。ComfyUI に読み込んで中身を確認することもできます。
- ノード構成と設定値は公式テンプレートに合わせています。
  - 14B：`WanImageToVideo` と `KSamplerAdvanced` の2段（高ノイズ／低ノイズ）、shift 5。
  - 5B：`Wan22ImageToVideoLatent`、shift 8、20ステップ、cfg 5、uni_pc。
- 出力は `SaveWEBM`（vp9）です。

## 2. 1本の動画を作る流れ

同期のため、音声を先に確定させます。

講師が「DNAを加えたときだけ」と言った瞬間に皿へ急接近する、といった出来事の時刻は、Kokoro の実測の発話時刻から決まります。

1. **MEDSTUDY**：遺伝学 › 🎬 授業動画 で教材・テーマ・時間・スタイル・強度を選び、「制作パッケージ（ZIP）」を保存して展開する。
2. **Kokoro**：次を実行する。`audio\S01.wav …` と `audio\kokoro_timing.json`（区間ごとの実測の長さ）ができる。
   ```bat
   python tools\lecture-video\medstudy_video.py tts C:\work\pkg
   ```
3. **MEDSTUDY**：「Kokoro タイミングを読み込む」で `audio\kokoro_timing.json` を選ぶ。
   - 画面の表示が「音声：Kokoro（実測タイミング）」に変わり、映像の出来事が実際の発話時刻に合う。
   - 続けて「パッケージ＋医学図レイヤー（PNG連番）」を保存し、同じフォルダに上書きで展開する。
   - これでキーフレーム、Wan のフレーム数、字幕、編集表が確定する。
   - 代わりに Node.js で次を実行してもよい（MEDSTUDY を `npx vite` で起動しておく）。
     ```bat
     node scripts\lecture-video\render-layers.mjs C:\work\pkg
     ```
4. **ComfyUI × Wan 2.2**：ComfyUI を起動してから、次を実行する。
   ```bat
   python tools\lecture-video\medstudy_video.py comfy C:\work\pkg --profile ti2v-5b
   ```
   - 各ショットのキーフレームをアップロードし、ワークフローを投入して完了を待ち、`wan\S01_a.webm …` に保存する。
5. **FFmpeg**：次を実行する。完成品は `out\lecture.mp4`。
   ```bat
   python tools\lecture-video\medstudy_video.py sfx C:\work\pkg
   python tools\lecture-video\medstudy_video.py assemble C:\work\pkg [--bgm music.mp3]
   ```
6. **MEDSTUDY**：「Windows で作った完成動画（MP4）を再生」で `out\lecture.mp4` を選んで確認する。

`python tools\lecture-video\medstudy_video.py check C:\work\pkg` で、揃っているもの・足りないものを確認できます。

## 3. パッケージの中身

| ファイル | 内容 |
|---|---|
| `medstudy_video.json` | 全体（テーマ、選定理由、シーン、出典、Wan のジョブ、Kokoro の台本、タイミング、編集表） |
| `script.md` | 台本。タイムコード付きで、台詞・カメラ・効果・Wan のプロンプト・効果音を並べる |
| `kokoro/script.json` | Kokoro に読ませる区間。読み（英字はかな）、話速、前後の間、同期する出来事の名前 |
| `comfy/<プロファイル>/*.api.json` | ComfyUI のワークフロー。1ショットに1つ |
| `keyframes/*.png` | 各ショットの開始画像。MEDSTUDY の Wan 層で、文字を含まない |
| `diagrams/*.svg` | 医学図（ベクター） |
| `subtitles.ass` / `subtitles.srt` | 字幕。重要語は黄色・やや大きく表示する。下中央に置き、図は下端を空けて描く |
| `edit.json` | FFmpeg の編集表。24fps の単一タイムライン上に、ショット範囲・効果音の時刻・白黒反転の区間を持つ |
| `timing.json` | 使ったタイミング（推定値か、Kokoro の実測か） |
| `layers/` | `plate_%05d.jpg`（Wan の代わりになるアニマティック）と `overlay_%05d.png`（医学図レイヤー、透過） |

## 4. 合成のしかた（`assemble`）

1. **背景**：ショットごとに、`wan\<ショット>.webm` があればそれを使い、無ければ MEDSTUDY のアニマティックを使う。
   - Wan のクリップは 24fps・1280×720 に変換し、ショットの長さで切る。
   - 「背景」モードのショットは、医学図が読めるように少し暗く・低彩度にする。
2. **医学図レイヤー**：背景の上に重ねる。図・板書・ラベル・講師・劇画の効果線・擬音を含む。
3. **白黒反転**：超劇画のときだけ、`negate` で該当区間を反転する。
4. **字幕**：ASS で焼き込む。フォントは同梱の Zen Kaku Gothic New Bold（SIL OFL、`fonts/OFL.txt`）。
5. **アニマティックの表示**：Wan のクリップがまだ無いショットには、右上に小さく「MEDSTUDY アニマティック（Wan 2.2 生成前）」と出す。`--no-tag` で消せる。
6. **音声**：シーンの WAV をつないだもの（その長さがタイミングそのもの）に、効果音を指定の時刻で加える。
   - BGM は任意で、声の大きさに合わせて自動で下げる。
   - 効果音は外部素材を使わず、ノイズと正弦波から合成する（`sfx`）。

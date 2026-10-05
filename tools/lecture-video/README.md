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
pip install kokoro-onnx misaki fugashi unidic-lite jaconv mojimoji pyopenjtalk soundfile numpy requests

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
   - `--sub-band` を付けると、絵を 87.5% に縮めて上に置き、下の黒い帯に字幕を出す。図の下端の文字と字幕が重ならない（完成版はすべてこれで組んでいる）。
5. **アニマティックの表示**：Wan のクリップがまだ無いショットには、右上に小さく「MEDSTUDY アニマティック（Wan 2.2 生成前）」と出す。`--no-tag` で消せる。
6. **音声**：シーンの WAV をつないだもの（その長さがタイミングそのもの）に、効果音を指定の時刻で加える。
   - BGM は任意で、声の大きさに合わせて自動で下げる。
   - 効果音は外部素材を使わず、ノイズと正弦波から合成する（`sfx`）。

## 6. 講師音声を自然に聞かせるための工夫（`tts`）

| 工夫 | 内容 |
|---|---|
| **Kokoro が学習した音素で読ませる** | Kokoro の日本語ボイスは、misaki の標準 G2P（cutlet＋UniDic）の音素で学習されています。<br>pyopenjtalk 版の音素は記号体系が違う（う＝ɯ、き＝kʲi など）ため、cutlet 版を優先します。<br>`fugashi` と `unidic-lite` が無いときだけ、pyopenjtalk 版に切り替えます。 |
| **文ごとに一息で読ませる** | 台本の区間（同期の目印）ごとに合成すると、毎回イントネーションが文末調に戻ってしまいます。<br>そこで文単位で一度に合成し、読点で自然にできる間（無音）で区間に切り分けます。<br>切った長さがそのまま実測タイミングになります。 |
| **列挙は1語ずつ** | 「DNA、RNA、脂質、タンパク質、炭水化物」のような短い列挙語は間が短く、正確に切れません。<br>そのため1語ずつ読ませます（列挙らしい読み方になります）。 |
| **重要語の前の間** | 台本の `pre` / `post`（例：「DNAを加えたときだけ」の前に 0.15 秒）を足します。 |
| **話速** | 完成版は 1.0（自然な講義の速さ）、30秒・60秒版は 1.08 です。 |
| **仕上げ** | 70 Hz 以下の低域カット、軽いコンプレッション、0.25 秒ほどのごく短い室内の残響、音量の正規化を行います。`--raw` で仕上げを外せます。 |

**確認方法**：Whisper（small）で文字起こしし、台本との文字誤り率（かな換算）を比べました。

| 条件 | 誤り率 |
|---|---|
| 以前の方式（pyopenjtalk 音素・区間ごとに合成） | 21.0% |
| 今の方式・30秒版 | 9.0% |
| 今の方式・第1講の完成版（4分20秒） | 5.9% |
| 今の方式・第2講の完成版（6分3秒、英字と数字が多い） | 10.3% |
| 今の方式・第3講の完成版（7分26秒） | 7.3% |
| 今の方式・第4講の完成版（6分57秒、英字の略語が多い） | 10.6% |
| 今の方式・第5講の完成版（7分52秒、コドン・ALDH など英字が多い） | 9.4% |
| 今の方式・第6講の完成版（6分36秒） | 5.6% |

## 7. 時間のかかるレンダリングを短くする

Wan のクリップがまだ1つも無い作品は、医学図レイヤーと背景を分けて書き出す必要がありません。

```bat
node scripts\lecture-video\render-layers.mjs C:\work\pkg --full
```

`--full` を付けると合成済みのフレーム（`layers\full_%05d.jpg`）だけを書き出し、`assemble` はそれをそのまま使います。

Wan のクリップを入れるときは、`--full` を付けずにもう一度レイヤーを書き出してください。

## 8. 講義まるごとの完成版を作る

完成版は講ごとに用意しています（第1講〜第6講）。演出は `src/engine/lecture-video/directions/lectureN.ts`、医学図は `render-film*.ts` にあり、`directions/films.ts` に登録すると授業動画の画面とテストに自動で加わります。パッケージは次のように書き出します。

```bat
npx tsx scripts\lecture-video\export-package.ts --out C:\work\film2 --lecture 2 --section film
node scripts\lecture-video\render-layers.mjs C:\work\film2 --theme genetics-basics:2:film --d full --full
```

あとは 2. の流れ（`tts` → タイミングを読み込んで書き出し直す → `sfx` → `assemble`）と同じです。

## 9. 文字の揺れを防ぐ（フォントの自前配信）

レンダリングは複数のブラウザ（ワーカー）でフレームを分担します。Google Fonts の日本語フォントは文字の範囲ごとに遅れて読み込まれるため、ワーカーによって別の書体で描かれ、つなげると文字や図が1フレームごとに揺れて見えていました。

- 映像で使う文字だけを集めたフォント（Zen Kaku Gothic New・Klee One、OFL）を `public/fonts/` に置き、描画の前に必ず読み込みます。作り直しは `python scripts/lecture-video/build-fonts.py`（台詞や図の文字を変えたら実行）。
- `render-layers.mjs` は開始時に、全ワーカーで同じ3フレームを描いて比べます。1画素でも違えば止まります。

## 10. 動画の置き場所

公開しているサイト（claude.ai の Artifact）は1版あたり256 MiBまでです。教材本体だけで上限に近いため、次のようにして完成版6本を版の中に収めています（合計約236 MB）。

- 完成版の動画は Web 用の 960×540（1本 5.5〜8 MB）。
- 講義音声と完成版の講師音声は 32 kbps・モノラルの mp3（話し声には十分）。

版の外のアセット保存領域（1ファイル20 MiBまで）に動画を置く方法も試しましたが、この機能を使うとページが組織内限定になり、リンクやアプリから開けなくなる場合があったため、使っていません。アプリ側は `/` や `https:` で始まる場所もそのまま読めるので、外部に置く必要が出たときは `lecture-video/index.json` の `file` / `audio` をそのURLに書き換えるだけで切り替えられます。

リポジトリには Web 用の版を `public/lecture-video/` に入れています。元の画質（1280×720、`out/lecture.mp4`）は Git に入れません。

## 11. 講師の声を Microsoft の Neural 音声にする（`revoice_edge.py`）

完成版は、絵をそのままに声だけを edge-tts（Microsoft Neural「ja-JP-KeitaNeural」、24 kHz・96 kbps、この窓口で選べる最高の形式）に差し替えられます。

```bat
python tools\lecture-video\revoice_edge.py production\lecture-video\genetics-basics-6-film
python tools\lecture-video\medstudy_video.py assemble production\lecture-video\genetics-basics-6-film --sub-band --audio-bitrate 192k
```

- 1つの拍（ひと続きの台詞）を一息で読ませ、声の単語タイミングで台詞ごとに切り、Kokoro の台詞が始まっていた時刻にそれぞれ置きます。字幕・カメラ・図の動きはそのまま合います。
- 枠に収まらない拍は少し速く（最大 +40%）、余裕のある拍は少し遅く（最大 −10%）読ませます。音を伸び縮みさせることはしません。
- 元の Kokoro の声は `audio/kokoro_wav/` に残り、`--restore` で戻せます。結果は `audio/edge_report.json`。
- 第6講の文字誤り率（Whisper small）は 6.9%（Kokoro 5.6%）。数字の読みの違いによるもので、聞きやすさは Neural 音声の方が上です。

動画ページ（全6講・再生リスト・チャプター付き）の作り方は `production/lecture-video/films-page/`（`make_film.sh` で各講の MP4 を 1本 14.5 MB 以内・AAC 128 kbps に、`build.py` でページを生成）。

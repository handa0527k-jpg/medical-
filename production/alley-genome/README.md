# 路地裏のゲノム ― 遺伝子工学の夜

講義資料「遺伝子工学」（2026）を一次資料にした、約11分半の学習用アニメーション。
雨の夜の路地裏で、名前のない灰色の猫に導かれた「僕」が、遺伝子工学の道具の化身である六人と出会う。

| 人物 | 正体 | 見た目 | 声 |
|---|---|---|---|
| 僕 | 語り手 | ― | Keita（低め・ゆっくり） |
| キリ | 制限酵素 | 銀髪・白いジャケット・光のハサミ | Keita（+8Hz） |
| ムスビ | DNAリガーゼ | 金髪・グレーのパーカー・金の糸 | Keita（+16Hz） |
| ツムギ | DNAポリメラーゼ | 緑髪の少女・白いパーカー | Nanami |
| ヨミ | シーケンサー | 水色の髪・黒いパーカー | Keita（+24Hz・速め） |
| ハコブ | プラスミド（運び屋） | 焦げ茶の髪・デニムジャケット | Keita（-4Hz） |
| カゲ | Cas9 | 黒髪・橙の目・黒いパーカー | Keita（-16Hz・遅め） |
| 猫 | 匿名 | 細身の灰色・琥珀色の目 | ― |

## 成果物

| ファイル | 内容 |
|---|---|
| `sample/sample_30s.mp4` | 30秒サンプル（冒頭） |
| `chapters/00_rain.mp4` … `10_end.mp4` | 本編を章ごとに分けたもの（1920×1080・24fps・H.264／AAC、字幕は画面に焼き込み）。GitHub の 100 MB 制限のため章で分割 |
| `rojiura_no_genome_full.mp4`（git 外） | 本編まるごと 11分30秒・約290 MB・日本語字幕トラック付き。`chapters/` をつないだもの |
| `final.mp4`（git 外） | 書き出しの原版（約670 MB）。`tools/render.py full` で再生成 |

| 章ファイル | 場面 | 長さ | 大きさ |
|---|---|---|---|
| `chapters/00_rain.mp4` | 雨の路地 | 0:35 | 23 MB |
| `chapters/01_six.mp4` | 六人 | 1:19 | 49 MB |
| `chapters/02_cut.mp4` | 制限酵素の精霊 | 1:15 | 32 MB |
| `chapters/03_tie.mp4` | リガーゼの精霊 | 0:46 | 24 MB |
| `chapters/04_planet.mp4` | プラスミド惑星 | 1:25 | 32 MB |
| `chapters/05_copy.mp4` | 写し取る糸 | 0:37 | 10 MB |
| `chapters/06_pcr.mp4` | 三色の空 | 1:12 | 27 MB |
| `chapters/07_gel.mp4` | 電気泳動の影 | 0:41 | 17 MB |
| `chapters/08_read.mp4` | 読まれる星 | 0:59 | 21 MB |
| `chapters/09_shadow.mp4` | Cas9の影 | 1:45 | 38 MB |
| `chapters/10_end.mp4` | 雨上がり | 0:50 | 16 MB |

## 構成（`timeline.json` の実測時刻）

| 章 | 場面 | 内容 |
|---|---|---|
| ― | 雨の路地（0:00） | 雨、猫、タイトル |
| 壱 | 六人（0:35） | 六人の紹介、1953→1970年代→1985→2004 の年表 |
| 弐 | 制限酵素の精霊（1:54） | GATC、BamHI（G^GATCC）と回文配列、5'突出末端、SmaI（CCC/GGG）の平滑末端、ファージ防御とメチル化 |
| 参 | リガーゼの精霊（3:10） | BamHI と BglII（A^GATCT）の同じ GATC 末端、リン酸ジエステル結合、組換えDNA |
| 肆 | プラスミド惑星（3:57） | ori・アンピシリン耐性遺伝子・MCS、挿入、形質転換と選択、クローニング、発現ベクター、GFP（下村脩）、AAV／アデノ／レトロウイルス |
| 伍 | 写し取る糸（5:22） | mRNA・オリゴdTプライマー・逆転写酵素 → cDNA（イントロンなし） |
| 陸 | 三色の空（6:00） | PCR 95°C変性／55°Cアニーリング／72°C伸長、2のn乗、好熱菌のポリメラーゼ、マリス、リアルタイムPCRとCt値 |
| 漆 | 電気泳動の影（7:12） | リン酸の負電荷で＋極へ、小さい断片ほど速い、臭化エチジウム、VNTR のDNA指紋 |
| 捌 | 読まれる星（7:54） | サンガー法（ddNTP に 3'-OH がない）、キャピラリー、次世代シーケンサー（クラスター・4色・1塩基ずつ） |
| 玖 | Cas9の影（8:54） | ZFN／TALEN、ガイドRNA 20塩基＋PAM（NGG）、PAMの3塩基手前で二本鎖切断、NHEJ（ノックアウト）と HDR、dCas9 のエピゲノム編集、2015年のヒト受精卵の報告と倫理 |
| 終 | 雨上がり（10:39） | 切る・つなぐ・運ぶ・増やす・読む・書き換える、猫が去る、クレジット |

## 作り方

CPU（4コア）だけで、すべてオープンソース／オープンウェイトの道具で作っています。

1. **台本** `script.json` → **声** `tools/tts.py`（Microsoft Edge のニューラル音声。行ごとに合成し、実測の長さで `timeline.json` を作る）
2. **キービジュアル** `shots.json`（70ショット）→ `tools/gen_keyart.py`：Nova Anime XL（SDXL のアニメモデル、LCM 8ステップ）を OpenVINO INT4 で CPU 推論、1344×768、1枚約5分半
3. **下ごしらえ** `tools/prep.py`：Real-ESRGAN animevideov3 で 2688×1536 に高解像度化、Depth Anything V2 で奥行き、anime-seg で人物の切り抜き
4. **撮影（コンポジット）** `tools/comp.py`：奥行きを使った 2.5D カメラ（押し・引き・パン・ティルト）、呼吸、雨（背景の明るさで光る3層の雨筋）、水しぶき・波紋、ネオンのまたたき、光の粒、熱のゆらぎ、ブルーム・グレーディング・粒子、章タイトル、字幕
5. **図** `tools/overlays.py`：講義の図を「最小限の光の線」で描いたもの（34種）。台詞の時刻に合わせて動く
6. **音** `tools/audio.py`：自作合成の劇伴（ピアノ・パッド・オルゴール・パルス）、雨と街の環境音、効果音（ハサミ・結合のチャイム・PCRの風・Cas9 の低音）、声のリバーブとダッキング
7. **書き出し** `tools/render.py sample|full`：1920×1080・24fps・H.264／AAC、日本語字幕トラック付き

```bash
pip install edge-tts "optimum-intel[openvino]" diffusers transformers opencv-python-headless onnxruntime scipy torch
# モデル（.cache/models/）: isnetis.onnx（skytnt/anime-seg）, depth_v2_small.onnx（onnx-community/depth-anything-v2-small）,
#   realesr-animevideov3.pth（xinntao/Real-ESRGAN v0.2.5.0）。フォント（.cache/ttf/）: google/fonts の ShipporiMincho, ZenKakuGothicNew
python3 tools/tts.py
python3 tools/gen_keyart.py          # 約6時間（CPU）。既にある絵は飛ばす
python3 tools/prep.py
python3 tools/render.py sample       # sample/sample_30s.mp4
python3 tools/render.py full --jobs 3
```

`.cache/`（モデル・生成画像・音声）は git に入れていません。上の手順で再生成できます。

## 使った道具とライセンス

| 用途 | 道具 | ライセンス |
|---|---|---|
| キービジュアル | Nova Anime XL LCM（`sca255/nova_xl_lcm` → `HelloSun/nova_xl_lcm-OpenVINO-INT4`） | OpenRAIL++ |
| 推論 | OpenVINO / optimum-intel / diffusers | Apache-2.0 |
| 高解像度化 | Real-ESRGAN animevideov3 | BSD-3-Clause |
| 奥行き | Depth Anything V2 Small | Apache-2.0 |
| 切り抜き | anime-seg（isnetis） | Apache-2.0 |
| 声 | edge-tts（Microsoft ニューラル音声 ja-JP-Keita／Nanami） | ― |
| 音楽・効果音 | NumPy / SciPy による自作合成 | ― |
| フォント | しっぽり明朝、Zen 角ゴシック New | SIL OFL 1.1 |

台詞・語りはすべて書き下ろしです（特定作家の文章の引用はありません）。人物の顔に実在の人物は使っていません。

# 素材一覧と利用条件 — 「午前二時の本社ビル」

## モーション（モーションキャプチャ）

出典：**CMU Graphics Lab Motion Capture Database**（http://mocap.cs.cmu.edu/）。
利用条件（サイト記載）：「This dataset of motions is free for all uses.」「You may include this data in commercially-sold products, but you may not resell this data directly, even in converted form.」 謝辞：「The database was created with funding from NSF EIA-0196217.」

ASF/AMC を `scripts/film/amc2json.py` で関節位置に変換し、`src/engine/story/motion/clips.json` の区間だけを切り出して使用（各人物の身長に合わせて拡大縮小、向き・位置を配置、場面ごとに IK で手先を小道具へ、視線を相手へ補正）。

| クリップ | CMU テイク | 内容（データベースの記述） | 区間（秒） | 使った場面 |
|---|---|---|---|---|
| walk | 07_04 | slow walk | 0.0–3.7 | archive、dawn、gate、hq、nucleolus、split |
| walk_casual | 82_08 | stand still; casual walk forward (walk part) | 8.6–14.1 | branch、split |
| stand | 77_02 | standing (idle, weight shifts) | 0.0–15.6 | archive、branch、gate、nucleolus、split |
| stand2 | 82_08 | stand still (idle) | 0.0–8.4 | archive、branch、gate、nucleolus、split |
| stretch | 111_32 | stretch and yawn | 0.4–5.4 | dawn |
| explain | 18_08 | conversation - explain with hand gestures | 9.0–17.4 | archive、branch、gate、nucleolus |
| wave | 141_16 | wave hello | 0.0–2.5 | branch、split |
| laugh | 79_70 | laughing | 1.0–9.6 | gate |
| pull | 81_07 | pull heavy object | 0.9–8.2 | split |
| climb | 13_35 | climb 3 steps | 1.8–8.2 | branch |
| coil | 62_21 | coiling a rope | 10.4–36.5 | archive |

調べたが使わなかったもの：Mixamo・Rokoko Motion Library（いずれもアカウントでのダウンロードが必要で、生データの再配布は不可。リポジトリに含めて再編集できる形にできないため不採用）、Bandai Namco Research Motiondataset（CC BY-NC-ND 4.0：改変不可のため、2D人物への当てはめに使えない）。「Mocap ATLAS」という名前のダウンロード可能なライブラリは確認できなかった。

## 音楽（BGM）

作曲：**Kevin MacLeod（incompetech.com）**。Licensed under Creative Commons: By Attribution 4.0 License（http://creativecommons.org/licenses/by/4.0/）。映像のエンドタイトルとこの一覧にクレジットを表示。ファイルは `scripts/film/fetch_audio.sh` で incompetech.com から取得（リポジトリには含めない）。

| 曲 | 使った場面 |
|---|---|
| "Late Night Radio" Kevin MacLeod (incompetech.com) | 午前二時の本社ビル |
| "Almost New" Kevin MacLeod (incompetech.com) | 八本柱の門 |
| "Immersed" Kevin MacLeod (incompetech.com) | 書庫の糸巻き |
| "Late Night Radio" Kevin MacLeod (incompetech.com) | 組立室の三つの部屋 |
| "Man Down" Kevin MacLeod (incompetech.com) | 本社をふたつに |
| "Danse Morialta" Kevin MacLeod (incompetech.com) | 小腸支社の四十八時間 |
| "Reawakening" Kevin MacLeod (incompetech.com) | 夜明けの出荷 |

## 効果音・環境音

- **Kenney**（https://kenney.nl）RPG Audio / Impact Sounds / Interface Sounds — **CC0**（パブリックドメイン相当）。使用したファイルのみ `production/nucleus-hq/audio/se/kenney/` に同梱（License_*.txt つき）。
- **自作の合成音**（`scripts/film/synth_se.py` がノイズと発振器から生成。第三者の音源なし）：環境音（夜の街、静かな部屋、機械のうなり、朝の街）、ほか。

| 素材 | 種類 | 使用回数 |
|---|---|---|
| amb_dark.wav | 自作（合成） | 1 |
| amb_morning.wav | 自作（合成） | 1 |
| amb_office_hum.wav | 自作（合成） | 1 |
| amb_street_night.wav | 自作（合成） | 1 |
| bookFlip1.ogg | Kenney (CC0) | 20 |
| bookFlip2.ogg | Kenney (CC0) | 7 |
| bookPlace1.ogg | Kenney (CC0) | 8 |
| click_002.ogg | Kenney (CC0) | 1 |
| cloth1.ogg | Kenney (CC0) | 2 |
| cloth2.ogg | Kenney (CC0) | 2 |
| cloth3.ogg | Kenney (CC0) | 2 |
| cloth4.ogg | Kenney (CC0) | 4 |
| confirmation_002.ogg | Kenney (CC0) | 1 |
| creak1.ogg | Kenney (CC0) | 1 |
| creak2.ogg | Kenney (CC0) | 1 |
| creak3.ogg | Kenney (CC0) | 1 |
| footstep_carpet_002.ogg | Kenney (CC0) | 3 |
| footstep_concrete_000.ogg | Kenney (CC0) | 23 |
| footstep_concrete_001.ogg | Kenney (CC0) | 18 |
| footstep_concrete_002.ogg | Kenney (CC0) | 13 |
| footstep_concrete_003.ogg | Kenney (CC0) | 20 |
| footstep_grass_000.ogg | Kenney (CC0) | 3 |
| footstep_grass_001.ogg | Kenney (CC0) | 3 |
| footstep_grass_002.ogg | Kenney (CC0) | 3 |
| footstep_grass_003.ogg | Kenney (CC0) | 2 |
| footstep_wood_000.ogg | Kenney (CC0) | 12 |
| footstep_wood_001.ogg | Kenney (CC0) | 12 |
| footstep_wood_002.ogg | Kenney (CC0) | 11 |
| footstep_wood_003.ogg | Kenney (CC0) | 10 |
| glass_002.ogg | Kenney (CC0) | 8 |
| metalClick.ogg | Kenney (CC0) | 1 |

## 声

- Microsoft Edge のニューラル音声（edge-tts、APIキー不要）で読み上げ。特定の実在人物の声はまねていない。
- 口の動きは録音した声の大きさ（30 fps の包絡線、`story/lipsync.json`）に合わせている。


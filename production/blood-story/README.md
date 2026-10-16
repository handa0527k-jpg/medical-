# BLOOD STORY ― 体内を駆ける細胞たち ―

講義資料「血液」をもとにした、オリジナルの2D医学教育アニメ。すべてプログラムで描画・合成（Canvas 2D ＋ Chromium で1フレームずつ書き出し）、
声はニューラル音声（edge-tts：Nanami / Keita）、BGM・効果音は numpy で合成（著作権素材なし）。

| 作品 | ファイル | 長さ | 仕様 |
|---|---|---|---|
| 冒頭30秒サンプル | `blood_story_episode01_intro.mp4`（＋`.srt`） | 30.0 秒 | 1920×1080・30fps・AAC 48kHz・字幕焼き込み＋ソフト字幕 |
| 第1話「運ぶもの、守るもの」本編 | `blood_story_episode01.mp4` | 4分54秒 | 1920×1080・30fps（リポジトリ用に約2.5Mbpsで再圧縮。原版は `out/` に書き出される） |

## 本編の構成

| 時刻 | 場面 | 内容（講義資料の範囲） |
|---|---|---|
| 0:00 | アバン | 血管突入 → アカネ（赤血球）がO₂を運ぶ → 毛細血管 → 警報 → シロウ（好中球）出動（＝冒頭サンプル） |
| 0:36 | タイトル | BLOOD STORY／第1話 |
| 0:41 | 血液の成分 | 遠心分離：血漿 約55%・バフィーコート（白血球・血小板）1%以下・赤血球 約45% |
| 1:11 | 血清と血漿タンパク | 血餅と血清、血清＝血漿−フィブリノゲンなど、アルブミン・グロブリン・γグロブリン（抗体） |
| 1:35 | 赤血球の形 | 両凹円盤・直径約7.5μm・核なし・ヘモグロビン、膜骨格（スペクトリン・アンキリン・バンド3）、毛細血管での変形 |
| 2:06 | ヘモグロビン | α2β2、ヘム4つ、鉄にO₂が結合（最大4つ） |
| 2:21 | 肺と組織・CO₂ | O₂の受け渡し、炭酸脱水酵素、HCO₃⁻とバンド3（Cl⁻と交換） |
| 2:48 | 赤血球の一生 | 骨髄・エリスロポエチン・脱核・網状赤血球、寿命約120日、脾臓のマクロファージ、鉄の再利用とビリルビン |
| 3:22 | 防御戦線 | 白血球5種と割合、好中球（分葉核・顆粒）、貪食（ファゴソーム→ファゴリソソーム・活性酸素）、好酸球・好塩基球・単球・リンパ球 |
| 4:12 | 血小板と凝固 | 粘着・放出・凝集（一次血栓）、巨核球の断片、フィブリノゲン→フィブリン網 |
| 4:30 | エピローグ | アカネとシロウ、体の全景へ |
| 4:48 | 次回予告 | 「次回：白血球、防御戦線！」 |

## 作り方（マルチエージェント制作）

`CONTRACT.md`（共通仕様）と `DIRECTOR_NOTES.md`（合成のルール）を契約として、担当ごとに並行制作した。

- キャラクター `web/characters.js`（アカネ・シロウ・白血球の仲間4人。ボーンリグ、走り／歩き、表情、口パク、背面）
- 世界・エフェクト `web/world.js`（血管内一人称、赤血球の両凹円盤レンダラ、毛細血管、警報、解説カード、テロップ）
- 模式図 `web/diag_rbc.js`（赤血球・血液の11図）、`web/diag_wbc.js`（白血球・貪食・凝固・全景）
- 音 `tools/voices.py`・`sfx.py`・`bgm.py`・`mix.py`／`mix_episode.py`、時刻表 `audio/cues*.json`
- 合成 `web/scenes/intro.js`（冒頭）、`episode01.js`＋`ep01_*.js`（本編、場面ごとに担当）

### 書き出し

```sh
# 音（声はキャッシュされる）
SSL_CERT_FILE=/root/.ccr/ca-bundle.crt python3 tools/voices.py && python3 tools/sfx.py && python3 tools/bgm.py && python3 tools/mix.py
# 映像（Chromium＋Playwright）
node tools/render.mjs intro out/blood_story_episode01_intro.mp4 --audio audio/mix_intro.wav --workers 4
node tools/render.mjs episode01 out/blood_story_episode01.mp4 --audio audio/mix_episode01.wav --workers 4
# 静止画で確認
node tools/stills.mjs episode01 out/frames/check.jpg 60 120 180
```

第2話以降は、台本 → `audio/cues_episode02.json`（場面と beats）→ `web/scenes/episode02.js` の順に同じ部品で追加できる。

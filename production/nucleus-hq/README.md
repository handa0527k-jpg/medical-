# 「午前二時の本社ビル」制作ファイル

MED·STUDY 組織学「核・細胞周期」のストーリーアニメ（アプリ内：核・細胞周期 → アニメ →「午前二時の本社ビル」）。
核を夜の本社ビルに見立て、配達人タグが部品（リボソーム蛋白質）を届ける一晩を、モーションキャプチャの演技・表情・声・音楽・効果音・環境音で描く。セリフ（60行）は講義資料に沿った既存の脚本のまま。

## 成果物

| | ファイル |
|---|---|
| 30秒見本（最初に作った品質確認用。門の場面の冒頭 約41秒） | `sample/sample_30s.mp4` |
| 全シーン（場面ごとの完成映像、音声・字幕つき） | `scenes/scene_01_hq/scene.mp4` … `scenes/scene_07_dawn/scene.mp4`（大きいので git には入れず、`scripts/film/build.sh` で再生成） |
| 完成版 | `final.mp4`（1280×720・30fps・H.264／AAC 192k・日本語字幕トラック） |
| 字幕 | `subtitles.srt` |
| タイムライン | `TIMELINE.md`（場面・全セリフ・音楽・環境音・効果音の時刻） |
| 使用モーション・BGM・SE一覧／ライセンス | `ASSETS.md` |
| 音の設計（再編集用） | `sound.json` → `timeline.json`（解決済みの時刻） |

アプリでは同じ絵がリアルタイムに描かれ、声は1行ずつ、音楽・効果音・環境音は `public/courses/histology-nucleus/story/bed.m4a`（セリフ中は自動で音楽が下がるように作った下敷きの音）として映画の時計に合わせて流れる。

## 場面

| # | 場面 | 内容 | 主な演技（モーション） |
|---|---|---|---|
| 1 | 午前二時の本社ビル | 夜の細胞の街、粗面小胞体の廊下、二重の外壁と堀、HE／メチルグリーン・ピロニン | 歩く（箱を持つ）、箱を持ち直す |
| 2 | 八本柱の門 | 核膜孔複合体（8×3のリング、30〜100 nm、9 nm の通り道、出入りするもの、核バスケット、核ラミナ） | 歩く、立つ、身ぶりで説明、箱を差し出す・のぞき込む、笑う、壁をたたく |
| 3 | 書庫の糸巻き | ヌクレオソーム、10 nm、200塩基対、30 nm線維とループ、正／異染色質、Barr小体 | 糸を巻く（ロープを巻く動作）、口に指を当てる、説明 |
| 4 | 組立室の三つの部屋 | 核小体（線維中心・線維部・顆粒部、RNAポリメラーゼⅠ、ウリジンの印、亜粒子） | 箱を置く、部品を持ち上げて光にかざす、説明 |
| 5 | 本社をふたつに | 有糸分裂（前期〜終期、染色体の構造、後期A/B） | 手を振って号令、綱を引く（二人で両側へ） |
| 6 | 小腸支社の四十八時間 | 細胞集団の三つの型、幹細胞と前駆細胞、絨毛を48時間でのぼる、BrdU | 手を振る、説明、段をのぼる新人たち |
| 7 | 夜明けの出荷 | リボソームの完成、ふり返り、本社の窓に朝の光 | 歩く・ふり返る、伸びとあくび |

## 作り方（再編集）

```bash
# 1) 素材の取得（git に入れていないもの）
scripts/film/fetch_mocap.sh            # CMU のモーション → src/engine/story/motion/clips/*.json
scripts/film/fetch_audio.sh            # incompetech の BGM と、合成した効果音・環境音
# 2) プレビュー
npx vite --port 5199                   # アプリ：#/open/histology-nucleus/animations/story?t=秒
node scripts/story-frames.mjs histology-nucleus out --scene gate --at 5,20 --sheet
# 3) 音を変えたら
npx tsx scripts/film/timeline.ts histology-nucleus production/nucleus-hq
python3 scripts/film/mix.py production/nucleus-hq public/.../bed.wav --bed   # アプリ用の下敷き（AAC にして bed.m4a）
# 4) 書き出し（場面ごと → 完成版）。できあがった場面は残り、途中で止まっても続きから
PW_CHROMIUM=/opt/pw-browsers/chromium scripts/film/build.sh histology-nucleus production/nucleus-hq          # 変えた場面の scene.mp4 を消してから
PW_CHROMIUM=/opt/pw-browsers/chromium scripts/film/build.sh histology-nucleus production/nucleus-hq --force  # 全部作り直す
python3 scripts/film/docs.py histology-nucleus production/nucleus-hq           # TIMELINE.md / ASSETS.md
```

- 絵：`src/content/courses/histology-nucleus/story/scenes/*.ts`（場面ごと）、舞台 `story/sets/*.ts`、人物 `story/cast.ts`。
- 人物の描画：`src/engine/story/mocap.ts`（クリップの再生・配置・つなぎ・IK・視線・カメラ）、`body.ts`（関節位置から体・服・手・頭を描く。顔と表情は `rig.ts` の頭）、`act.ts`（表情のキー、まばたき、カメラ移動）、`light.ts`（暗さと光源）、`set3d.ts`（立体の舞台）。
- 音：`sound.json` の時刻は「場面名#何行目.start + 秒」のようにセリフ基準で書くので、声を録り直しても音がずれない。
- 書き出し：`production/render.html` がアプリと同じ描画関数で1コマずつ描き、`scripts/film/render.mjs` が ffmpeg（imageio-ffmpeg 同梱の静的ビルド）へ渡す。

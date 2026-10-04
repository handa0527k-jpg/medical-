# 「写字室の朝」制作ファイル

MED·STUDY 遺伝医学「転写（機構と疾患）」（`genetics-transcription`）のストーリーアニメ。
アプリでは：遺伝学 → 転写（機構と疾患） → アニメ → 「写字室の朝」。「設計図の図書館」（`genetics-basics`）のつづき。

- 絵コンテ：`docs/story/genetics-transcription-storyboard.md`
- 台本・場面・声の設定：`src/content/courses/genetics-transcription/story/story.json`
- 描画：`story/scenes/*.ts`（7場面）、舞台と小道具 `story/sets.ts`、分子の図 `story/mol.ts`、人物 `story/cast.ts`（ジン・デオ・スプラ・オクタ・メチは「設計図の図書館」の定義をそのまま使用）

## 音

| トラック | ファイル（`public/courses/genetics-transcription/story/`） | 内容 |
|---|---|---|
| 声 | `story.mp3` | 1行ずつ再生（edge-tts、日本語の音声合成。APIキー不要） |
| BGM | `bgm.mp3` | 場面ごとの曲。セリフの間は自動で −9 dB 下げてある。プレーヤーの「BGM」ボタンで再生・停止、つまみで音量（端末に保存） |
| 効果音・環境音 | `fx.mp3` | 足音・紙・扉・鐘・朝の環境音（小さめ） |

音が読み込めないときも、字幕とアニメだけで最後まで見られる。

### 作り直す

```bash
# 声（台本を変えたとき）
npx tsx scripts/build-story-speech.ts genetics-transcription
python3 scripts/generate-story-audio.py genetics-transcription
# BGM・効果音（声の長さが変わったら必ず）
bash -c 'P=production/transcription-morning; mkdir -p $P/audio/bgm; for t in "Carefree" "Easy Lemon" "Life of Riley" "Wholesome" "Bright Wish"; do curl -sSL -o "$P/audio/bgm/$t.mp3" "https://incompetech.com/music/royalty-free/mp3-royaltyfree/$(python3 -c "import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))" "$t.mp3")"; done; OUT=$P/audio/se/synth python3 scripts/film/synth_se.py'
npx tsx scripts/film/timeline.ts genetics-transcription production/transcription-morning
python3 scripts/film/mix.py production/transcription-morning /tmp/bgm.wav --music
python3 scripts/film/mix.py production/transcription-morning /tmp/fx.wav --fx
# → MP3 にして public/…/story/bgm.mp3・fx.mp3、story.json の bgm/fx の ?v= を更新
```

音のきっかけ（BGMの区間・音量、効果音の時刻）は `sound.json`。時刻は「場面名#何行目.start + 秒」のようにセリフ基準なので、声を録り直してもずれない。

## ライセンス

| 素材 | 出典 | ライセンス |
|---|---|---|
| BGM「Carefree」「Easy Lemon」「Life of Riley」「Wholesome」「Bright Wish」 | Kevin MacLeod（incompetech.com） | "Title" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/ |
| 効果音（足音・紙・扉・金属音） | Kenney（kenney.nl） | CC0（`production/nucleus-hq/audio/se/kenney/License_*.txt`） |
| 効果音（ペン・鐘・朝の環境音） | `scripts/film/synth_se.py` で合成 | オリジナル |
| 声 | 音声合成（ja-JP-KeitaNeural / NanamiNeural、特定の実在人物の声ではない） | — |
| キャラクター・絵 | オリジナル | — |

医学的内容は講義資料「転写（機構と疾患）」（2026.09.28）に基づく。各場面の「実際の細胞では」の図に出典スライド（＝PDFのページ番号）を示した。

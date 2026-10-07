# YouTube 投稿用セット（GENE QUEST ― 設計図の勇者 ―）

| ファイル | 中身 |
|---|---|
| `gene_quest_youtube.mp4` | 動画本体（1920×1080・24 fps・H.264 High@4.0・AAC 128 kbps 48 kHz・8分11秒・28 MB、2パス圧縮）。字幕は焼き込んでいない（画面のメッセージウィンドウに同じ文が出る） |
| `thumbnail.jpg` | サムネイル（1280×720・JPEG・2 MB 未満） |
| `title.txt` | タイトル（59字。上限100字） |
| `description.txt` | 説明文（概要・チャプター22個・学べること・この動画について） |
| `tags.txt` | タグ（カンマ区切り。500字以内） |
| `gene_quest_ja.srt` | 日本語字幕（全51行） |

より高画質で上げたいときは、同じ内容の `../final.mp4`（33 MB、CRF 18）を使ってください。

## 投稿の手順（YouTube Studio）

1. 「作成」→「動画をアップロード」で `gene_quest_youtube.mp4` を選ぶ。
2. **タイトル**・**説明**：`title.txt` と `description.txt` を貼り付ける。説明の「0:00 …」の行から**チャプター**が自動で作られる。
3. **サムネイル**：`thumbnail.jpg` をアップロード（電話番号の確認が済んだアカウントで使える）。
4. **視聴者**：「いいえ、子ども向けではありません」。
5. **詳細**：タグ（`tags.txt` を貼り付け）、言語「日本語」、カテゴリ「教育」。
6. **改変または合成されたコンテンツ**：実在の人物・出来事を本物らしく見せるものではないアニメーション教材なので、通常は「いいえ」。声が合成音声であることは説明文に書いてある。
7. **字幕**：「字幕」→ 言語「日本語」→「ファイルをアップロード」→「タイミングあり」で `gene_quest_ja.srt`。
8. まず「限定公開」で再生・字幕・チャプターを確かめてから「公開」にするのがおすすめ。

## 公開する前に確かめること

- **講義資料の権利**：内容は講義資料「遺伝子工学」（熊本大学・遺伝医学 2026）に沿っています。資料そのもの（図・写真）は映像に使っていませんが、講義の内容を一般公開してよいか、必要なら講師に確認してください。
- **音声合成**：声は edge-tts 経由の Microsoft Neural 音声（Nanami・Keita）です。この経路は Microsoft の公式な商用ライセンスではありません。収益化する場合は、Azure の音声サービス（有料・商用可）で同じ声を作り直すか、ご自身の声に差し替えてください（`../script.json` を書き換えて `../voice.py` → `../build.sh`）。
- **「ドラクエ風」の表記**：タイトル・説明・タグには商標名を入れず「RPG」「レトロRPG風」としています。曲・キャラクター・効果音はすべてオリジナルです。
- **フォント**：DotGothic16（SIL OFL）。動画やサムネイルへの使用に制限はありません。

## 作り直すとき

```bash
bash production/gene-quest/build.sh                       # out/video.mp4 と audio/master.wav を作る
node production/gene-quest/src/thumbnail.mjs production/gene-quest/youtube/thumbnail.jpg
# 28 MB 版（2パス）: production/gene-quest/ で
ffmpeg -y -i out/video.mp4 -c:v libx264 -preset slow -profile:v high -level:v 4.0 -b:v 330k -pass 1 -pix_fmt yuv420p -g 48 -an -f mp4 /dev/null
ffmpeg -y -i out/video.mp4 -i audio/master.wav -map 0:v -map 1:a -c:v libx264 -preset slow -profile:v high -level:v 4.0 -b:v 330k -pass 2 -pix_fmt yuv420p -g 48 -c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart youtube/gene_quest_youtube.mp4
cp subtitles.srt youtube/gene_quest_ja.srt
```

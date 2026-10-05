# YouTube 投稿用セット（遺伝子の基礎 全6講）

| ファイル | 中身 |
|---|---|
| `lectureN.mp4` | 動画本体（1920×1080・24fps・H.264、音声 AAC 48 kHz）。字幕は焼き込まず、絵は全画面。Git には入れていない（作り方は下の「作り直すとき」） |
| `lectureN_29MB.mp4` | 同じ動画を 1本 29 MB 以内に収めた版（チャットで受け渡すため、2パスで圧縮）。手元に `lectureN.mp4` があればそちらの方が高画質 |
| `lectureN_title.txt` | タイトル（100字以内） |
| `lectureN_description.txt` | 説明文（概要・チャプター・シリーズ一覧・この動画について） |
| `lectureN_ja.srt` | 日本語字幕 |
| `lectureN_thumbnail.jpg` | サムネイル（1280×720） |
| `tags.txt` | タグ |

## 投稿の手順（YouTube Studio）

1. YouTube Studio →「作成」→「動画をアップロード」で `lectureN.mp4` を選ぶ。
2. **タイトル**・**説明**：`lectureN_title.txt` と `lectureN_description.txt` を貼り付ける。説明の「0:00 …」の行から**チャプター**が自動で作られる。
3. **サムネイル**：`lectureN_thumbnail.jpg` をアップロード（電話番号の確認が済んだアカウントで使える）。
4. **再生リスト**：「遺伝子の基礎（全6講）」を作って追加し、第1講から順に並べる。
5. **視聴者**：「いいえ、子ども向けではありません」。
6. **詳細**：タグ（`tags.txt`）、言語「日本語」、カテゴリ「教育」。
7. **改変または合成されたコンテンツ**：実在の人物・出来事を本物らしく見せる内容ではないアニメーション教材なので、通常は「いいえ」でよい。声が合成音声であることは説明文に書いてある。
8. **字幕**：「字幕」→ 言語「日本語」→「ファイルをアップロード」→「タイミングあり」で `lectureN_ja.srt`。
9. 公開設定は、まず「限定公開」で内容と字幕を確認してから「公開」にするのがおすすめ。

## 公開する前に確かめること

- **講義資料の権利**：台詞・板書・図の内容は講義資料（MEDSTUDY に取り込んだ教材）に沿っています。元の講義資料が大学や講師のものなら、YouTube で一般公開してよいか確認してください（「限定公開」なら共有した人だけが見られます）。
- **音声合成**：声は edge-tts 経由の Microsoft Neural 音声です。この経路は Microsoft の公式な商用ライセンスではありません。収益化する場合や心配な場合は、Azure の音声サービス（有料・商用可）で同じ声を作り直すか、ご自身の声に差し替えてください（`tools/lecture-video/revoice_edge.py` と同じ要領で差し替えられます）。
- **フォント**：Zen Kaku Gothic New・Klee One・Dela Gothic One・Yuji Syuku（いずれも SIL OFL）。動画への使用に制限はありません。

## 作り直すとき

```bash
python tools/lecture-video/medstudy_video.py assemble production/lecture-video/genetics-basics-N-film --no-subs --no-tag --audio-bitrate 192k --out youtube-720.mp4
ffmpeg -i production/lecture-video/genetics-basics-N-film/out/youtube-720.mp4 -vf scale=1920:1080:flags=lanczos -c:v libx264 -preset slow -crf 18 -tune animation -pix_fmt yuv420p -c:a copy -movflags +faststart production/lecture-video/youtube/lectureN.mp4
python production/lecture-video/youtube/make_meta.py
```

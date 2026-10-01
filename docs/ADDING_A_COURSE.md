# 教材（授業PDF）を追加する

1つの授業PDF = 1つの教材フォルダです。アプリのコードは変更しません。

## 1. 雛形を作る

```bash
npm run new:course -- histology-epithelium 上皮組織.pdf --title "組織学｜上皮組織" --number 3 --skip 1
```

- PDFの各ページの文字を抽出して `slides.json` の下書き（`sourceText`）を作ります
- `pdftoppm`（poppler）があれば各ページを `public/courses/<id>/slides/NN.jpg` に書き出します
  （無い場合は、各ページをJPEGで書き出してその名前で置いてください）
- `--skip` は表紙・目次など問題を作らない先頭ページ数です
- 雛形の時点でアプリに読み込まれます（設定 → 教材 で切り替え）

## 2. 内容を書く（PDFの内容だけを使う）

| ファイル | 書くこと |
|---|---|
| `course.json` | 章立て（章名・比喩・担当スライド・学習目標・全体像）。`metaphor` は「細胞＝工場」「核＝本社」の形で書くと、画面の「〇〇でいうと」に使われます |
| `slides.json` | スライドごとのタイトル・「つまり」の要点・赤シートの位置（`masks`：0〜1の矩形）・確認Q&A |
| `textbook.json` | 本文ブロック（`lead` `heading` `paragraph` `slide` `steps` `table` `analogy` `misconception` `column`）。授業資料にない知識は必ず `supplement`（画面に「補足（授業資料外の知識）」と表示） |
| `questions/single.json` | **内容のあるスライド1枚につき2問、すべて5択（A〜E）・正解は1つ**。各選択肢の解説、全体の解説、重要ポイント、出典スライド、難易度（1基本/2標準/3発展）、関連テーマ |
| `questions/judgement.json` | 正誤5択（任意） |
| `zukan.json` / `figures/` / `animations/` | 図鑑・図解・アニメーション（任意。アニメーションは `defs.ts` に描画、`scripts.json` にステップ台本） |

## 3. 授業ナレーションを生成

```bash
npm run build:narration -- histology-epithelium
```

教科書・スライド要点・図解・アニメ台本から、講義口調の台本・字幕・タイミングを作ります。
`lessons/lecture-NN.md`（予備校スタイルの授業台本、[LECTURE_SCRIPT.md](LECTURE_SCRIPT.md)）があればそちらが優先されます。`histology-nucleus` は、PDFから台本まで一通りそろえた例です。
音声合成が読み間違える用語は `src/engine/speech/reading.ts` の `READINGS` に読みを追加します。

## 4. 検証

```bash
npm run check:content
```

「5択でない」「正解が1つでない」「解説がない」「出典スライドが存在しない」「問題が2問未満のスライド」「画像がない」「ナレーション未生成」などを一覧で出します。すべて ✓ になれば完成です。

## 5. 音声（任意）

ネットワークが使える環境で `python3 scripts/generate-audio.py <id>` を実行すると、収録音声として再生されます（[AUDIO.md](AUDIO.md)）。

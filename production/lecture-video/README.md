# 授業動画（劇画アニメーション）：30秒プロトタイプ

**テーマ**：遺伝医学｜遺伝子の基礎　第1講「遺伝子とは何か」テーマ1「設計図の正体はDNA」（エイブリーの形質転換実験）

## テーマの選び方

MEDSTUDY が教材の順序どおりに自動で選びます（`src/engine/lecture-video/analyze.ts`）。

1. コース順（遺伝子の基礎 → 転写）、講の順、節の順に見ていく。
2. 導入・全体像・まとめ・本番問題は対象外にする。
3. **スライドと確認問題の両方を伴う最初のテーマ**を選ぶ。

結果は第1講テーマ1でした。根拠になる素材は次のとおりです。

- スライド14（キーポイント、セルフチェック5問）
- 確認問題 g14a / g14b
- 黒板の av-h〜av-c
- 講義の台詞 c01-0026〜0046

「DNA複製」などの決め打ちはしていません。

## 台詞の出典（30秒・黒板講義型）

台詞はすべて第1講の講義台詞（`narrations/lecture-01.json`）から取っています。

| Scene | 時間（Kokoro 実測） | 台詞 | 出典 |
|---|---|---|---|
| S01 | 0.0–約4.9 | そもそも、遺伝を担っている物質は、本当にDNAなのか。 | c01-0026（原文） |
| S02 | 〜約12 | エイブリーは、2種類の肺炎球菌を使いました。／被膜のあるS株と、被膜のないR株。 | c01-0028（原文の一部。1944年は画面の判で示す）／c01-0029・0030（要約。用語は教材のまま） |
| S03 | 〜約21 | S株から成分を1つずつ取り出して、R株に加えてみる。DNA、RNA、脂質、タンパク質、炭水化物。 | c01-0031（原文） |
| S04 | 〜約27.5 | すると、R株がS株に変わったのは、DNAを加えたときだけでした。／これを形質転換といいます。 | c01-0032（原文）／c01-0033（原文の一部） |
| S05 | 〜29.8 | 遺伝の本体はDNAだ | c01-0036（原文の一部）、板書 av-c |

- テスト（`tests/lecture-video.test.ts`）で、6通りの組み合わせ（スタイル3 × 時間2）すべてについて次を検査しています。
  - 原文・原文の一部の台詞が、元の講義台詞にそのまま含まれていること。
  - 要約の台詞では、強調語（S株・R株・DNA・結果・結論など）が教材の文に含まれていること。
- 医学図に関する外部知識は、次の補助に限っています。
  - 肺炎球菌を双球菌（2個対）として描く。
  - コロニーの見た目（S＝滑らか、R＝ざらざら）。

## 作り方（この環境で実際に行ったこと）

```sh
# 1. 台本・設定（MEDSTUDY）
npx tsx scripts/lecture-video/export-package.ts --out production/lecture-video/genetics-basics-1-2/30s_board
# 2. Kokoro（kokoro-onnx v1.0 + misaki ja/pyopenjtalk、声 jm_kumo、話速 1.06）
python3 tools/lecture-video/medstudy_video.py tts production/lecture-video/genetics-basics-1-2/30s_board
# 3. 実測タイミングで書き直し（台本・字幕・編集表・Wan のフレーム数が確定）
npx tsx scripts/lecture-video/export-package.ts --out … --timing …/audio/kokoro_timing.json
# 4. 医学図レイヤーと Wan の代わりのアニマティック、キーフレーム（MEDSTUDY 自身の描画）
node scripts/lecture-video/render-layers.mjs production/lecture-video/genetics-basics-1-2/30s_board
# 5. 効果音と FFmpeg での統合
python3 tools/lecture-video/medstudy_video.py sfx …
python3 tools/lecture-video/medstudy_video.py assemble …
# 6. アプリに載せる（public/lecture-video/）
python3 scripts/lecture-video/publish_assets.py production/lecture-video/genetics-basics-1-2/*
```

## 実行していないこと

- **Wan 2.2 と ComfyUI**：この環境には GPU が無いため実行していません。
  - 各ショットの ComfyUI ワークフロー（`comfy/`）、プロンプト、開始画像（`keyframes/`）までを作っています。
  - 完成動画の背景は、そのショットについては MEDSTUDY のアニマティックです。画面右上に「MEDSTUDY アニマティック（Wan 2.2 生成前）」と表示しています。
  - Windows 側で `medstudy_video.py comfy` を実行して `assemble` し直すと、Wan の映像に置き換わります。
- **Kokoro**：実際に生成しました。発音は Whisper（small）による文字起こしで確認しています。
  - 修正したこと：misaki の pyopenjtalk モードは音素の後ろにピッチ記号を連結して返すため、そのままだと語尾に余計な音が出ていました。ツールで音素だけを渡すように直しています。
- **FFmpeg**：実際に統合しました（imageio-ffmpeg 7.0.2、libass）。

## Git に入れないもの

`layers/`、`keyframes/`、`audio/*.wav`、`sfx/`、`out/` は、上の手順で再生成できるため Git に入れていません。

Git に入れているのは次の2つです。

- テキストのパッケージ
- Kokoro の実測タイミング（`audio/kokoro_timing.json`）

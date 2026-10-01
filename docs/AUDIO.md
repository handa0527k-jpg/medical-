# 授業の音声

## 仕組み

授業プレイヤーは講義ごとに `public/courses/<course>/audio/lecture-NN/manifest.json` を探します。

```json
{
  "voice": "ja-JP-NanamiNeural",
  "version": 2,
  "file": "../lecture-01.mp3",
  "cues": { "c01-0001": { "byteStart": 0, "byteLength": 20160, "duration": 3.36 } }
}
```

- 1講義の全文を1つのMP3（固定ビットレート）に連結し、各文のバイト位置を記録しています。プレイヤーは講義ファイルを1回だけ読み込み、文ごとに切り出して再生します（HTTPのRange要求に対応していないホストでも動作し、速度変更時も声の高さが変わりません）
- 1文1ファイル（`"src": "c01-0001.mp3"`）の形式にも対応しています

- `version` がナレーション（`narrations/lecture-NN.json` の `version`）と一致するときだけ使います。台本を作り直したあと古い音声を再生してずれる事故を防ぐためです
- 見つかれば「収録音声」、無ければ「端末の音声合成」、どちらも使えなければ「音声なし（字幕で進行）」と画面に表示します
- 収録音声の長さでタイムラインを再計算するので、字幕・ハイライト・カメラ移動・アニメはそのまま同期します

## 生成する

```bash
pip install edge-tts mutagen
python3 scripts/generate-audio.py histology-cytoplasm                 # 全講義（1,468文・約30秒×9）
python3 scripts/generate-audio.py histology-cytoplasm --lecture 1     # 第1講だけ
python3 scripts/generate-audio.py histology-cytoplasm --voice ja-JP-KeitaNeural
```

読み上げるのは各キューの `speech`（医学用語の読みを補正済みのテキスト）です。別のTTS（Google Cloud TTS、Azure、VOICEVOX など）を使う場合は `synthesize()` だけを書き換えてください。

同梱の音声は `ja-JP-NanamiNeural`・話速 -3% で生成しました（全9講・1,468文・約143分・約50MB）。合成済みの文は `.audio-cache/` に保存されるので、台本の一部を直したときは変更された文だけが再合成されます。

遺伝子の基礎（`genetics-basics`）は、授業の長さを5〜15分に収めるため話速 **+5%** で収録しています：

```bash
python3 scripts/generate-audio.py genetics-basics --rate=+5%   # 全6講・約690文・約32MB
```

## 読み間違いの確認（音声認識）

```bash
pip install faster-whisper pykakasi
python3 scripts/check-audio.py histology-nucleus        # 全講（1講あたり約3分）
```

収録音声を1文ずつオフラインの音声認識で書き起こし、意図した読みと比べます。一致率0.8未満の文を一覧にするので、
「音が違う」ものだけを `src/engine/speech/reading.ts` の読みで直して録り直します（多くは同音の別漢字で、問題ありません）。
これまでに見つかって直したもの：蛋白質（たんしろしつ）、膜貫通（まくかんとう）、〜的（特異的→とくいまと）、槽内（そううち）、5Sだけ外（がい）。

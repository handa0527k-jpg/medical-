# 授業の音声

## 仕組み

授業プレイヤーは講義ごとに `public/courses/<course>/audio/lecture-NN/manifest.json` を探します。

```json
{
  "voice": "ja-JP-NanamiNeural",
  "version": 2,
  "cues": { "c01-0001": { "src": "c01-0001.mp3", "duration": 3.41 } }
}
```

- `version` がナレーション（`narrations/lecture-NN.json` の `version`）と一致するときだけ使います。台本を作り直したあと古い音声を再生してずれる事故を防ぐためです
- 見つかれば「収録音声」、無ければ「端末の音声合成」、どちらも使えなければ「音声なし（字幕で進行）」と画面に表示します
- 収録音声の長さでタイムラインを再計算するので、字幕・ハイライト・カメラ移動・アニメはそのまま同期します

## 生成する

```bash
pip install edge-tts mutagen
python3 scripts/generate-audio.py histology-cytoplasm                 # 全講義（1,468文）
python3 scripts/generate-audio.py histology-cytoplasm --lecture 1     # 第1講だけ
python3 scripts/generate-audio.py histology-cytoplasm --voice ja-JP-KeitaNeural
```

読み上げるのは各キューの `speech`（医学用語の読みを補正済みのテキスト）です。別のTTS（Google Cloud TTS、Azure、VOICEVOX など）を使う場合は `synthesize()` だけを書き換えてください。

この開発環境ではTTSサービスのホストがネットワーク設定で遮断されていたため、音声ファイルは同梱していません。

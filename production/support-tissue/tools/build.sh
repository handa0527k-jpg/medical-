#!/bin/bash
# 『人体は巨大な街だった！ 支持組織の秘密を探れ！』を最初から最後まで作る。
#   tools/build.sh            … 台本 → 音声 → タイムライン → BGM・効果音 → ミックス → 映像（4並列）→ 結合
#   tools/build.sh --video    … 音はそのまま、映像の書き出しと結合だけ
#   JOBS=2 tools/build.sh     … 並列数
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=$(cd ../.. && pwd)
PY_SBV2="$REPO/.venv-sbv2/bin/python"
JOBS=${JOBS:-4}

if [[ "${1:-}" != "--video" ]]; then
  python3 tools/parse_script.py                 # script/script.txt → build/script.json
  "$PY_SBV2" tools/tts.py                       # Style-Bert-VITS2 で録音（変わった文だけ）
  python3 tools/timeline.py                     # 声の長さ → render/data/timeline.json, subtitles/*.srt
  python3 tools/music.py                        # シーン別のオリジナル BGM
  python3 tools/sfx.py                          # 効果音
  python3 tools/mix.py                          # build/mix/<scene>.wav
fi

node tools/check_frames.mjs 1                   # 描画エラーがないか全シーンを確認

# 長いシーンから順に並列で書き出す
python3 -c "import json;tl=json.load(open('render/data/timeline.json'));[print(s['id']) for s in sorted(tl['scenes'],key=lambda s:-s['dur'])]" \
  | xargs -P "$JOBS" -I{} sh -c 'test -s output/scenes/{}.mp4 && echo "skip {}" || node tools/render.mjs {} > build/render_{}.log 2>&1 && echo "rendered {}"'

# 結合（同じ設定で書き出しているので再エンコードしない）＋字幕トラック
ls output/scenes/s??.mp4 | sort | sed "s|^|file '$(pwd)/|; s|$|'|" > build/concat.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i build/concat.txt -i subtitles/medical_support_tissue.srt \
  -map 0:v -map 0:a -map 1:s -c copy -c:s mov_text -metadata:s:s:0 language=jpn -metadata title="人体は巨大な街だった！ 支持組織の秘密を探れ！" \
  -movflags +faststart output/medical_support_tissue_master.mp4
echo "master: output/medical_support_tissue_master.mp4"

# 配布用（GitHub の 1 ファイル 100 MB 制限に収まるよう 2 パスで容量を決めて圧縮）
python3 tools/encode_release.py

#!/usr/bin/env bash
# Build the whole film: one MP4 per scene (kept, so a failed run resumes where it stopped), then the
# final MP4 = the scenes' pictures joined + the soundtrack mixed over the full length + subtitles.
#   scripts/film/build.sh <course> <production dir> [--force]
# Needs a dev server on :5199 (npx vite --port 5199) and PW_CHROMIUM for Playwright's Chromium.
set -euo pipefail
cd "$(dirname "$0")/../.."
COURSE=$1; PROD=$2; FORCE=${3:-}
FF=$(python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')
npx tsx scripts/film/timeline.ts "$COURSE" "$PROD"
ids=$(python3 -c "import json;print(' '.join(s['id'] for s in json.load(open('$PROD/timeline.json'))['scenes']))")
n=0; list="$PROD/scenes/concat.txt"; mkdir -p "$PROD/scenes"; : > "$list"
for id in $ids; do
  n=$((n+1)); dir="$PROD/scenes/scene_$(printf %02d $n)_$id"; mkdir -p "$dir"
  if [ -f "$dir/scene.mp4" ] && [ "$FORCE" != "--force" ]; then echo "scene $n ($id): kept"; else
    node scripts/film/render.mjs "$COURSE" "$PROD" "$dir/scene.mp4" --scene "$id"
    rm -f "$dir/scene.wav"
  fi
  echo "file '$(realpath "$dir/scene.mp4")'" >> "$list"
done
# final: pictures joined (no re-encode), the soundtrack over the whole length, subtitles
"$FF" -y -loglevel error -f concat -safe 0 -i "$list" -map 0:v -c copy "$PROD/scenes/picture.mp4"
python3 scripts/film/mix.py "$PROD" "$PROD/soundtrack.wav"
python3 - "$PROD" <<'PY'
import json, sys
p = sys.argv[1]; tl = json.load(open(f'{p}/timeline.json'))
def ts(x):
    ms = max(0, round(x * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
out = []
for i, l in enumerate(tl['lines']):
    who = '' if l['who'] == 'N' else l['who'] + '「'; end = '' if l['who'] == 'N' else '」'
    out.append(f"{i + 1}\n{ts(l['t0'])} --> {ts(l['t1'] + 0.3)}\n{who}{l['text']}{end}\n")
open(f'{p}/subtitles.srt', 'w').write('\n'.join(out))
PY
"$FF" -y -loglevel error -i "$PROD/scenes/picture.mp4" -i "$PROD/soundtrack.wav" -i "$PROD/subtitles.srt" -map 0:v -map 1:a -map 2:s \
  -c:v copy -c:a aac -b:a 192k -c:s mov_text -metadata:s:s:0 language=jpn -metadata title="午前二時の本社ビル" -movflags +faststart "$PROD/final.mp4"
rm -f "$PROD/scenes/picture.mp4" "$PROD/soundtrack.wav"
echo "final: $PROD/final.mp4"

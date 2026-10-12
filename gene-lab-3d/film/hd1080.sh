#!/bin/sh
# 1080p copies under GitHub's 100 MB file limit: HEVC (x265, two-pass), which
# YouTube accepts and which keeps 1080p sharp at ~2-3 Mbps.
#   sh film/hd1080.sh sanger ...   ->  film/videos/<title>-1080p.mp4
set -e
here=$(cd "$(dirname "$0")" && pwd)
for id in "$@"; do
  src=$here/out/$id-1080p.mp4
  title=$(python3 -c "import json;print(json.load(open('$here/../web/public/film/$id/timing.json'))['title'])")
  dst="$here/videos/$title-1080p.mp4"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  vbit=$(python3 -c "print(min(4500, int(94*8*1024/$dur - 160)))")
  x="-c:v libx265 -preset medium -b:v ${vbit}k -tag:v hvc1 -pix_fmt yuv420p"
  ffmpeg -v error -y -i "$src" $x -x265-params pass=1:stats=/tmp/x265-$id.log:log-level=error -an -f mp4 /dev/null
  ffmpeg -v error -y -i "$src" $x -x265-params pass=2:stats=/tmp/x265-$id.log:log-level=error -c:a aac -b:a 160k -movflags +faststart "$dst"
  ls -la "$dst"
done

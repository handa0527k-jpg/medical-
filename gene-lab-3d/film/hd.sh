#!/bin/sh
# HD copies under GitHub's 100 MB file limit (720p, two-pass x264, up to 3 Mbps).
#   sh film/hd.sh pcr sanger ...   ->  film/videos/<title>-HD.mp4
set -e
here=$(cd "$(dirname "$0")" && pwd)
for id in "$@"; do
  src=$here/out/$id-720p.mp4
  title=$(python3 -c "import json;print(json.load(open('$here/../web/public/film/$id/timing.json'))['title'])")
  dst="$here/videos/$title-HD.mp4"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  vbit=$(python3 -c "print(min(3000, int(95*8*1024/$dur - 160)))")
  ffmpeg -v error -y -i "$src" -c:v libx264 -preset medium -b:v ${vbit}k -maxrate $((vbit*2))k -bufsize $((vbit*4))k -pass 1 -passlogfile /tmp/hd-$id -an -f mp4 /dev/null
  ffmpeg -v error -y -i "$src" -c:v libx264 -preset medium -b:v ${vbit}k -maxrate $((vbit*2))k -bufsize $((vbit*4))k -pass 2 -passlogfile /tmp/hd-$id -c:a aac -b:a 160k -movflags +faststart "$dst"
  ls -la "$dst"
done

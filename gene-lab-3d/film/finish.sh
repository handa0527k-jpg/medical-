#!/bin/sh
# Join the rendered segments and lay the narration under them.
#   sh film/finish.sh sanger
set -e
id=${1:-sanger}
here=$(cd "$(dirname "$0")" && pwd)
out=$here/out
ls "$out"/$id-video-*.mp4 | sort -t- -k3 -n | sed "s|^|file '|; s|$|'|" > "$out/$id-list.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$out/$id-list.txt" -i "$here/../web/public/film/$id/narration.mp3" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart "$out/$id-1080p.mp4"
# a lighter copy for sharing
ffmpeg -v error -y -i "$out/$id-1080p.mp4" -vf scale=1280:-2 -c:v libx264 -preset slow -crf 23 -c:a copy -movflags +faststart "$out/$id-720p.mp4"
ls -la "$out"/$id-1080p.mp4 "$out"/$id-720p.mp4

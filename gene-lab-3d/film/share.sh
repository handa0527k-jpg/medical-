#!/bin/sh
# Make a copy of a finished film that fits a 28 MB upload limit (two-pass x264, 720p).
#   sh film/share.sh pcr   ->  <title>-720p-小.mp4 next to this repo's README
set -e
id=$1
here=$(cd "$(dirname "$0")" && pwd)
src=$here/out/$id-720p.mp4
title=$(python3 -c "import json;print(json.load(open('$here/../web/public/film/$id/timing.json'))['title'])")
dst="$here/../$title-720p-小.mp4"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
vbit=$(python3 -c "print(int(28*8*1024/$dur - 100))")
ffmpeg -v error -y -i "$src" -c:v libx264 -preset slow -b:v ${vbit}k -pass 1 -passlogfile /tmp/share-$id -an -f mp4 /dev/null
ffmpeg -v error -y -i "$src" -c:v libx264 -preset slow -b:v ${vbit}k -pass 2 -passlogfile /tmp/share-$id -c:a aac -b:a 96k -movflags +faststart "$dst"
ls -la "$dst"

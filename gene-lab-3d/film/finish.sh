#!/bin/sh
# Join a film's rendered chunks and lay the narration under them.
#   sh film/finish.sh sanger
set -e
id=${1:-sanger}
here=$(cd "$(dirname "$0")" && pwd)
out=$here/out
H=${H:-1080}
src=$id; [ "$H" != 1080 ] && src=$id-${H}p
ls "$out/$src"/chunk-*.mp4 | grep -v part | sort | sed "s|^|file '|; s|$|'|" > "$out/$id-list.txt"
bgm=$here/../.cache/film-bgm/$id.wav
[ -f "$bgm" ] || python3 "$here/music.py" "$id"
# narration on top; a public-domain classical recording underneath (film/music.json), ducked while she speaks; YouTube loudness (-14 LUFS)
ffmpeg -v error -y -f concat -safe 0 -i "$out/$id-list.txt" -i "$here/../web/public/film/$id/narration.mp3" -i "$bgm" \
  -filter_complex "[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,asplit=2[voice][key];[2:a]volume=1.0[bg];[bg][key]sidechaincompress=threshold=0.02:ratio=4:attack=40:release=800[duck];[voice][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$out/$id-${H}p.mp4"
if [ "$H" = 1080 ]; then
  # a lighter copy for sharing
  ffmpeg -v error -y -i "$out/$id-1080p.mp4" -vf scale=1280:-2 -c:v libx264 -preset slow -crf 24 -c:a copy -movflags +faststart "$out/$id-720p.mp4"
fi
ls -la "$out/$id"-*p.mp4

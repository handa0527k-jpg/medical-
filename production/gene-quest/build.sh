#!/usr/bin/env bash
# GENE QUEST — build the finished film.
#   bash production/gene-quest/build.sh            # everything
#   SKIP_VIDEO=1 bash production/gene-quest/build.sh   # reuse out/video.mp4 (only the sound changed)
set -euo pipefail
cd "$(dirname "$0")"
python3 voice.py                         # narration → timing.json (cached per line)
node src/render.mjs --cues               # sound-effect cues from the scenes
[ "${SKIP_VIDEO:-}" = 1 ] || node src/render.mjs   # picture → out/video.mp4 (1920×1080, 24 fps)
python3 audio.py                         # score + effects + narration → audio/stems/*.wav, audio/mix_raw.wav
python3 docs.py                          # subtitles.srt, TIMELINE.md
# master: two-pass loudness normalisation to −16 LUFS, true peak −1.5 dBTP, 48 kHz
M=$(ffmpeg -hide_banner -nostats -i audio/mix_raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi=$(echo "$M" | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -y -hide_banner -loglevel error -i audio/mix_raw.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:$mi:linear=true,aresample=48000" -ar 48000 -c:a pcm_s16le audio/master.wav
# final: picture + AAC 320k + Japanese subtitle track
ffmpeg -y -hide_banner -loglevel error -i out/video.mp4 -i audio/master.wav -i subtitles.srt \
  -map 0:v -map 1:a -map 2:s -c:v copy -c:a aac -b:a 320k -ar 48000 -c:s mov_text \
  -metadata:s:s:0 language=jpn -metadata:s:a:0 language=jpn -metadata title="GENE QUEST ― 設計図の勇者 ―" \
  -movflags +faststart -t "$(python3 -c "import json;print(json.load(open('timing.json'))['duration'])")" final.mp4
ffmpeg -hide_banner -nostats -i final.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|Peak:"
ls -la final.mp4

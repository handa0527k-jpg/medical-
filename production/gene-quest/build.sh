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
# final: picture + AAC, encoded for the widest playback (H.264 Main@4.0, no embedded subtitle track;
# phones and in-app players often refuse High@5.0 or a mov_text track). Subtitles ship as subtitles.srt.
ffmpeg -y -hide_banner -loglevel error -i out/video.mp4 -i audio/master.wav -map 0:v -map 1:a \
  -c:v libx264 -profile:v main -level:v 4.0 -preset slow -crf 18 -pix_fmt yuv420p -r 24 -g 48 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart final.mp4
# light copy (960×540 = one pixel per dot) for phones and slow connections
ffmpeg -y -hide_banner -loglevel error -i final.mp4 -vf scale=960:540:flags=neighbor \
  -c:v libx264 -profile:v main -level:v 3.1 -preset slow -crf 20 -pix_fmt yuv420p -g 48 -c:a aac -b:a 128k -movflags +faststart final_light.mp4
ffmpeg -hide_banner -nostats -i final.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|Peak:"
ls -la final.mp4

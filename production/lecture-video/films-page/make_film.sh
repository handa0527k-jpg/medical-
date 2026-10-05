#!/bin/bash
# re-voice with edge-tts, re-assemble (subtitle band), and make the copy for the films page:
# AAC 128 kbps / 48 kHz audio, the video gets whatever is left of a 14.5 MB file (two-pass, 960x540)
cd /home/user/medical-
L=$1; P=production/lecture-video/genetics-basics-$L-film
FF=$(python3 -c "import shutil,imageio_ffmpeg;print(shutil.which('ffmpeg') or imageio_ffmpeg.get_ffmpeg_exe())")
[ -f $P/audio/edge_report.json ] || SSL_CERT_FILE=/root/.ccr/ca-bundle.crt python3 tools/lecture-video/revoice_edge.py $P || exit 1
python3 tools/lecture-video/medstudy_video.py assemble $P --sub-band --audio-bitrate 192k || exit 1
mkdir -p .scratch/films
DUR=$(python3 -c "import json;print(json.load(open('$P/timing.json'))['total'])")
VB=$(python3 -c "print(int(min(600, (14.5*8*1024 - 128*$DUR)/$DUR*0.96)))")
cd /tmp && rm -f ffmpeg2pass-$L*
nice $FF -y -v error -i /home/user/medical-/$P/out/lecture.mp4 -vf scale=960:540 -c:v libx264 -preset slow -tune animation -b:v ${VB}k -pass 1 -passlogfile ffmpeg2pass-$L -an -f mp4 /dev/null || exit 1
nice $FF -y -v error -i /home/user/medical-/$P/out/lecture.mp4 -vf scale=960:540 -c:v libx264 -preset slow -tune animation -b:v ${VB}k -pass 2 -passlogfile ffmpeg2pass-$L -pix_fmt yuv420p -c:a aac -ar 48000 -b:a 128k -movflags +faststart /home/user/medical-/.scratch/films/film$L.mp4 || exit 1
cd /home/user/medical-
echo "video ${VB}k"; ls -la .scratch/films/film$L.mp4
echo "HQ $L"

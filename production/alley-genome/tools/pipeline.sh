#!/usr/bin/env bash
# Whole production after the voices: key art → variants → prep → full render → per-chapter files.
# Resumable: every step skips what already exists. Log: .cache/pipeline.log
set -uo pipefail
cd "$(dirname "$0")/.."
log() { echo "[$(date +%T)] $*" | tee -a .cache/pipeline.log; }
# 1) key art (wait if another generator is already running)
while pgrep -f "tools/gen_keyart.py" >/dev/null; do sleep 30; done
log "key art"; python3 tools/gen_keyart.py >> .cache/gen.log 2>&1
# 2) blink / talk variants
log "variants"; python3 tools/variants.py >> .cache/gen.log 2>&1
# 3) prep (upscale, depth, matte, variant masks)
log "prep"; python3 tools/prep.py >> .cache/prep.log 2>&1
# 4) full render (3 workers)
for p in $(pgrep -f "do python3 tools/prep.py"); do kill $p; done
log "render"; python3 tools/render.py full --jobs 3 >> .cache/render.log 2>&1 || { log "render failed"; exit 1; }
# 5) per-chapter files (each under GitHub's 100 MB limit) cut from the master
log "chapters"
mkdir -p chapters
python3 - <<'PY'
import json, subprocess
tl = json.load(open('timeline.json'))
for k, s in enumerate(tl['scenes']):
    out = f"chapters/{k:02d}_{s['id']}.mp4"
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(s['start']), '-to', str(s['end']), '-i', 'final.mp4', '-map', '0:v', '-map', '0:a',
                    '-c:v', 'libx264', '-crf', '21', '-preset', 'slow', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
                    '-metadata', f"title=路地裏のゲノム {s['title']}", '-movflags', '+faststart', out], check=True)
    print(out)
PY
log "done"

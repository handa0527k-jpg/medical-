#!/bin/bash
# Render every 3D clip (transparent PNG sequences in out/blender/<clip>/) with 4 Blender processes in parallel.
#   BL=/path/to/blender blender/render_all.sh [clip ...]
cd "$(dirname "$0")/.."
BL=${BL:-/opt/blender-dl/blender-4.5.9-linux-x64/blender}
declare -A N=([dna_spin]=240 [dna_drop]=240 [dna_meth]=240 [nuc_build]=192 [nuc_wrap]=192 [nuc_tags]=192
              [fiber_open]=120 [fiber_close]=120 [gokai]=48 [logo_title]=96 [logo_rikai]=96)
CLIPS=${@:-${!N[@]}}
for c in $CLIPS; do
  for ((a = 0; a < ${N[$c]}; a += 24)); do echo "$c $a:$((a + 24))"; done
done | xargs -P ${JOBS:-4} -L 1 sh -c '"$0" -b -P blender/assets.py -- $1 --frames $2 > /dev/null 2>&1 || echo "FAILED $1 $2"' "$BL"
for c in $CLIPS; do echo "$c $(ls out/blender/$c/f*.png | wc -l)/${N[$c]}"; done

#!/usr/bin/env bash
# Download the CMU Graphics Lab Motion Capture Database takes used by the story films and convert
# them (ASF/AMC → joint positions). Source: http://mocap.cs.cmu.edu/ — "free for all uses";
# "The database was created with funding from NSF EIA-0196217."
set -euo pipefail
cd "$(dirname "$0")/../.."
RAW=.cache/mocap/raw; FULL=.cache/mocap/full; mkdir -p "$RAW" "$FULL"
TAKES="07_04:120 82_08:120 77_02:60 79_85:60 111_32:120 79_38:60 79_36:60 79_73:60 79_71:60 143_18:120 114_05:120 18_08:120 19_08:120 141_16:120 111_02:120 79_70:60 77_05:60 69_16:120 13_04:120 ${EXTRA_TAKES:-}"
for m in $TAKES; do
  c=${m%:*}; f=${m#*:}; s=${c%_*}
  [ -f "$RAW/$s.asf" ] || curl -sS -m 120 -o "$RAW/$s.asf" "http://mocap.cs.cmu.edu/subjects/$s/$s.asf"
  [ -f "$RAW/$c.amc" ] || curl -sS -m 300 -o "$RAW/$c.amc" "http://mocap.cs.cmu.edu/subjects/$s/$c.amc"
  [ -f "$FULL/$c.json" ] || python3 scripts/film/amc2json.py "$RAW/$s.asf" "$RAW/$c.amc" "$f" "$FULL/$c.json"
done
python3 scripts/film/make_clips.py "$FULL"

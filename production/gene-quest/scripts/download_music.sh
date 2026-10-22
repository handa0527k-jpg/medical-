#!/usr/bin/env bash
# BGM（Kevin MacLeod, incompetech.com, CC BY 4.0）を assets/music/src/ にダウンロードする。
# 使う曲は config/project_config.yaml の bgm: に書かれている12曲。クレジットは README とエンディングに表示。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/music/src
python3 - <<'PY' | while IFS= read -r t; do
import yaml
for v in yaml.safe_load(open("config/project_config.yaml", encoding="utf-8"))["bgm"].values():
    print(v["file"])
PY
  f="assets/music/src/$t"
  [ -s "$f" ] && { echo "ok $t"; continue; }
  u="https://incompetech.com/music/royalty-free/mp3-royaltyfree/$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$t")"
  curl -sSL --retry 4 -o "$f" "$u" && echo "downloaded $t"
done

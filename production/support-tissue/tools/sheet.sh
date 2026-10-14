#!/bin/bash
# シーンの静止画を並べた確認用シートを作る：tools/sheet.sh s02 out.png t1 t2 ...（10枚まで）
sc=$1; out=$2; shift 2
d=$(mktemp -d)
args=""; i=0
for t in "$@"; do args="$args index.html?scene=$sc&t=$t $d/$i.png"; i=$((i+1)); done
node "$(dirname "$0")/shot.mjs" $args 2>&1 | grep -v "^wrote" | grep -v "404" || true
inputs=""; n=0; for f in $(ls $d/*.png | sort -V); do inputs="$inputs -i $f"; n=$((n+1)); done
lay=""; for ((k=0;k<n;k++)); do x=$(( k % 2 )); y=$(( k / 2 )); lay="$lay|$((x*1920))_$((y*1080))"; done
ffmpeg -y -loglevel error $inputs -filter_complex "xstack=inputs=$n:layout=${lay:1}:fill=black,scale=1200:-1" "$out"
rm -rf $d

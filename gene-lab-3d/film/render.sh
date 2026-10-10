#!/bin/sh
# Render films in the background, resumably: freezes a production build (so editing
# sources cannot disturb the render), serves it, runs 3 workers per film, then
# joins the chunks. Re-running after an interruption continues from the last chunk.
#   sh film/render.sh sanger pcr crispr
set -e
here=$(cd "$(dirname "$0")" && pwd)
web=$here/../web
cd "$web"
frozen=$here/../.cache/film-frozen
if [ ! -f "$frozen/film.html" ] || [ -n "$REBUILD" ]; then
  npm run build > /dev/null
  mkdir -p "$frozen"
  cp -r dist/. "$frozen/"
fi
if ! curl -s -o /dev/null "http://localhost:4176/film.html"; then
  npx vite preview --outDir "$frozen" --port 4176 --strictPort > "$here/out/preview.log" 2>&1 &
  sleep 3
fi
for id in "$@"; do
  pids=""
  for w in 0 1 2; do
    node scripts/render-film.mjs "$id" --worker $w --workers 3 --w ${W:-1920} --h ${H:-1080} > "$here/out/$id-w$w.log" 2>&1 &
    pids="$pids $!"
  done
  wait $pids
  H=${H:-1080} sh "$here/finish.sh" "$id"
done

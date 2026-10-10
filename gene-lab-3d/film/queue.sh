#!/bin/sh
# Wait for a running render to finish (its 720p file appears), then render more films.
#   sh film/queue.sh <wait-for-id> <id>...
here=$(cd "$(dirname "$0")" && pwd)
wait_for=$1; shift
while [ ! -f "$here/out/$wait_for-720p.mp4" ]; do sleep 30; done
REBUILD=1 sh "$here/render.sh" "$@"

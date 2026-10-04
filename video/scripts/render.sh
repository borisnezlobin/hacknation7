#!/usr/bin/env bash
# Rebuild data, narration, soundtrack and final videos. Usage: video/scripts/render.sh [demo tech team]
set -euo pipefail
cd "$(dirname "$0")/../.."
videos=("${@:-demo tech team}")
read -r -a videos <<< "${videos[*]}"
uv run python video/scripts/extract_data.py
python3 video/scripts/build_timeline.py
uv run --with scipy --with numpy python video/scripts/score.py "${videos[@]}"
cd video
for name in "${videos[@]}"; do
  composition="$(tr '[:lower:]' '[:upper:]' <<< "${name:0:1}")${name:1}"
  npx remotion render src/index.ts "$composition" "out/${name}-silent.mp4" --muted --concurrency=6
  ffmpeg -loglevel error -y -i "out/${name}-silent.mp4" -i "out/audio/${name}.wav" -c:v copy -c:a aac -b:a 256k -shortest "out/${name}.mp4"
  echo "out/${name}.mp4"
done

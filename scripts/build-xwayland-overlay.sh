#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="$project_dir/native/wayland/remote-mouse-xwayland-overlay.c"
output_dir="$project_dir/build/wayland"
output_file="$output_dir/remote-mouse-xwayland-overlay"

mkdir -p "$output_dir"

cc -std=c11 -Wall -Wextra -Werror -O2 \
  "$source_file" \
  -lX11 -lpng \
  -o "$output_file"

chmod 0755 "$output_file"
echo "$output_file"

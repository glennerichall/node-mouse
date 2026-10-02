#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="$project_dir/native/wayland/remote-mouse-wayland.c"
output_dir="$project_dir/build/wayland"

mkdir -p "$output_dir"

cc \
  -std=c11 \
  -Wall \
  -Wextra \
  -Werror \
  -O2 \
  $(pkg-config --cflags libei-1.0 liboeffis-1.0) \
  "$source_file" \
  -o "$output_dir/remote-mouse-wayland" \
  $(pkg-config --libs libei-1.0 liboeffis-1.0)

echo "$output_dir/remote-mouse-wayland"

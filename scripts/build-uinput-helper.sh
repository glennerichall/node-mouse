#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="$project_dir/native/uinput/remote-mouse-uinput.c"
output_dir="$project_dir/build/uinput"

mkdir -p "$output_dir"

cc -std=c11 -Wall -Wextra -Werror -O2 \
  "$source_file" \
  -o "$output_dir/remote-mouse-uinput"

echo "$output_dir/remote-mouse-uinput"

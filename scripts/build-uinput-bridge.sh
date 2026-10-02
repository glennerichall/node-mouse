#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="$project_dir/native/uinput/remote-mouse-uinput.c"
output_dir="$project_dir/build/uinput"
node_include="$(node -e "const path=require('node:path'); process.stdout.write(path.resolve(path.dirname(process.execPath), '../include/node'))")"

mkdir -p "$output_dir"

cc -std=c11 -Wall -Wextra -Werror -O2 -fPIC -shared \
  -I "$node_include" \
  "$source_file" \
  -o "$output_dir/remote-mouse-uinput.node"

echo "$output_dir/remote-mouse-uinput.node"

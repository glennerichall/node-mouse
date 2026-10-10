#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="$project_dir/native/wayland/remote-mouse-xwayland-overlay.c"
output_dir="$project_dir/build/wayland"
output_file="$output_dir/remote-mouse-xwayland-overlay"

mkdir -p "$output_dir"

compiler="${CC:-cc}"
sysroot_args=()
if [[ -n "${SYSROOT:-}" ]]; then sysroot_args+=("--sysroot=$SYSROOT"); fi
read -r -a cppflags <<< "${CPPFLAGS:-}"
read -r -a cflags <<< "${CFLAGS:-}"
read -r -a ldflags <<< "${LDFLAGS:-}"

"$compiler" "${sysroot_args[@]}" "${cppflags[@]}" "${cflags[@]}" -std=c11 -Wall -Wextra -Werror -O2 \
  "${ldflags[@]}" \
  "$source_file" \
  -lX11 -lpng \
  -o "$output_file"

chmod 0755 "$output_file"
echo "$output_file"

#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
extension_id="remote-mouse-focus@velor"
source_dir="$project_dir/native/gnome-shell/$extension_id"

if [[ "${XDG_SESSION_TYPE:-}" != "wayland" ]] || [[ "${XDG_CURRENT_DESKTOP:-}" != *GNOME* && "${XDG_CURRENT_DESKTOP:-}" != *Ubuntu* ]]; then
  echo "Remote Mouse GNOME focus extension requires a GNOME Wayland session." >&2
  exit 1
fi

if ! command -v gnome-extensions >/dev/null 2>&1; then
  echo "gnome-extensions command is unavailable; install $extension_id manually." >&2
  exit 1
fi
temporary_dir="$(mktemp -d)"
trap 'rm -rf "$temporary_dir"' EXIT
gnome-extensions pack --force --out-dir "$temporary_dir" "$source_dir"
bundle_path="$temporary_dir/$extension_id.shell-extension.zip"

if [[ ! -f "$bundle_path" ]]; then
  echo "GNOME did not create the extension bundle: $bundle_path" >&2
  exit 1
fi

gnome-extensions install --force --print-uuid "$bundle_path"

if ! gnome-extensions list --user | grep -Fxq "$extension_id"; then
  echo "GNOME did not register $extension_id after installation." >&2
  echo "Check that the current GNOME Shell version supports this extension." >&2
  exit 1
fi

gnome-extensions enable "$extension_id"
echo "Enabled $extension_id"

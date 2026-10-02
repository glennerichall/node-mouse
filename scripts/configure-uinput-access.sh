#!/usr/bin/env bash
set -euo pipefail

target_user="${1:-${SUDO_USER:-}}"
group_name="remote-mouse-uinput"
rule_path="/etc/udev/rules.d/70-remote-mouse-uinput.rules"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "This script must run as root." >&2
  exit 1
fi
if [[ -z "$target_user" ]] || ! id "$target_user" >/dev/null 2>&1; then
  echo "Usage: sudo bash scripts/configure-uinput-access.sh <desktop-user>" >&2
  exit 1
fi

rule_file="$(mktemp)"
trap 'rm -f "$rule_file"' EXIT
printf '%s\n' 'KERNEL=="uinput", SUBSYSTEM=="misc", GROUP="remote-mouse-uinput", MODE="0660", OPTIONS+="static_node=uinput"' > "$rule_file"

groupadd --force --system "$group_name"
usermod -a -G "$group_name" "$target_user"
install -o root -g root -m 0644 "$rule_file" "$rule_path"
modprobe uinput
udevadm control --reload-rules
udevadm trigger --name-match=uinput

echo "Restricted /dev/uinput access configured for $target_user through $group_name."
echo "Reconnect the desktop session so the new group membership takes effect."

#!/usr/bin/env bash

set -euo pipefail

readonly WORKSPACE="/workspace/remote-mouse"
readonly CONFIG_DIRECTORY="${HOME}/.config/remote-mouse"
readonly ENV_FILE="${CONFIG_DIRECTORY}/.env"
readonly USER_ID="$(id -u)"

export DISPLAY="$(systemctl --user show-environment | sed -n 's/^DISPLAY=//p' | tail -n 1)"
export DISPLAY="${DISPLAY:-:0}"
export XDG_SESSION_TYPE=wayland
export XDG_RUNTIME_DIR="/run/user/${USER_ID}"
export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"
export WAYLAND_DISPLAY="$(basename "$(find "${XDG_RUNTIME_DIR}" -maxdepth 1 -type s -name 'wayland-*' -print -quit)")"

if [[ -z "${WAYLAND_DISPLAY}" ]]; then
  echo 'Wayland display socket is missing from the vagrant user session.' >&2
  exit 1
fi

"${WORKSPACE}/scripts/install-linux.sh" \
  --yes --package "${WORKSPACE}" --config-dir "${CONFIG_DIRECTORY}" \
  --port 3987 --no-https --wayland --install-service

sed -i \
  -e 's/^ENTRY_PATH_ENABLED=.*/ENTRY_PATH_ENABLED=true/' \
  -e 's/^ENTRY_PATH_FIXED=.*/ENTRY_PATH_FIXED=vm-wayland-integration-token/' \
  -e '/^XDG_SESSION_TYPE=/d' \
  "${ENV_FILE}"
printf 'XDG_SESSION_TYPE=wayland\n' >> "${ENV_FILE}"
systemctl --user restart remote-mouse.service

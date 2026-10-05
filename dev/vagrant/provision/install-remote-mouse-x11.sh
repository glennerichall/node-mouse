#!/usr/bin/env bash

set -euo pipefail

readonly WORKSPACE="/workspace/remote-mouse"
readonly CONFIG_DIRECTORY="${HOME}/.config/remote-mouse"
readonly ENV_FILE="${CONFIG_DIRECTORY}/.env"
readonly USER_ID="$(id -u)"

export DISPLAY=:0
export XAUTHORITY="${HOME}/.Xauthority"
export XDG_SESSION_TYPE=x11
export XDG_RUNTIME_DIR="/run/user/${USER_ID}"
export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"

"${WORKSPACE}/scripts/install-linux.sh" \
  --yes --package "${WORKSPACE}" --config-dir "${CONFIG_DIRECTORY}" \
  --port 3987 --no-https --no-wayland --install-service

sed -i \
  -e 's/^ENTRY_PATH_ENABLED=.*/ENTRY_PATH_ENABLED=true/' \
  -e 's/^ENTRY_PATH_FIXED=.*/ENTRY_PATH_FIXED=vm-x11-integration-token/' \
  -e '/^DISPLAY=/d' -e '/^XAUTHORITY=/d' -e '/^XDG_SESSION_TYPE=/d' \
  "${ENV_FILE}"
printf 'DISPLAY=:0\nXAUTHORITY=%s\nXDG_SESSION_TYPE=x11\n' "${XAUTHORITY}" >> "${ENV_FILE}"
systemctl --user restart remote-mouse.service

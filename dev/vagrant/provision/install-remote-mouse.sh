#!/usr/bin/env bash

set -euo pipefail

readonly WORKSPACE="/workspace/remote-mouse"
readonly CONFIG_DIRECTORY="${HOME}/.config/remote-mouse"
readonly ENV_FILE="${CONFIG_DIRECTORY}/.env"
readonly USER_ID="$(id -u)"

export XDG_SESSION_TYPE=wayland
export XDG_RUNTIME_DIR="/run/user/${USER_ID}"
export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"

"${WORKSPACE}/scripts/install-linux.sh" \
  --yes \
  --package "${WORKSPACE}" \
  --config-dir "${CONFIG_DIRECTORY}" \
  --port 3987 \
  --no-https \
  --wayland \
  --install-service

# This disposable guest uses a fixed, non-production entry path so Playwright
# exercises the same session-cookie handshake as a real remote client.
sed -i \
  -e 's/^ENTRY_PATH_ENABLED=.*/ENTRY_PATH_ENABLED=true/' \
  -e 's/^ENTRY_PATH_FIXED=.*/ENTRY_PATH_FIXED=vm-integration-token/' \
  "${ENV_FILE}"
sed -i '/^XDG_SESSION_TYPE=/d' "${ENV_FILE}"
printf 'XDG_SESSION_TYPE=wayland\n' >> "${ENV_FILE}"
sudo systemctl restart "user@${USER_ID}.service"
systemctl --user restart remote-mouse.service

#!/usr/bin/env bash
set -euo pipefail

profile="${REMOTE_MOUSE_TEST_PROFILE:-install}"
test_user="${REMOTE_MOUSE_TEST_USER:?REMOTE_MOUSE_TEST_USER is required}"
workspace="${REMOTE_MOUSE_TEST_ROOT:-/tmp/remote-mouse}"
user_id="$(id -u "$test_user")"

sudo apt-get update
sudo apt-get install -y ca-certificates curl evtest rsync
sudo loginctl enable-linger "$test_user"
sudo systemctl start "user@$user_id.service"

case "$profile" in
  install|x11)
    npm install -g "$workspace"
    CONFIG_DIR="$HOME/.config/remote-mouse" remote-mouse setup --yes --port 3987
    ;;
  wayland)
    export XDG_SESSION_TYPE=wayland
    export XDG_RUNTIME_DIR="/run/user/$user_id"
    export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
    npm install -g "$workspace"
    CONFIG_DIR="$HOME/.config/remote-mouse" remote-mouse setup --yes --port 3987 --configure-uinput
    ;;
esac
systemctl --user restart remote-mouse.service

#!/usr/bin/env bash
set -euo pipefail

profile="${1:-install}"
case "$profile" in
  install|x11|wayland) ;;
  *) echo "Usage: $0 <install|x11|wayland>" >&2; exit 2 ;;
esac

: "${REMOTE_MOUSE_TEST_HOST:?Set REMOTE_MOUSE_TEST_HOST to the developer-provided VM address}"
remote_user="${REMOTE_MOUSE_TEST_USER:-$USER}"
remote_port="${REMOTE_MOUSE_TEST_PORT:-22}"
remote_root="${REMOTE_MOUSE_TEST_ROOT:-/tmp/remote-mouse}"
ssh_args=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new -p "$remote_port")
if [[ -n "${REMOTE_MOUSE_TEST_KEY:-}" ]]; then ssh_args+=(-i "$REMOTE_MOUSE_TEST_KEY"); fi
remote="${remote_user}@${REMOTE_MOUSE_TEST_HOST}"

rsync -az --exclude .git --exclude node_modules --exclude coverage \
  --exclude build --exclude .data -e "ssh ${ssh_args[*]}" ./ "$remote:$remote_root/"
ssh "${ssh_args[@]}" "$remote" "REMOTE_MOUSE_TEST_PROFILE=$profile REMOTE_MOUSE_TEST_USER=$remote_user REMOTE_MOUSE_TEST_ROOT=$remote_root bash '$remote_root/dev/deploy/provision-linux.sh'"
echo "Deployed Remote Mouse ($profile) to $remote:$remote_root"

#!/usr/bin/env bash

set -euo pipefail

readonly TEST_USER="vagrant"
readonly TEST_UID="$(id -u "${TEST_USER}")"

export DEBIAN_FRONTEND=noninteractive
printf '%s\n' 'gdm3 shared/default-x-display-manager select gdm3' | debconf-set-selections

apt-get update
apt-get install -y \
  ca-certificates curl evtest gdm3 rsync ubuntu-desktop-minimal \
  wev x11-utils xdotool xwayland

install -d -m 0755 /etc/gdm3
cat >/etc/gdm3/custom.conf <<EOF
[daemon]
WaylandEnable=true
AutomaticLoginEnable=True
AutomaticLogin=${TEST_USER}
EOF

wayland_session="$(basename "$(find /usr/share/wayland-sessions -maxdepth 1 -name '*.desktop' -print -quit)" .desktop)"
if [[ -z "${wayland_session}" ]]; then
  echo 'No GNOME Wayland session was installed.' >&2
  exit 1
fi

install -d -m 0755 /var/lib/AccountsService/users
cat >/var/lib/AccountsService/users/${TEST_USER} <<EOF
[User]
XSession=${wayland_session}
SystemAccount=false
EOF

loginctl enable-linger "${TEST_USER}"
systemctl set-default graphical.target
systemctl enable gdm3
wayland_ready=false
for session in $(loginctl show-user "${TEST_USER}" -p Sessions --value); do
  if [[ "$(loginctl show-session "${session}" -p Type --value 2>/dev/null || true)" == wayland ]] \
    && compgen -G "/run/user/${TEST_UID}/wayland-*" >/dev/null; then
    wayland_ready=true
    break
  fi
done
if [[ "${wayland_ready}" != true ]]; then
  systemctl restart gdm3
fi
systemctl start "user@${TEST_UID}.service"

for _attempt in $(seq 1 120); do
  for session in $(loginctl show-user "${TEST_USER}" -p Sessions --value); do
    session_type="$(loginctl show-session "${session}" -p Type --value 2>/dev/null || true)"
    if [[ "${session_type}" == "wayland" ]] \
      && compgen -G "/run/user/${TEST_UID}/wayland-*" >/dev/null; then
      exit 0
    fi
  done
  sleep 1
done

echo 'GNOME Wayland session did not become ready.' >&2
journalctl -u gdm3 -n 80 --no-pager >&2
exit 1

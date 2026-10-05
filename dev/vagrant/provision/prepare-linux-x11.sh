#!/usr/bin/env bash

set -euo pipefail

readonly TEST_USER="vagrant"
readonly TEST_UID="$(id -u "${TEST_USER}")"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y \
  ca-certificates curl lightdm rsync spice-vdagent \
  xfce4 xfce4-terminal xdotool xserver-xorg

install -d -m 0755 /etc/lightdm/lightdm.conf.d
cat >/etc/lightdm/lightdm.conf.d/50-remote-mouse-test.conf <<EOF
[Seat:*]
autologin-user=${TEST_USER}
autologin-user-timeout=0
user-session=xfce
EOF

loginctl enable-linger "${TEST_USER}"
systemctl set-default graphical.target
systemctl restart lightdm
systemctl start "user@${TEST_UID}.service"

for _attempt in $(seq 1 60); do
  test -S /tmp/.X11-unix/X0 && exit 0
  sleep 1
done

echo 'Xorg display :0 did not become ready.' >&2
exit 1

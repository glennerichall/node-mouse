#!/usr/bin/env bash

set -euo pipefail

readonly TEST_USER="vagrant"
readonly TEST_UID="$(id -u "${TEST_USER}")"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl evtest rsync

# A persistent user manager is required because Remote Mouse installs a user
# service. SSH provisioning does not otherwise guarantee that this manager is
# alive after the provisioning shell exits.
loginctl enable-linger "${TEST_USER}"
systemctl start "user@${TEST_UID}.service"

install -d -o "${TEST_USER}" -g "${TEST_USER}" -m 0700 "/run/user/${TEST_UID}"

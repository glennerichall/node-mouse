#!/usr/bin/env bash

set -euo pipefail

readonly VAGRANT_VERSION="${VAGRANT_VERSION:-2.4.9}"
readonly HOST_ARCHITECTURE="$(dpkg --print-architecture)"
readonly INSTALL_USER="${SUDO_USER:-${USER}}"

fail() {
    printf 'remote-mouse vagrant install: %s\n' "$*" >&2
    exit 1
}

[[ "$(uname -s)" == "Linux" ]] || fail 'this installer requires Linux'
[[ -r /etc/os-release ]] || fail 'cannot identify the Linux distribution'

# shellcheck disable=SC1091
source /etc/os-release
[[ "${ID:-}" == "ubuntu" ]] || fail 'this installer currently supports Ubuntu only'
[[ "${HOST_ARCHITECTURE}" == "amd64" ]] || fail 'this installer currently supports amd64 only'
[[ "${EUID}" -ne 0 ]] || fail 'run as your normal user; the script invokes sudo when required'

readonly TEMPORARY_DIRECTORY="$(mktemp -d)"
trap 'rm -rf "${TEMPORARY_DIRECTORY}"' EXIT

printf 'Installing QEMU/KVM, libvirt, UEFI and TPM support...\n'
sudo apt-get update
sudo apt-get install -y \
    bridge-utils \
    build-essential \
    ca-certificates \
    curl \
    ebtables \
    libguestfs-tools \
    libvirt-clients \
    libvirt-daemon-system \
    libvirt-dev \
    libxml2-dev \
    libxslt1-dev \
    ovmf \
    pkg-config \
    qemu-system-x86 \
    qemu-utils \
    ruby-dev \
    swtpm \
    swtpm-tools \
    zlib1g-dev

readonly RELEASE_ROOT="https://releases.hashicorp.com/vagrant/${VAGRANT_VERSION}"
readonly PACKAGE_NAME="vagrant_${VAGRANT_VERSION}-1_amd64.deb"

printf 'Downloading Vagrant %s from HashiCorp...\n' "${VAGRANT_VERSION}"
curl --fail --location --silent --show-error \
    "${RELEASE_ROOT}/${PACKAGE_NAME}" \
    --output "${TEMPORARY_DIRECTORY}/${PACKAGE_NAME}"
curl --fail --location --silent --show-error \
    "${RELEASE_ROOT}/vagrant_${VAGRANT_VERSION}_SHA256SUMS" \
    --output "${TEMPORARY_DIRECTORY}/SHA256SUMS"

(
    cd "${TEMPORARY_DIRECTORY}"
    grep " ${PACKAGE_NAME}\$" SHA256SUMS | sha256sum --check --strict -
)

sudo apt-get install -y "${TEMPORARY_DIRECTORY}/${PACKAGE_NAME}"
sudo usermod --append --groups kvm,libvirt "${INSTALL_USER}"
sudo systemctl enable --now libvirtd

printf 'Installing the vagrant-libvirt provider for %s...\n' "${INSTALL_USER}"
if [[ "${INSTALL_USER}" == "${USER}" ]]; then
    vagrant plugin install vagrant-libvirt
else
    sudo --user "${INSTALL_USER}" --set-home vagrant plugin install vagrant-libvirt
fi

printf '\nHost setup complete. Open a new login session, then run: cd dev/vagrant && vagrant validate\n'

#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
check_only=0
assume_yes=0

usage() {
  cat <<'EOF'
Usage: bash dev/setup-linux.sh [--check] [--yes]

Prepare a Linux Ubuntu/Debian development checkout. By default, install the
required system build packages (after confirmation), run npm ci, build the
project-owned Linux helpers, and generate the x64/ARM64 prebuilds on amd64.

Options:
  --check  Only report missing prerequisites and generated local helpers.
  --yes    Do not prompt before installing system packages.
  --help   Show this help.
EOF
}

while (($#)); do
  case "$1" in
    --check) check_only=1 ;;
    --yes) assume_yes=1 ;;
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

if [[ "$(uname -s)" != Linux ]]; then
  echo "Development setup currently supports Linux Ubuntu/Debian only." >&2
  exit 1
fi
if ((EUID == 0)); then
  echo "Run this script as your development user, not with sudo; it invokes sudo only for apt." >&2
  exit 1
fi

if [[ ! -r /etc/os-release ]]; then
  echo "Cannot identify this Linux distribution: /etc/os-release is unavailable." >&2
  exit 1
fi
# shellcheck disable=SC1091
source /etc/os-release
if [[ "${ID:-}" != ubuntu && "${ID:-}" != debian ]]; then
  printf 'Unsupported distribution: %s (supported: Ubuntu and Debian).\n' "${ID:-unknown}" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 22 or newer and npm are required. Install Node.js (nvm is documented in README.md), then rerun this script." >&2
  exit 1
fi

node_version="$(node --version | sed 's/^v//')"
node_major="${node_version%%.*}"
if [[ ! "$node_major" =~ ^[0-9]+$ ]] || ((node_major < 22)); then
  printf 'Node.js %s is too old; this development setup requires Node.js 22 or newer.\n' "$node_version" >&2
  exit 1
fi

host_arch="$(dpkg --print-architecture)"
apt_sources_dir="${REMOTE_MOUSE_APT_SOURCES_DIR:-/etc/apt/sources.list.d}"
ubuntu_arm64_source="$apt_sources_dir/remote-mouse-arm64.sources"
system_packages=(build-essential pkg-config libx11-dev libxtst-dev libpng-dev wmctrl)
if [[ "$host_arch" == amd64 ]]; then
  system_packages+=(crossbuild-essential-arm64 libx11-dev:arm64 libpng-dev:arm64)
fi
missing_packages=()
for package in "${system_packages[@]}"; do
  if ! dpkg-query -W -f='${db:Status-Abbrev}' "$package" 2>/dev/null | grep -q '^ii'; then
    missing_packages+=("$package")
  fi
done

arm64_arch_enabled=0
if [[ "$host_arch" == amd64 ]] && dpkg --print-foreign-architectures | grep -qx arm64; then
  arm64_arch_enabled=1
fi

arm64_source_ready=1
arm64_source_needed=0
if [[ "$host_arch" == amd64 && "${ID:-}" == ubuntu ]]; then
  codename="${VERSION_CODENAME:-}"
  if [[ -z "$codename" ]]; then
    echo "Cannot configure the Ubuntu ARM64 package source: VERSION_CODENAME is missing." >&2
    exit 1
  fi
  if [[ -f "$ubuntu_arm64_source" ]]; then
    if grep -q '^# Managed by Remote Mouse dev/setup-linux.sh$' "$ubuntu_arm64_source" \
      && grep -q '^URIs: http://ports.ubuntu.com/ubuntu-ports$' "$ubuntu_arm64_source" \
      && grep -q "^Suites: $codename " "$ubuntu_arm64_source" \
      && grep -q '^Components: main restricted universe multiverse$' "$ubuntu_arm64_source" \
      && grep -q '^Architectures: arm64$' "$ubuntu_arm64_source" \
      && grep -q '^Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg$' "$ubuntu_arm64_source"; then
      arm64_source_ready=1
    elif grep -q '^# Managed by Remote Mouse dev/setup-linux.sh$' "$ubuntu_arm64_source"; then
      arm64_source_ready=0
      arm64_source_needed=1
    else
      echo "APT source already exists at $ubuntu_arm64_source and is not managed by this setup script; refusing to overwrite it." >&2
      exit 1
    fi
  elif grep -Rqs 'ports.ubuntu.com/ubuntu-ports' /etc/apt/sources.list "$apt_sources_dir" 2>/dev/null; then
    # Respect a developer-managed Ubuntu Ports source rather than adding a duplicate.
    arm64_source_ready=1
  else
    arm64_source_ready=0
    arm64_source_needed=1
  fi
fi

native_outputs=(
  build/uinput/remote-mouse-uinput.node
  build/wayland/remote-mouse-xwayland-pointer.node
  build/wayland/remote-mouse-xwayland-overlay
)
missing_native=()
for output in "${native_outputs[@]}"; do
  [[ -x "$project_dir/$output" ]] || missing_native+=("$output")
done

if ((check_only)); then
  if ((${#missing_packages[@]})); then
    printf 'Missing system packages: %s\n' "${missing_packages[*]}"
  else
    echo "System build packages: ready"
  fi
  if [[ -d "$project_dir/node_modules" ]]; then
    echo "npm dependencies: node_modules exists (run npm ci to refresh it)"
  else
    echo "npm dependencies: missing (run npm ci)"
  fi
  if ((${#missing_native[@]})); then
    printf 'Missing project native helpers: %s\n' "${missing_native[*]}"
  else
    echo "Project native helpers: ready"
  fi
  if [[ "$host_arch" == amd64 ]]; then
    if ((arm64_arch_enabled)); then echo "ARM64 foreign architecture: ready"; else echo "ARM64 foreign architecture: missing"; fi
    if ((arm64_source_ready)); then echo "Ubuntu ARM64 package source: ready"; else echo "Ubuntu ARM64 package source: missing"; fi
    local_missing_prebuilds=0
    for output in \
      prebuilds/linux-x64/remote-mouse-uinput.node \
      prebuilds/linux-x64/remote-mouse-xwayland-pointer.node \
      prebuilds/linux-x64/remote-mouse-xwayland-overlay \
      prebuilds/linux-arm64/remote-mouse-uinput.node \
      prebuilds/linux-arm64/remote-mouse-xwayland-pointer.node \
      prebuilds/linux-arm64/remote-mouse-xwayland-overlay; do
      if [[ ! -f "$project_dir/$output" ]]; then
        printf 'Missing native prebuild: %s\n' "$output"
        local_missing_prebuilds=1
      fi
    done
  else
    local_missing_prebuilds=0
  fi
  if ((${#missing_packages[@]} || ${#missing_native[@]} || local_missing_prebuilds)) \
    || [[ ! -d "$project_dir/node_modules" ]] \
    || { [[ "$host_arch" == amd64 ]] && { ((!arm64_arch_enabled)) || ((!arm64_source_ready)); }; }; then
    exit 1
  fi
  exit 0
fi

apt_metadata_changed=0
if [[ "$host_arch" == amd64 && "$arm64_arch_enabled" == 0 ]]; then
  echo "The ARM64 architecture will be enabled for cross-compilation."
  apt_metadata_changed=1
fi
if ((arm64_source_needed)); then
  echo "The official Ubuntu Ports source for ARM64 will be configured."
  apt_metadata_changed=1
fi

if ((${#missing_packages[@]} || apt_metadata_changed)); then
  if ((${#missing_packages[@]})); then
    printf 'System packages to install: %s\n' "${missing_packages[*]}"
  fi
  if ((!assume_yes)); then
    read -r -p 'Prepare the ARM64 toolchain and install missing development packages with apt? [y/N] ' answer
    case "$answer" in
      y|Y|yes|YES) ;;
      *) echo "Cancelled. No system packages were installed."; exit 1 ;;
    esac
  fi
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo is required to install system packages." >&2
    exit 1
  fi
  if [[ "$host_arch" == amd64 ]] && ((!arm64_arch_enabled)); then
    sudo dpkg --add-architecture arm64
  fi
  if ((arm64_source_needed)); then
    codename="${VERSION_CODENAME:-}"
    printf '%s\n' \
      '# Managed by Remote Mouse dev/setup-linux.sh' \
      'Types: deb' \
      'URIs: http://ports.ubuntu.com/ubuntu-ports' \
      "Suites: $codename $codename-updates $codename-backports $codename-security" \
      'Components: main restricted universe multiverse' \
      'Architectures: arm64' \
      'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg' \
      | sudo tee "$ubuntu_arm64_source" >/dev/null
  fi
  sudo apt-get update
  if ((${#missing_packages[@]})); then
    sudo apt-get install -y --no-install-recommends "${missing_packages[@]}"
  fi
fi

cd "$project_dir"
npm ci
npm run build:uinput
npm run build:xwayland-pointer
npm run build:xwayland-overlay
if [[ "$host_arch" == amd64 ]]; then
  npm run build:native:prebuild
  npm run build:native:prebuild -- --arch arm64
else
  npm run build:native:prebuild
fi

echo "Development environment ready. Optional RemoteDesktop/libei support is not installed by this script."

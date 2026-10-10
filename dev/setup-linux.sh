#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
check_only=0
assume_yes=0

usage() {
  cat <<'EOF'
Usage: bash dev/setup-linux.sh [--check] [--yes]

Prepare a Linux Ubuntu/Debian development checkout. By default, install the
required system build packages (after confirmation), run npm ci, and build the
project-owned Linux helpers for the current architecture.

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

system_packages=(build-essential pkg-config libx11-dev libxtst-dev libpng-dev wmctrl)
missing_packages=()
for package in "${system_packages[@]}"; do
  if ! dpkg-query -W -f='${db:Status-Abbrev}' "$package" 2>/dev/null | grep -q '^ii'; then
    missing_packages+=("$package")
  fi
done

native_outputs=(
  build/wayland/remote-mouse-uinput.node
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
  if ((${#missing_packages[@]} || ${#missing_native[@]})) || [[ ! -d "$project_dir/node_modules" ]]; then
    exit 1
  fi
  exit 0
fi

if ((${#missing_packages[@]})); then
  printf 'System packages to install: %s\n' "${missing_packages[*]}"
  if ((!assume_yes)); then
    read -r -p 'Install these packages with apt? [y/N] ' answer
    case "$answer" in
      y|Y|yes|YES) ;;
      *) echo "Cancelled. No system packages were installed."; exit 1 ;;
    esac
  fi
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo is required to install system packages." >&2
    exit 1
  fi
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends "${missing_packages[@]}"
fi

cd "$project_dir"
npm ci
npm run build:uinput
npm run build:xwayland-pointer
npm run build:xwayland-overlay

echo "Development environment ready. Optional RemoteDesktop/libei support is not installed by this script."

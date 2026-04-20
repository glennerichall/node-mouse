#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_NPM_PACKAGE="@velor/remote-mouse"
MIN_NODE_MAJOR=20
NODESOURCE_MAJOR=22

if [[ -f "$PROJECT_ROOT/package.json" ]]; then
  PACKAGE_JSON_NAME="$(sed -n 's/^[[:space:]]*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$PROJECT_ROOT/package.json" | head -n 1)"
  if [[ -n "$PACKAGE_JSON_NAME" ]]; then
    DEFAULT_NPM_PACKAGE="$PACKAGE_JSON_NAME"
  fi
fi

YES=0
NPM_PACKAGE="${REMOTE_MOUSE_NPM_PACKAGE:-$DEFAULT_NPM_PACKAGE}"
CONFIG_DIR="${REMOTE_MOUSE_CONFIG_DIR:-$HOME/.config/remote-mouse}"
PORT="${REMOTE_MOUSE_PORT:-3000}"
HTTPS="false"
SSL_KEY_PATH="${REMOTE_MOUSE_SSL_KEY_PATH:-}"
SSL_CERT_PATH="${REMOTE_MOUSE_SSL_CERT_PATH:-}"
INSTALL_SERVICE="false"
HTTPS_CHOICE=""
GENERATE_CERT_CHOICE=""
INSTALL_SERVICE_CHOICE=""

usage() {
  cat <<'EOF'
Usage: scripts/install-linux.sh [options]

Options:
  -y, --yes              Answer yes to every confirmation prompt.
  --package <name>       npm package to install globally.
  --config-dir <path>    Remote Mouse config directory.
  --port <port>          Server port written to the generated .env.
  --https                Configure HTTPS without prompting.
  --no-https             Disable HTTPS without prompting.
  --generate-cert        Generate a self-signed certificate without prompting.
  --no-generate-cert     Use existing certificate paths without prompting.
  --ssl-key-path <path>  Existing PEM private key path.
  --ssl-cert-path <path> Existing PEM certificate path.
  --install-service      Install and restart the service without prompting.
  --no-service           Do not install the service.
  -h, --help             Show this help.

Environment:
  REMOTE_MOUSE_NPM_PACKAGE   npm package name override.
  REMOTE_MOUSE_CONFIG_DIR    config directory override.
  REMOTE_MOUSE_PORT          server port override.
  REMOTE_MOUSE_SSL_KEY_PATH  existing PEM private key path.
  REMOTE_MOUSE_SSL_CERT_PATH existing PEM certificate path.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes)
      YES=1
      shift
      ;;
    --package)
      NPM_PACKAGE="${2:-}"
      shift 2
      ;;
    --config-dir)
      CONFIG_DIR="${2:-}"
      shift 2
      ;;
    --port)
      PORT="${2:-}"
      shift 2
      ;;
    --https)
      HTTPS_CHOICE="true"
      shift
      ;;
    --no-https)
      HTTPS_CHOICE="false"
      shift
      ;;
    --generate-cert)
      GENERATE_CERT_CHOICE="true"
      shift
      ;;
    --no-generate-cert)
      GENERATE_CERT_CHOICE="false"
      shift
      ;;
    --ssl-key-path)
      SSL_KEY_PATH="${2:-}"
      shift 2
      ;;
    --ssl-cert-path)
      SSL_CERT_PATH="${2:-}"
      shift 2
      ;;
    --install-service)
      INSTALL_SERVICE_CHOICE="true"
      shift
      ;;
    --no-service)
      INSTALL_SERVICE_CHOICE="false"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$NPM_PACKAGE" ]]; then
  echo "Missing npm package name." >&2
  exit 1
fi

if [[ -z "$CONFIG_DIR" ]]; then
  echo "Missing config directory." >&2
  exit 1
fi

if [[ -z "$PORT" ]]; then
  echo "Missing port." >&2
  exit 1
fi

log() {
  printf '\n%s\n' "$*"
}

confirm() {
  local prompt="$1"
  if [[ "$YES" -eq 1 ]]; then
    printf '%s [Y/n] y\n' "$prompt"
    return 0
  fi

  if [[ ! -r /dev/tty ]]; then
    echo "Cannot prompt without a terminal. Rerun with -y to accept prompts automatically." >&2
    exit 1
  fi

  local answer
  read -r -p "$prompt [y/N] " answer </dev/tty
  case "$answer" in
    y|Y|yes|YES|Yes)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

prompt_value() {
  local prompt="$1"
  local default_value="${2:-}"
  local value

  if [[ "$YES" -eq 1 ]]; then
    printf '%s [%s] %s\n' "$prompt" "$default_value" "$default_value" >&2
    printf '%s\n' "$default_value"
    return
  fi

  if [[ ! -r /dev/tty ]]; then
    echo "Cannot prompt without a terminal. Rerun with -y and explicit options." >&2
    exit 1
  fi

  if [[ -n "$default_value" ]]; then
    read -r -p "$prompt [$default_value] " value </dev/tty
    printf '%s\n' "${value:-$default_value}"
  else
    read -r -p "$prompt " value </dev/tty
    printf '%s\n' "$value"
  fi
}

sudo_cmd() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    return 1
  fi
}

detect_package_manager() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "apt"
  elif command -v dnf >/dev/null 2>&1; then
    echo "dnf"
  elif command -v yum >/dev/null 2>&1; then
    echo "yum"
  elif command -v pacman >/dev/null 2>&1; then
    echo "pacman"
  elif command -v zypper >/dev/null 2>&1; then
    echo "zypper"
  else
    echo ""
  fi
}

package_for_dependency() {
  local manager="$1"
  local dependency="$2"
  case "$manager" in
    apt)
      case "$dependency" in
        node) echo "nodejs" ;;
        npm) echo "npm" ;;
        build) echo "build-essential" ;;
        x11) echo "libx11-dev" ;;
        xtst) echo "libxtst-dev" ;;
        png) echo "libpng++-dev" ;;
        wmctrl) echo "wmctrl" ;;
        yad) echo "yad" ;;
        openssl) echo "openssl" ;;
      esac
      ;;
    dnf|yum)
      case "$dependency" in
        node) echo "nodejs" ;;
        npm) echo "npm" ;;
        build) echo "gcc-c++ make" ;;
        x11) echo "libX11-devel" ;;
        xtst) echo "libXtst-devel" ;;
        png) echo "libpng-devel" ;;
        wmctrl) echo "wmctrl" ;;
        yad) echo "yad" ;;
        openssl) echo "openssl" ;;
      esac
      ;;
    pacman)
      case "$dependency" in
        node) echo "nodejs" ;;
        npm) echo "npm" ;;
        build) echo "base-devel" ;;
        x11) echo "libx11" ;;
        xtst) echo "libxtst" ;;
        png) echo "libpng" ;;
        wmctrl) echo "wmctrl" ;;
        yad) echo "yad" ;;
        openssl) echo "openssl" ;;
      esac
      ;;
    zypper)
      case "$dependency" in
        node) echo "nodejs" ;;
        npm) echo "npm" ;;
        build) echo "gcc-c++ make" ;;
        x11) echo "libX11-devel" ;;
        xtst) echo "libXtst-devel" ;;
        png) echo "libpng16-devel" ;;
        wmctrl) echo "wmctrl" ;;
        yad) echo "yad" ;;
        openssl) echo "openssl" ;;
      esac
      ;;
    *)
      echo ""
      ;;
  esac
}

node_major_version() {
  local version
  version="$(node --version 2>/dev/null || true)"
  version="${version#v}"
  version="${version%%.*}"
  if [[ "$version" =~ ^[0-9]+$ ]]; then
    printf '%s\n' "$version"
  else
    printf '0\n'
  fi
}

has_supported_node() {
  command -v node >/dev/null 2>&1 || return 1
  [[ "$(node_major_version)" -ge "$MIN_NODE_MAJOR" ]]
}

contains_word() {
  local needle="$1"
  shift
  local value
  for value in "$@"; do
    if [[ "$value" == "$needle" ]]; then
      return 0
    fi
  done
  return 1
}

install_nodesource_node_apt() {
  log "Installing Node.js $NODESOURCE_MAJOR.x from NodeSource for npm package compatibility."
  sudo_cmd apt-get update
  sudo_cmd apt-get install -y ca-certificates curl gnupg
  if [[ "$(id -u)" -eq 0 ]]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODESOURCE_MAJOR}.x" | bash -
  else
    curl -fsSL "https://deb.nodesource.com/setup_${NODESOURCE_MAJOR}.x" | sudo bash -
  fi
  sudo_cmd apt-get install -y nodejs
}

append_packages_for_dependency() {
  local manager="$1"
  local dependency="$2"
  local package_names
  package_names="$(package_for_dependency "$manager" "$dependency")"
  local package_name
  for package_name in $package_names; do
    MISSING_PACKAGES+=("$package_name")
  done
}

dedupe_words() {
  local seen=" "
  local value
  for value in "$@"; do
    if [[ "$seen" != *" $value "* ]]; then
      printf '%s\n' "$value"
      seen="${seen}${value} "
    fi
  done
}

can_compile_header() {
  local include_line="$1"
  local compiler="${CC:-cc}"
  if ! command -v "$compiler" >/dev/null 2>&1; then
    return 1
  fi

  printf '%s\nint main(void) { return 0; }\n' "$include_line" | "$compiler" -x c - -o /tmp/remote-mouse-install-check >/dev/null 2>&1
  rm -f /tmp/remote-mouse-install-check
}

check_functional_dependencies() {
  MISSING_DEPS=()

  has_supported_node || MISSING_DEPS+=("node")
  command -v npm >/dev/null 2>&1 || MISSING_DEPS+=("npm")

  if ! command -v gcc >/dev/null 2>&1 && ! command -v cc >/dev/null 2>&1; then
    MISSING_DEPS+=("build")
  fi
  command -v make >/dev/null 2>&1 || MISSING_DEPS+=("build")

  can_compile_header '#include <X11/Xlib.h>' || MISSING_DEPS+=("x11")
  can_compile_header '#include <X11/extensions/XTest.h>' || MISSING_DEPS+=("xtst")
  can_compile_header '#include <png.h>' || MISSING_DEPS+=("png")

  command -v wmctrl >/dev/null 2>&1 || MISSING_DEPS+=("wmctrl")
  command -v yad >/dev/null 2>&1 || MISSING_DEPS+=("yad")
  command -v openssl >/dev/null 2>&1 || MISSING_DEPS+=("openssl")
}

install_packages() {
  local manager="$1"
  shift
  case "$manager" in
    apt)
      sudo_cmd apt-get update
      sudo_cmd apt-get install -y "$@"
      ;;
    dnf)
      sudo_cmd dnf install -y "$@"
      ;;
    yum)
      sudo_cmd yum install -y "$@"
      ;;
    pacman)
      sudo_cmd pacman -Sy --needed --noconfirm "$@"
      ;;
    zypper)
      sudo_cmd zypper --non-interactive install "$@"
      ;;
    *)
      echo "Unsupported package manager." >&2
      return 1
      ;;
  esac
}

install_system_dependencies() {
  check_functional_dependencies

  if [[ "${#MISSING_DEPS[@]}" -eq 0 ]]; then
    log "System dependencies are already available."
    return
  fi

  local manager
  manager="$(detect_package_manager)"

  if [[ -z "$manager" ]]; then
    cat >&2 <<'EOF'
No supported package manager was detected.
Install the missing dependencies manually, then rerun the script.
EOF
    printf 'Missing dependency checks: %s\n' "${MISSING_DEPS[*]}" >&2
    if confirm "Continue without automatic dependency installation?"; then
      return
    fi
    exit 1
  fi

  MISSING_PACKAGES=()
  local dependency
  for dependency in $(dedupe_words "${MISSING_DEPS[@]}"); do
    append_packages_for_dependency "$manager" "$dependency"
  done

  mapfile -t MISSING_PACKAGES < <(dedupe_words "${MISSING_PACKAGES[@]}")

  log "Missing dependency checks: ${MISSING_DEPS[*]}"
  log "Suggested $manager packages: ${MISSING_PACKAGES[*]}"
  if confirm "Install missing system dependencies with $manager?"; then
    if [[ "$manager" == "apt" ]] && contains_word "node" "${MISSING_DEPS[@]}"; then
      install_nodesource_node_apt
      MISSING_PACKAGES=()
      for dependency in $(dedupe_words "${MISSING_DEPS[@]}"); do
        if [[ "$dependency" != "node" && "$dependency" != "npm" ]]; then
          append_packages_for_dependency "$manager" "$dependency"
        fi
      done
      mapfile -t MISSING_PACKAGES < <(dedupe_words "${MISSING_PACKAGES[@]}")
    fi
    if [[ "${#MISSING_PACKAGES[@]}" -gt 0 ]]; then
      install_packages "$manager" "${MISSING_PACKAGES[@]}"
    fi
    check_functional_dependencies
    if [[ "${#MISSING_DEPS[@]}" -ne 0 ]]; then
      echo "Some dependency checks still fail after package installation: ${MISSING_DEPS[*]}" >&2
      exit 1
    fi
  else
    echo "Cannot continue without required system dependencies." >&2
    exit 1
  fi
}

install_npm_package() {
  require_command npm
  local prefix
  prefix="$(npm config get prefix)"
  local npm_install=(npm install -g "$NPM_PACKAGE")
  if [[ -d "$NPM_PACKAGE" ]]; then
    npm_install=(npm install -g --install-links "$NPM_PACKAGE")
  fi

  log "Installing npm package: $NPM_PACKAGE"
  if [[ -w "$prefix" ]]; then
    "${npm_install[@]}"
  else
    sudo_cmd "${npm_install[@]}"
  fi
}

ensure_remote_mouse_cli() {
  if command -v remote-mouse >/dev/null 2>&1; then
    return
  fi

  echo "remote-mouse CLI was not found in PATH after npm installation." >&2
  echo "Open a new terminal or check npm global bin path with: npm bin -g" >&2
  exit 1
}

generate_cookie_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    date +%s%N
  fi
}

configure_https() {
  if [[ "$HTTPS_CHOICE" == "false" ]]; then
    HTTPS="false"
    return
  fi

  if [[ "$HTTPS_CHOICE" != "true" ]] && ! confirm "Serve Remote Mouse over HTTPS?"; then
    HTTPS="false"
    return
  fi

  HTTPS="true"
  local cert_dir="$CONFIG_DIR/certs"

  if [[ "$GENERATE_CERT_CHOICE" == "true" ]] || { [[ "$GENERATE_CERT_CHOICE" != "false" ]] && confirm "Generate a local self-signed certificate?"; }; then
    require_command openssl
    mkdir -p "$cert_dir"
    SSL_KEY_PATH="$cert_dir/remote-mouse.key"
    SSL_CERT_PATH="$cert_dir/remote-mouse.crt"
    openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
      -keyout "$SSL_KEY_PATH" \
      -out "$SSL_CERT_PATH" \
      -subj "/CN=remote-mouse.local" \
      -addext "subjectAltName=DNS:localhost,DNS:remote-mouse.local,IP:127.0.0.1"
  else
    if [[ -z "$SSL_KEY_PATH" ]]; then
      SSL_KEY_PATH="$(prompt_value "Path to the existing PEM private key")"
    fi
    if [[ -z "$SSL_CERT_PATH" ]]; then
      SSL_CERT_PATH="$(prompt_value "Path to the existing PEM certificate")"
    fi
    if [[ ! -f "$SSL_KEY_PATH" ]]; then
      echo "Private key not found: $SSL_KEY_PATH" >&2
      exit 1
    fi
    if [[ ! -f "$SSL_CERT_PATH" ]]; then
      echo "Certificate not found: $SSL_CERT_PATH" >&2
      exit 1
    fi
  fi
}

write_env_file() {
  mkdir -p "$CONFIG_DIR"
  local env_file="$CONFIG_DIR/.env"
  local cookie_secret
  cookie_secret="$(generate_cookie_secret)"

  if [[ -f "$env_file" ]]; then
    if confirm "Overwrite existing $env_file?"; then
      :
    else
      log "Keeping existing $env_file."
      return
    fi
  fi

  cat > "$env_file" <<EOF
PORT=$PORT
SERVER_HOST=
CONFIG_DIR=$CONFIG_DIR
PERSISTENCE_DB_PATH=$CONFIG_DIR/remote-mouse.sqlite3
ENV_FILE_PATH=$env_file

HTTPS=$HTTPS
SSL_KEY_PATH=$SSL_KEY_PATH
SSL_CERT_PATH=$SSL_CERT_PATH

ENTRY_PATH_ENABLED=true
ENTRY_PATH_FIXED=
ENTRY_PATH_TOKEN_LENGTH=24
ENTRY_PATH_ROTATE_INTERVAL_MIN=60
ENTRY_PATH_GRACE_MIN=120

SESSION_COOKIE_NAME=remote_mouse_session
SESSION_COOKIE_SECRET=$cookie_secret
SESSION_COOKIE_MAX_AGE_DAYS=7
SOCKET_EVENT_MAX_AGE_MS=1200

LOG_LEVEL=info
LOG_FORMAT=json
ADMIN_ACTIONS_ENABLED=true
SERVICE_NAME=remote-mouse.service
SERVICE_RESTART_COMMAND=
EOF

  chmod 600 "$env_file"
  log "Wrote $env_file"
}

install_service() {
  if [[ "$INSTALL_SERVICE_CHOICE" == "false" ]]; then
    INSTALL_SERVICE="false"
    return
  fi

  if [[ "$INSTALL_SERVICE_CHOICE" != "true" ]] && ! confirm "Install the user service?"; then
    INSTALL_SERVICE="false"
    return
  fi

  INSTALL_SERVICE="true"
  remote-mouse service install
  remote-mouse service restart
}

main() {
  log "Remote Mouse Linux installer"
  log "Package: $NPM_PACKAGE"
  log "Config directory: $CONFIG_DIR"

  install_system_dependencies
  require_command node
  require_command npm

  log "Node: $(node --version)"
  log "npm: $(npm --version)"

  install_npm_package
  ensure_remote_mouse_cli
  configure_https
  write_env_file
  install_service

  log "Installation complete."
  if [[ "$INSTALL_SERVICE" == "true" ]]; then
    echo "Service installed. Check status with: systemctl --user status remote-mouse.service"
  else
    echo "Start Remote Mouse with: remote-mouse"
  fi

  if [[ "$HTTPS" == "true" ]]; then
    echo "Browsers will warn about the self-signed certificate until it is trusted locally."
    echo "Use the browser advanced/details option to continue to the site."
  fi
}

main "$@"

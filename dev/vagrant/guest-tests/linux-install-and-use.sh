#!/usr/bin/env bash

set -euo pipefail

readonly WORKSPACE="/workspace/remote-mouse"
readonly CONFIG_DIRECTORY="${HOME}/.config/remote-mouse"
readonly PORT="3987"
readonly BASE_URL="http://127.0.0.1:${PORT}"
readonly ENV_FILE="${CONFIG_DIRECTORY}/.env"
readonly TEST_SENTINEL="remote-mouse-integration-preserved"

export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"

fail() {
    printf 'integration test: %s\n' "$*" >&2
    exit 1
}

wait_for_http() {
    local url="$1"
    local attempts=60

    while (( attempts > 0 )); do
        if curl --fail --silent --show-error "${url}" >/dev/null 2>&1; then
            return
        fi
        attempts=$((attempts - 1))
        sleep 1
    done

    fail "timed out waiting for ${url}"
}

assert_http_contains() {
    local url="$1"
    local expected="$2"
    local body

    # Keep curl out of a grep -q pipeline: grep deliberately closes that pipe
    # after the first match, which makes curl report a false write error.
    body="$(curl --fail --silent --show-error "${url}")"
    grep -Fq "${expected}" <<< "${body}" || fail "${url} does not contain ${expected}"
}

[[ -f "${WORKSPACE}/package.json" ]] || fail "repository is not mounted at ${WORKSPACE}"

expected_version="$(node -p "require('${WORKSPACE}/package.json').version" 2>/dev/null || true)"

"${WORKSPACE}/scripts/install-linux.sh" \
    --yes \
    --package "${WORKSPACE}" \
    --config-dir "${CONFIG_DIRECTORY}" \
    --port "${PORT}" \
    --no-https \
    --no-wayland \
    --install-service

[[ -n "${expected_version}" ]] || expected_version="$(node -p "require('${WORKSPACE}/package.json').version")"
[[ "$(remote-mouse version)" == "${expected_version}" ]] || fail 'installed CLI version differs from package.json'
systemctl --user is-enabled remote-mouse.service >/dev/null
systemctl --user is-active remote-mouse.service >/dev/null

grep -q '^PORT=3987$' "${ENV_FILE}" || fail 'installer did not persist the requested port'
grep -q '^HTTPS=false$' "${ENV_FILE}" || fail 'installer did not disable HTTPS'

# Disable the secret entry path only in this disposable guest so black-box HTTP
# assertions can exercise the web client without extracting a production token.
sed -i 's/^ENTRY_PATH_ENABLED=true$/ENTRY_PATH_ENABLED=false/' "${ENV_FILE}"
printf '\nINTEGRATION_SENTINEL=%s\n' "${TEST_SENTINEL}" >> "${ENV_FILE}"
config_checksum="$(sha256sum "${ENV_FILE}" | cut -d ' ' -f 1)"

systemctl --user restart remote-mouse.service
wait_for_http "${BASE_URL}/health"

health_payload="$(curl --fail --silent --show-error "${BASE_URL}/health")"
node -e '
const payload = JSON.parse(process.argv[1]);
if (payload.ok !== true || payload.version !== process.argv[2]) process.exit(1);
' "${health_payload}" "${expected_version}" || fail 'health payload is invalid'

assert_http_contains "${BASE_URL}/" '<title>Remote Mouse</title>'
assert_http_contains "${BASE_URL}/socket.io/socket.io.js" 'Socket.IO'

# Re-run the installer as the update path. The complete environment file,
# including its generated secret and local sentinel, must remain unchanged.
"${WORKSPACE}/scripts/install-linux.sh" \
    --yes \
    --package "${WORKSPACE}" \
    --config-dir "${CONFIG_DIRECTORY}" \
    --port "${PORT}" \
    --no-https \
    --no-wayland \
    --install-service

[[ "$(sha256sum "${ENV_FILE}" | cut -d ' ' -f 1)" == "${config_checksum}" ]] \
    || fail 'reinstallation changed the existing configuration or secrets'
grep -q "^INTEGRATION_SENTINEL=${TEST_SENTINEL}$" "${ENV_FILE}" \
    || fail 'reinstallation removed local configuration'

systemctl --user restart remote-mouse.service
wait_for_http "${BASE_URL}/health"

printf 'Linux installation and use integration test passed.\n'

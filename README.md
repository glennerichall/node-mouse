# Remote Mouse

Remote Mouse is a web-based remote control for operating a computer from a phone, tablet, or another browser on the same network. The server exposes a mobile-friendly interface for mouse and keyboard control, browser shortcuts, admin actions, and optional Samsung TV remote commands.

## Overview

The application includes:

- a token-based entry path with QR code access
- a mobile touchpad for mouse movement, clicking, and scrolling
- a keyboard panel for text input and special keys
- browser shortcut actions
- VLC media controls when VLC is available on the host
- admin actions from the client UI
- a server info page
- optional Samsung TV remote integration

## Screenshots

| Remote control | Local preferences |
| --- | --- |
| <img src="https://raw.githubusercontent.com/glennerichall/node-mouse/main/.artifacts/screenshots/remote-mobile-home.png" alt="Mobile remote control screen" width="260"> | <img src="https://raw.githubusercontent.com/glennerichall/node-mouse/main/.artifacts/screenshots/remote-mobile-preferences.png" alt="Mobile local preferences screen" width="260"> |

| VLC remote | Admin configuration |
| --- | --- |
| <img src="https://raw.githubusercontent.com/glennerichall/node-mouse/main/.artifacts/screenshots/remote-mobile-vlc.png" alt="Mobile VLC remote screen" width="260"> | <img src="https://raw.githubusercontent.com/glennerichall/node-mouse/main/.artifacts/screenshots/remote-mobile-config.png" alt="Mobile admin configuration screen" width="260"> |

| Server info |
| --- |
| <img src="https://raw.githubusercontent.com/glennerichall/node-mouse/main/.artifacts/screenshots/remote-mobile-server-info.png" alt="Mobile server info screen" width="260"> |

## Install

### Automatic (preferred)

Linux installer:

[scripts/install-linux.sh](https://raw.githubusercontent.com/glennerichall/node-mouse/main/scripts/install-linux.sh)

```bash
curl -fsSL https://raw.githubusercontent.com/glennerichall/node-mouse/main/scripts/install-linux.sh | bash
```

For local development from this repository, run [`scripts/install-linux.sh`](./scripts/install-linux.sh):

```bash
scripts/install-linux.sh
```

Use `-y` to automatically accept every confirmation prompt:

```bash
scripts/install-linux.sh -y
```

When running the installer through `curl | bash`, pass options after `bash -s --`:

```bash
curl -fsSL https://raw.githubusercontent.com/glennerichall/node-mouse/main/scripts/install-linux.sh | bash -s -- -y
```

The Linux installer is also the supported migration path for an existing
installation. It updates the npm package and missing uinput permissions while
preserving the existing `.env`, session secret, certificates and SQLite data.
Missing migration keys are appended idempotently. Use `--overwrite-config`
only when replacing the complete `.env` is intentional. After uinput is added
to an existing user, reconnect the desktop session before restarting the user
service.

Windows installer:

[scripts/install-windows.ps1](https://raw.githubusercontent.com/glennerichall/node-mouse/main/scripts/install-windows.ps1)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-windows.ps1
```

Use `-Yes` to automatically accept every confirmation prompt:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-windows.ps1 -Yes
```

For a downloaded script:

```powershell
iwr https://raw.githubusercontent.com/glennerichall/node-mouse/main/scripts/install-windows.ps1 -OutFile install-windows.ps1
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
```

Downloaded script with automatic confirmations:

```powershell
iwr https://raw.githubusercontent.com/glennerichall/node-mouse/main/scripts/install-windows.ps1 -OutFile install-windows.ps1
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1 -Yes
```

macOS installer scripts will be added later.

### Session cookie secret

The Linux and Windows installers generate a unique 32-byte random
`SESSION_COOKIE_SECRET` in the configuration `.env` file. Production startup
refuses the default `change-me` value and secrets shorter than 64 characters.
For a manual production setup, generate a secret with
`openssl rand -hex 32` and keep it private; never include it in logs or support
reports.

To rotate the secret, replace `SESSION_COOKIE_SECRET` in the configuration
`.env` with a newly generated value and restart Remote Mouse. Existing browser
session cookies will no longer be valid, so connected clients must establish a
new session. Back up the configuration file securely before editing it, and do
not reuse the previous secret.

The automatic installer is expected to handle:

- Node.js installation or validation
- platform native dependencies
- npm package installation
- initial `.env` creation
- optional local service installation
- first-run access URL and QR code display

### Custom

Use the custom installation path when you want to install each dependency yourself, run from source, or tune the host service manually.

#### Node.js

Install an active Node.js LTS release before installing Remote Mouse. The application uses npm scripts and native Node.js modules, so both `node` and `npm` must be available in your terminal.

##### Linux and macOS

Using `nvm` is recommended because it keeps the Node.js version isolated from the system packages:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install --lts
nvm use --lts
```

Restart your terminal if `nvm` is not available immediately after installation.

##### Windows

Install the Node.js LTS release from the official installer, or use `winget`:

```powershell
winget install OpenJS.NodeJS.LTS
```

Open a new terminal after installation so `node` and `npm` are available in `PATH`.

##### Verify

```bash
node --version
npm --version
```

#### Platform Dependencies

This project uses RobotJS on X11, Windows and macOS. On Linux Wayland it uses an
in-process C Node-API bridge to `/dev/uinput` by default. The isolated XDG
RemoteDesktop/libei helper is kept as an optional strategy when
compositor-managed consent is preferred.

VLC media player is optional. Install it on the host machine if you want the VLC remote to appear and control media playback.

##### Linux

Typical Debian or Ubuntu packages:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libx11-dev libxtst-dev libpng-dev wmctrl
```

For Wayland development, build the default uinput bridge and grant only the
desktop user access to `/dev/uinput`:

```bash
npm run build:uinput
sudo scripts/configure-uinput-access.sh "$USER"
```

Reconnect the desktop session after creating the dedicated group. Do not add
the user to the general `input` group. To use the optional portal strategy,
install `pkg-config libei-dev liboeffis-dev`, run `npm run build:wayland`, and
set `REMOTE_MOUSE_WAYLAND_INPUT=portal`.

Notes:

- `libx11-dev`, `libxtst-dev`, and `libpng-dev` are required for the native input and QR overlay integrations
- `wmctrl` is used for browser focus and window activation on Linux
- the Linux QR overlay is built as an isolated native X11/XWayland helper
- X11 uses RobotJS; Wayland uses uinput without a system consent dialog. Remote
  Mouse authentication remains responsible for authorizing remote commands
- with `REMOTE_MOUSE_WAYLAND_INPUT=portal`, an interactive start opens the
  local Remote Desktop dialog; for a service, run `remote-mouse wayland authorize`
- Wayland preview is not yet available; it remains disabled until the PipeWire
  capture adapter is implemented

##### Windows

Typical requirements:

- Microsoft Visual Studio C++ Build Tools for native Node modules
- Python available in `PATH` if native module compilation is needed
- PowerShell and Windows Forms support for the QR overlay behavior

Notes:

- the Windows QR overlay uses PowerShell with Windows Forms
- depending on your environment, `npm install` may use a prebuilt binary or may require local native compilation

#### Package Install

Install the published npm package globally:

```bash
npm install -g @velor/remote-mouse
remote-mouse
```

On startup, the server prints the client access URL and the corresponding QR code.

#### Source Install

Use this path when working from a checked-out repository:

```bash
npm install
npm start
```

On startup, the server prints the client access URL and the corresponding QR code.

#### Self-Signed HTTPS Certificate

HTTPS can be enabled with a local self-signed certificate. This is useful when a browser feature or deployment context requires a secure origin.

Create a local certificate directory:

```bash
mkdir -p certs
```

Generate a self-signed certificate:

```bash
openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout certs/remote-mouse.key \
  -out certs/remote-mouse.crt \
  -subj "/CN=remote-mouse.local" \
  -addext "subjectAltName=DNS:localhost,DNS:remote-mouse.local,IP:127.0.0.1"
```

Enable HTTPS in `.env`:

```dotenv
HTTPS=true
SSL_KEY_PATH=certs/remote-mouse.key
SSL_CERT_PATH=certs/remote-mouse.crt
```

Browsers will warn about self-signed certificates until the certificate is trusted locally. This is expected for a local self-signed certificate. Open the advanced/details option in the browser warning and choose to continue to the site.

#### Linux Deployment

The application can manage its own `systemd --user` service.

Typical setup:

1. Install the package with npm, or use the source install path above.
2. Create a `.env` file based on [`.env.example`](./.env.example).
3. Run `remote-mouse service install`.
4. Use `remote-mouse service restart`, `remote-mouse service disable`, or `remote-mouse service uninstall` as needed.

The generated unit is equivalent to the following:

```ini
[Unit]
Description=Remote Mouse Server
After=graphical-session.target network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/path/to/remote-mouse/bin/remote-mouse.js
Restart=on-failure
RestartSec=2
Environment=PATH=/path/to/nodejs:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
PassEnvironment=DISPLAY WAYLAND_DISPLAY XAUTHORITY DBUS_SESSION_BUS_ADDRESS

[Install]
WantedBy=default.target
```

Depending on the graphical environment, passing the user session environment may be necessary for UI-related integrations.

X11 control continues through RobotJS. Under Wayland, mouse and keyboard input
use uinput by default, independently of the desktop portal backend. The portal
implementation remains selectable with `REMOTE_MOUSE_WAYLAND_INPUT=portal`.
Cursor preview is still disabled under Wayland to prevent the native
`X_GetImage` failure; native capture remains planned through ScreenCast and
PipeWire.

#### Windows Deployment

On Windows, the application manages a Task Scheduler entry that runs at user logon.

Typical setup:

1. Install the package with npm, or use the source install path above.
2. Create a `.env` file based on [`.env.example`](./.env.example).
3. Run `remote-mouse service install`.
4. Use `remote-mouse service restart`, `remote-mouse service disable`, or `remote-mouse service uninstall` as needed.

The generated scheduled task follows this model:

- Trigger: `At log on`
- Action: `schtasks /Create`
- Task name: the configured `serviceName`
- Command: launches the `remote-mouse` entrypoint with `REMOTE_MOUSE_DAEMON=1`
- Run only when the user is logged on

Notes:

- running in a user session is usually preferable because mouse, keyboard, browser, and overlay integrations depend on an interactive desktop session
- if you rely on the QR overlay or browser-opening actions, make sure the task runs in the same desktop session as the logged-in user
- if you installed the app globally, the generated task uses the `remote-mouse` CLI entrypoint directly

## Configuration

Startup configuration is handled through a `.env` file. Instead of duplicating every environment variable here, use [`.env.example`](./.env.example) as the reference.

### Reverse proxy

Forwarded client addresses are ignored by default. When Remote Mouse runs behind
a reverse proxy, set `TRUST_PROXY` to the proxy IP or subnet (multiple values are
comma-separated). For a proxy on the same machine, use `TRUST_PROXY=loopback`.
The proxy must replace, rather than append to, client-supplied forwarding headers.
Never trust a subnet containing untrusted clients: a trusted proxy can affect the
localhost authentication bypass as well as the address recorded for sessions.

Same-origin browser requests are allowed by default. If a separately hosted PWA
needs to call this server, set `ALLOWED_ORIGINS` to its exact origin (or a
comma-separated list of exact origins), including the scheme and port when
non-default. Wildcard origins are not supported; this setting permits credentialed
browser requests and should only contain trusted origins. It does not yet change
the session cookie's `SameSite` policy, so a separately hosted cross-site PWA
still needs the dedicated cookie/deployment work planned for the PWA milestone.

### Access and Administration

Paired devices start with the `controller` role. To allow temporary remote
administration, configure the password policy and password in the server `.env`:

```dotenv
ADMIN_PASSWORD=replace-with-a-long-unique-password
ADMIN_PASSWORD_MIN_LENGTH=8
ADMIN_UNLOCK_MINUTES=15
```

Restart the service after changing the file. A password field then appears in
the left drawer. A successful unlock elevates only the current paired session,
expires automatically, and is cleared by a server restart. Prefer HTTPS before
entering this password over a network. The password remains masked unless the
user explicitly selects **Show password**. While the session is elevated, the
unlock form is replaced by **Lock**, which immediately removes the elevation
from that paired session without affecting other devices.

#### Upgrading from a version without remote admin unlock

The previous version cannot unlock administration from a paired mobile device.
If its desktop page also offers no clickable way to open the left drawer, run
the package update once from a terminal on the server (or through SSH):

```bash
npm update -g @velor/remote-mouse
remote-mouse service restart
```

This keeps the existing configuration and database. If npm reports a permission
error, use the same Node/npm installation and privilege method that were used
for the original global installation. Do not delete the configuration directory
or rerun the installer with configuration overwrite enabled.

After the update, add `ADMIN_PASSWORD` and optionally `ADMIN_UNLOCK_MINUTES` to
the existing `.env`, restart the service, rescan the QR if necessary, and use
the password field in the left drawer. Later updates can then be installed from
the authenticated mobile administration controls.

Useful server pages:

- `/qr` displays the entry QR code
- `/ui/admin/server-info` shows server state, effective configuration, and recent logs
- `/ui/admin/config` lets you edit persisted settings grouped to match the configuration object structure

Useful CLI commands:

- `help` displays the available CLI commands
- `version` displays the installed package version without contacting the daemon
- `info` prints the server capabilities
- `config` prints the effective persisted configuration
- `config get <path>` prints one persisted configuration value
- `config set <path> <value>` updates one persisted configuration value
- `sys-config` prints the system configuration
- `system-config` is an alias of `sys-config`
- `service install` installs the local daemon/service
- `service disable` disables the local daemon/service
- `service uninstall` uninstalls the local daemon/service
- `service restart` restarts the local daemon/service
- `tasks` prints the task manager snapshot
- `task-manager` is an alias of `tasks`
- `update-events` prints persisted update-manager events
- `samsung-detect` detects Samsung TVs available on the network
- `tokens` lists persisted entry tokens
- `open-qr` opens the QR page on the server
- `qr` is an alias of `open-qr`

Example:

- `remote-mouse config get logging.level`

### Routes

The server exposes two main HTTP surfaces:

- UI routes for HTML pages
- API routes for JSON and SSE

#### UI Routes

- `GET /` serves the client application
- `GET /qr` displays the entry QR code page
- `GET /ui/admin/server-info` serves the server info page
- `GET /ui/admin/config` serves the admin configuration page

#### Session Route

- `GET /api/sessions/:token` validates an entry token, creates the signed session cookie, and redirects to `/`

Random entry tokens rotate every 60 minutes by default. A previous token remains
valid for a 120-minute grace period so an already displayed QR code does not
expire immediately after rotation. Set `ENTRY_PATH_ROTATE_INTERVAL_MIN` and
`ENTRY_PATH_GRACE_MIN` explicitly to change these values; existing `.env`
values continue to take precedence over the defaults.

#### Admin API Routes

- `GET /api/admin/server-info/data` returns the current server snapshot:
  version, uptime, connected clients, tasks, tokens, effective config, system config, and recent logs
- `GET /api/admin/configs` returns the managed configuration entries, schema, defaults, and managed paths
- `GET /api/admin/configs/:configId` returns one managed configuration entry
- `PATCH /api/admin/configs/:configId` updates one managed configuration entry
- `DELETE /api/admin/configs/:configId` resets one managed configuration entry to its default value
- `POST /api/admin/subs/configs` creates a config SSE subscription and returns its id plus the stream URL
- `GET /api/admin/subs/:id` opens the SSE stream for a previously created subscription
- `DELETE /api/admin/subs/:id` deletes a previously created subscription
- `POST /api/admin/restart-service` requests a local service restart through the application daemon service

#### Client API Routes

Authenticated controller sessions use a read-only API surface that does not
expose administrative configuration:

- `GET /api/client/config` returns the functional configuration required by the remote
- `GET /api/client/remotes` returns the available remote controls
- `GET /api/client/remotes/browsers` returns available browser launchers
- `POST /api/client/subs/configs` creates a filtered client configuration subscription
- `GET /api/client/subs/:id` opens its SSE stream
- `DELETE /api/client/subs/:id` deletes the subscription

#### Health Route

- `GET /health` returns a simple health payload with the current application version

#### Static Assets

After session validation, static assets are also available through:

- `/client/*`
- `/utils/shared/*`
- files served from `public/`

## Notes

- client access is controlled by either a generated token path or a fixed entry path, depending on configuration
- HTTPS can be enabled when required by the deployment context
- Samsung TV integration is optional and disabled by default

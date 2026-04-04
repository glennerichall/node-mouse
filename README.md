# Remote Mouse

Remote Mouse is a web-based remote control for operating a computer from a phone, tablet, or another browser on the same network. The server exposes a mobile-friendly interface for mouse and keyboard control, browser shortcuts, admin actions, and optional Samsung TV remote commands.

## Overview

The application includes:

- a token-based entry path with QR code access
- a mobile touchpad for mouse movement, clicking, and scrolling
- a keyboard panel for text input and special keys
- browser shortcut actions
- admin actions from the client UI
- a server info page
- optional Samsung TV remote integration

## Platform Dependencies

This project relies on `@hurdlegroup/robotjs`, which requires native dependencies.

### Linux

Typical Debian or Ubuntu packages:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libx11-dev libxtst-dev libpng++-dev wmctrl yad
```

Notes:

- `libx11-dev`, `libxtst-dev`, and `libpng++-dev` are required for the native mouse and keyboard integration
- `wmctrl` is used for browser focus and window activation on Linux
- `yad` is used for the Linux QR overlay
- an X11 session is required for the Linux desktop control features

### Windows

Typical requirements:

- Microsoft Visual Studio C++ Build Tools for native Node modules
- Python available in `PATH` if native module compilation is needed
- PowerShell and Windows Forms support for the QR overlay behavior

Notes:

- the Windows QR overlay uses PowerShell with Windows Forms
- depending on your environment, `npm install` may use a prebuilt binary or may require local native compilation

## Getting Started

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm start
```

On startup, the server prints the client access URL and the corresponding QR code.

## Configuration

Startup configuration is handled through a `.env` file. Instead of duplicating every environment variable here, use [`.env.example`](./.env.example) as the reference.

## Access and Administration

Useful server pages:

- `/qr` displays the entry QR code
- `/ui/admin/server-info` shows server state, effective configuration, and recent logs
- `/ui/admin/config` lets you edit persisted settings grouped to match the configuration object structure

Useful CLI commands:

- `help` displays the available CLI commands
- `config` prints the effective persisted configuration
- `config get <path>` prints one persisted configuration value
- `config set <path> <value>` updates one persisted configuration value
- `sys-config` prints the system configuration
- `tasks` prints the task manager snapshot
- `task-manager` is an alias of `tasks`
- `tokens` lists persisted entry tokens
- `open-qr` opens the QR page on the server
- `qr` is an alias of `open-qr`

## Routes

The server exposes two main HTTP surfaces:

- UI routes for HTML pages
- API routes for JSON and SSE

### UI Routes

- `GET /` serves the client application
- `GET /qr` displays the entry QR code page
- `GET /ui/admin/server-info` serves the server info page
- `GET /ui/admin/config` serves the admin configuration page

### Session Route

- `GET /api/sessions/:token` validates an entry token, creates the signed session cookie, and redirects to `/`

### Admin API Routes

- `GET /api/admin/server-info/data` returns the current server snapshot:
  version, uptime, connected clients, tasks, tokens, effective config, system config, and recent logs
- `GET /api/admin/configs` returns the managed configuration entries, schema, defaults, and managed paths
- `GET /api/admin/configs/:configId` returns one managed configuration entry
- `PATCH /api/admin/configs/:configId` updates one managed configuration entry
- `DELETE /api/admin/configs/:configId` resets one managed configuration entry to its default value
- `POST /api/admin/subs/configs` creates a config SSE subscription and returns its id plus the stream URL
- `GET /api/admin/subs/:id` opens the SSE stream for a previously created subscription
- `DELETE /api/admin/subs/:id` deletes a previously created subscription
- `POST /api/admin/restart-service` requests a local service restart through `systemctl --user`

### Health Route

- `GET /health` returns a simple health payload with the current application version

### Static Assets

After session validation, static assets are also available through:

- `/client/*`
- `/utils/shared/*`
- files served from `public/`

## Linux Deployment

The server can be run as a `systemd --user` service. Minimal example:

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
Environment=NODE_ENV=production
PassEnvironment=DISPLAY WAYLAND_DISPLAY XAUTHORITY DBUS_SESSION_BUS_ADDRESS

[Install]
WantedBy=default.target
```

Depending on the graphical environment, passing the user session environment may be necessary for UI-related integrations.

An X11 session is required for the Linux desktop control features.

## Windows Deployment

On Windows, the simplest deployment approach is to run the application at user logon with Task Scheduler.

Typical setup:

1. Install dependencies in the project directory with `npm install`.
2. Create a `.env` file based on [`.env.example`](./.env.example).
3. Create a scheduled task that runs at logon for the target user.
4. Start the application with `node index.js` from the project directory.

Suggested Task Scheduler settings:

- Trigger: `At log on`
- Action: `Start a program`
- Program/script: path to `node.exe`
- Add arguments: `index.js`
- Start in: path to the project directory
- Run only when the user is logged on

Notes:

- running in a user session is usually preferable because mouse, keyboard, browser, and overlay integrations depend on an interactive desktop session
- if you rely on the QR overlay or browser-opening actions, make sure the task runs in the same desktop session as the logged-in user
- if you installed the app globally and prefer the CLI entrypoint, you can use the `remote-mouse` executable instead of `node index.js`

## Notes

- client access is controlled by either a generated token path or a fixed entry path, depending on configuration
- HTTPS can be enabled when required by the deployment context
- Samsung TV integration is optional and disabled by default

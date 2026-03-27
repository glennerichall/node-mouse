import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  expandHomePath,
  loadEnvFile,
  readBoolean,
  readNumber,
  readString,
  resolveEnvFilePath,
} from '../../utils/server/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');

const envFilePath = resolveEnvFilePath({
  appRoot: projectRoot,
  explicitEnvFilePath: process.env.ENV_FILE_PATH || '',
});
loadEnvFile(envFilePath);

function readPackageJson() {
  try {
    const raw = fs.readFileSync(packageJsonPath, 'utf8');
    return JSON.parse(raw);
  } catch (_error) {
    return {};
  }
}

const packageJson = readPackageJson();

export const PORT = readNumber('PORT', 3000, { min: 1, max: 65535 });
export const SERVER_HOST = readString('SERVER_HOST', '');
export const MOUSE_SPEED = readNumber('MOUSE_SPEED', 1.3, { min: 0.1, max: 10 });
export const SCROLL_SPEED = readNumber('SCROLL_SPEED', 0.25, { min: 0.01, max: 10 });
export const HTTPS_ENABLED = readBoolean('HTTPS', false);
export const SSL_KEY_PATH = readString('SSL_KEY_PATH', '');
export const SSL_CERT_PATH = readString('SSL_CERT_PATH', '');
export const TOP_BAR_OFFSET_PX = readNumber('TOP_BAR_OFFSET_PX', 32, { min: 0, max: 400 });
export const PREVIEW_WIDTH = readNumber('PREVIEW_WIDTH', 128, { min: 32, max: 800 });
export const PREVIEW_HEIGHT = readNumber('PREVIEW_HEIGHT', 84, { min: 32, max: 800 });
export const PREVIEW_FPS = readNumber('PREVIEW_FPS', 6, { min: 1, max: 30 });
export const DESKTOP_NOTIFICATIONS_ENABLED = readBoolean('DESKTOP_NOTIFICATIONS_ENABLED', true);
export const CLIENT_NOTIFICATIONS_ENABLED = readBoolean('CLIENT_NOTIFICATIONS_ENABLED', true);
export const NOTIFICATION_TTL_MS = readNumber('NOTIFICATION_TTL_MS', 2200, { min: 500, max: 60_000 });
export const ADMIN_ACTIONS_ENABLED = readBoolean('ADMIN_ACTIONS_ENABLED', true);
export const SERVICE_NAME = readString('SERVICE_NAME', 'remote-mouse.service');
export const UPDATE_CHECK_ENABLED = readBoolean('UPDATE_CHECK_ENABLED', false);
export const UPDATE_CHECK_INTERVAL_MIN = readNumber('UPDATE_CHECK_INTERVAL_MIN', 360, { min: 1, max: 24 * 60 });
export const UPDATE_CHECK_SOURCE = readString('UPDATE_CHECK_SOURCE', 'auto').toLowerCase();
export const UPDATE_CHECK_PACKAGE = readString('UPDATE_CHECK_PACKAGE', String(packageJson.name || '').trim());
export const UPDATE_CHECK_CURRENT_VERSION = readString(
  'UPDATE_CHECK_CURRENT_VERSION',
  String(packageJson.version || '').trim(),
);
export const UPDATE_CHECK_GIT_REMOTE = readString('UPDATE_CHECK_GIT_REMOTE', 'origin');
export const UPDATE_CHECK_GIT_REF = readString('UPDATE_CHECK_GIT_REF', 'HEAD');
export const UPDATE_INSTALL_COMMAND = readString('UPDATE_INSTALL_COMMAND', '');
export const UPDATE_INSTALL_TIMEOUT_SEC = readNumber('UPDATE_INSTALL_TIMEOUT_SEC', 600, { min: 10, max: 7200 });
export const ENTRY_PATH_ENABLED = readBoolean('ENTRY_PATH_ENABLED', true);
export const ENTRY_PATH_FIXED = readString('ENTRY_PATH_FIXED', '');
export const ENTRY_PATH_TOKEN_LENGTH = readNumber('ENTRY_PATH_TOKEN_LENGTH', 24, { min: 8, max: 128 });
export const ENTRY_PATH_ROTATE_INTERVAL_MIN = readNumber('ENTRY_PATH_ROTATE_INTERVAL_MIN', 60, { min: 1, max: 24 * 60 });
export const ENTRY_PATH_GRACE_MIN = readNumber('ENTRY_PATH_GRACE_MIN', 120, { min: 1, max: 24 * 60 });
const entryPathStateFileRaw = readString('ENTRY_PATH_STATE_FILE', '');
export const ENTRY_PATH_STATE_FILE = expandHomePath(
  entryPathStateFileRaw || path.join(os.homedir(), '.config', 'remote-mouse', 'entry-token-state.json'),
);
export const SESSION_COOKIE_NAME = readString('SESSION_COOKIE_NAME', 'remote_mouse_session');
export const SESSION_COOKIE_SECRET = readString('SESSION_COOKIE_SECRET', 'change-me');
export const SESSION_COOKIE_MAX_AGE_DAYS = readNumber('SESSION_COOKIE_MAX_AGE_DAYS', 7, { min: 1, max: 365 });
export const SOCKET_EVENT_MAX_AGE_MS = readNumber('SOCKET_EVENT_MAX_AGE_MS', 1200, { min: 50, max: 60_000 });
export const QR_OVERLAY_ENABLED = readBoolean('QR_OVERLAY_ENABLED', true);
export const QR_OVERLAY_SIZE = readNumber('QR_OVERLAY_SIZE', 75, { min: 32, max: 800 });
export const QR_OVERLAY_MARGIN = readNumber('QR_OVERLAY_MARGIN', 14, { min: 0, max: 400 });
export const HAS_GRAPHICAL_DISPLAY = Boolean(readString('DISPLAY') || readString('WAYLAND_DISPLAY'));

export function logStartupConfig() {
  const protocol = HTTPS_ENABLED ? 'https' : 'http';
  console.log('Configuration:');
  console.log(`- protocol: ${protocol}`);
  console.log(`- port: ${PORT}`);
  console.log(`- serverHost: ${SERVER_HOST || '(auto LAN detection)'}`);
  console.log(`- entryPathEnabled: ${ENTRY_PATH_ENABLED || Boolean(ENTRY_PATH_FIXED)}`);
  console.log(`- entryPathFixed: ${ENTRY_PATH_FIXED || '(random)'}`);
  console.log(`- entryPathTokenLength: ${ENTRY_PATH_TOKEN_LENGTH}`);
  console.log(`- entryPathRotateMin: ${ENTRY_PATH_ROTATE_INTERVAL_MIN}`);
  console.log(`- entryPathGraceMin: ${ENTRY_PATH_GRACE_MIN}`);
  console.log(`- entryPathStateFile: ${ENTRY_PATH_STATE_FILE}`);
  console.log(`- sessionCookieName: ${SESSION_COOKIE_NAME}`);
  console.log(`- sessionCookieMaxAgeDays: ${SESSION_COOKIE_MAX_AGE_DAYS}`);
  console.log(`- sessionCookieSecure: ${HTTPS_ENABLED}`);
  console.log(`- sessionCookieSecretSet: ${SESSION_COOKIE_SECRET !== 'change-me'}`);
  console.log(`- socketEventMaxAgeMs: ${SOCKET_EVENT_MAX_AGE_MS}`);
  console.log(`- mouseSpeed: ${MOUSE_SPEED}`);
  console.log(`- scrollSpeed: ${SCROLL_SPEED}`);
  console.log(`- preview: ${PREVIEW_WIDTH}x${PREVIEW_HEIGHT} @ ${PREVIEW_FPS}fps`);
  console.log(`- desktopNotifications: ${DESKTOP_NOTIFICATIONS_ENABLED}`);
  console.log(`- clientNotifications: ${CLIENT_NOTIFICATIONS_ENABLED}`);
  console.log(`- adminActionsEnabled: ${ADMIN_ACTIONS_ENABLED}`);
  console.log(`- serviceName: ${SERVICE_NAME}`);
  console.log(`- updateInstallCommand: ${UPDATE_INSTALL_COMMAND || '(unset)'}`);
  console.log(`- updateInstallTimeoutSec: ${UPDATE_INSTALL_TIMEOUT_SEC}`);
  console.log(`- updateCheck: enabled=${UPDATE_CHECK_ENABLED} source=${UPDATE_CHECK_SOURCE} every=${UPDATE_CHECK_INTERVAL_MIN}min package=${UPDATE_CHECK_PACKAGE || '(none)'} current=${UPDATE_CHECK_CURRENT_VERSION || '(none)'} git=${UPDATE_CHECK_GIT_REMOTE}/${UPDATE_CHECK_GIT_REF}`);
  console.log(`- qrOverlay: size=${QR_OVERLAY_SIZE}px margin=${QR_OVERLAY_MARGIN}px topOffset=${TOP_BAR_OFFSET_PX}px`);
  console.log(`- graphicalDisplay: ${HAS_GRAPHICAL_DISPLAY}`);
  console.log(`- httpsEnabled: ${HTTPS_ENABLED}`);
  if (HTTPS_ENABLED) {
    console.log(`- sslKeyPath: ${SSL_KEY_PATH || '(missing)'}`);
    console.log(`- sslCertPath: ${SSL_CERT_PATH || '(missing)'}`);
  }
  console.log('');
}

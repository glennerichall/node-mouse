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
} from '../utils/env.js';

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
export const LOG_LEVEL = readString('LOG_LEVEL', 'info').toLowerCase();
export const LOG_FORMAT = readString('LOG_FORMAT', 'json').toLowerCase();
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
export const UPDATE_CHECK_COMMAND = readString('UPDATE_CHECK_COMMAND', '');
export const UPDATE_CHECK_TIMEOUT_SEC = readNumber('UPDATE_CHECK_TIMEOUT_SEC', 20, { min: 1, max: 600 });
export const UPDATE_CHECK_PACKAGE = readString('UPDATE_CHECK_PACKAGE', String(packageJson.name || '').trim());
export const UPDATE_CHECK_CURRENT_VERSION = readString(
  'UPDATE_CHECK_CURRENT_VERSION',
  String(packageJson.version || '').trim(),
);
export const UPDATE_CHECK_GIT_REMOTE = readString('UPDATE_CHECK_GIT_REMOTE', 'origin');
export const UPDATE_CHECK_GIT_REF = readString('UPDATE_CHECK_GIT_REF', 'HEAD');
export const UPDATE_INSTALL_COMMAND = readString('UPDATE_INSTALL_COMMAND', '');
export const UPDATE_INSTALL_TIMEOUT_SEC = readNumber('UPDATE_INSTALL_TIMEOUT_SEC', 600, { min: 10, max: 7200 });
export const UPDATE_INSTALL_AUTO_MERGE_ENV = readBoolean('UPDATE_INSTALL_AUTO_MERGE_ENV', true);
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

export function getStartupConfigSnapshot() {
  const protocol = HTTPS_ENABLED ? 'https' : 'http';
  return {
    protocol,
    port: PORT,
    serverHost: SERVER_HOST,
    entryPath: {
      enabled: ENTRY_PATH_ENABLED || Boolean(ENTRY_PATH_FIXED),
      fixed: ENTRY_PATH_FIXED,
      tokenLength: ENTRY_PATH_TOKEN_LENGTH,
      rotateMin: ENTRY_PATH_ROTATE_INTERVAL_MIN,
      graceMin: ENTRY_PATH_GRACE_MIN,
      stateFile: ENTRY_PATH_STATE_FILE,
    },
    session: {
      cookieName: SESSION_COOKIE_NAME,
      cookieSecret: SESSION_COOKIE_SECRET,
      cookieMaxAgeDays: SESSION_COOKIE_MAX_AGE_DAYS,
      cookieSecure: HTTPS_ENABLED,
      cookieSecretSet: SESSION_COOKIE_SECRET !== 'change-me',
      socketEventMaxAgeMs: SOCKET_EVENT_MAX_AGE_MS,
      logFormat: LOG_FORMAT,
    },
    input: {
      mouseSpeed: MOUSE_SPEED,
      scrollSpeed: SCROLL_SPEED,
    },
    preview: {
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
      fps: PREVIEW_FPS,
    },
    notifications: {
      desktop: DESKTOP_NOTIFICATIONS_ENABLED,
      client: CLIENT_NOTIFICATIONS_ENABLED,
      ttlMs: NOTIFICATION_TTL_MS,
    },
    adminActionsEnabled: ADMIN_ACTIONS_ENABLED,
    serviceName: SERVICE_NAME,
    updateCheck: {
      enabled: UPDATE_CHECK_ENABLED,
      source: UPDATE_CHECK_SOURCE,
      checkCommand: UPDATE_CHECK_COMMAND,
      checkTimeoutSec: UPDATE_CHECK_TIMEOUT_SEC,
      intervalMin: UPDATE_CHECK_INTERVAL_MIN,
      packageName: UPDATE_CHECK_PACKAGE,
      currentVersion: UPDATE_CHECK_CURRENT_VERSION,
      gitRemote: UPDATE_CHECK_GIT_REMOTE,
      gitRef: UPDATE_CHECK_GIT_REF,
      installCommand: UPDATE_INSTALL_COMMAND,
      installTimeoutSec: UPDATE_INSTALL_TIMEOUT_SEC,
      autoMergeEnv: UPDATE_INSTALL_AUTO_MERGE_ENV,
    },
    qrOverlay: {
      enabled: QR_OVERLAY_ENABLED,
      size: QR_OVERLAY_SIZE,
      margin: QR_OVERLAY_MARGIN,
      topOffsetPx: TOP_BAR_OFFSET_PX,
    },
    graphicalDisplay: HAS_GRAPHICAL_DISPLAY,
    https: {
      enabled: HTTPS_ENABLED,
      sslKeyPath: HTTPS_ENABLED ? SSL_KEY_PATH : undefined,
      sslCertPath: HTTPS_ENABLED ? SSL_CERT_PATH : undefined,
    },
    logging: {
      level: LOG_LEVEL,
      format: LOG_FORMAT,
    },
  };
}

function emitConfigLine(logger, message, fields = {}) {
  if (logger && typeof logger.info === 'function') {
    logger.info(fields, message);
    return;
  }
  console.log(`${message} ${JSON.stringify(fields)}`);
}

export function logStartupConfig(logger) {
  const payload = getStartupConfigSnapshot();
  emitConfigLine(logger, 'Configuration');
  emitConfigLine(logger, 'config.network', {
    protocol: payload.protocol,
    port: payload.port,
    serverHost: payload.serverHost || '(auto LAN detection)',
  });
  emitConfigLine(logger, 'config.entryPath', {
    ...payload.entryPath,
    fixed: payload.entryPath.fixed || '(random)',
  });
  emitConfigLine(logger, 'config.session', {
    ...payload.session,
    cookieSecret: undefined,
  });
  emitConfigLine(logger, 'config.input', payload.input);
  emitConfigLine(logger, 'config.preview', payload.preview);
  emitConfigLine(logger, 'config.notifications', payload.notifications);
  emitConfigLine(logger, 'config.admin', {
    adminActionsEnabled: payload.adminActionsEnabled,
    serviceName: payload.serviceName,
  });
  emitConfigLine(logger, 'config.update', {
    ...payload.updateCheck,
    packageName: payload.updateCheck.packageName || '(none)',
    currentVersion: payload.updateCheck.currentVersion || '(none)',
    installCommand: payload.updateCheck.installCommand || '(unset)',
  });
  emitConfigLine(logger, 'config.qrOverlay', payload.qrOverlay);
  emitConfigLine(logger, 'config.runtime', {
    graphicalDisplay: payload.graphicalDisplay,
    https: {
      ...payload.https,
      sslKeyPath: payload.https.enabled ? (payload.https.sslKeyPath || '(missing)') : undefined,
      sslCertPath: payload.https.enabled ? (payload.https.sslCertPath || '(missing)') : undefined,
    },
  });
}

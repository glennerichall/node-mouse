import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageEnvFilePath = path.join(__dirname, '..', '.env');
const cwdEnvFilePath = path.join(process.cwd(), '.env');
const explicitEnvFilePath = process.env.ENV_FILE_PATH || '';
const packageJsonPath = path.join(__dirname, '..', 'package.json');

function resolveEnvFilePath() {
  const explicitResolved = explicitEnvFilePath
    ? path.resolve(process.cwd(), explicitEnvFilePath)
    : '';

  if (explicitResolved && fs.existsSync(explicitResolved)) {
    return explicitResolved;
  }
  if (fs.existsSync(cwdEnvFilePath)) {
    return cwdEnvFilePath;
  }
  if (fs.existsSync(packageEnvFilePath)) {
    return packageEnvFilePath;
  }
  return '';
}

const envFilePath = resolveEnvFilePath();
if (envFilePath) {
  dotenv.config({ path: envFilePath, override: false });
}

function readRaw(key, fallback = '') {
  if (Object.prototype.hasOwnProperty.call(process.env, key) && process.env[key] !== undefined) {
    return String(process.env[key]);
  }
  return fallback;
}

function readString(key, fallback = '') {
  return readRaw(key, fallback).trim();
}

function readNumber(key, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
  const raw = readRaw(key, String(fallback));
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function readBoolean(key, fallback = false) {
  const raw = readRaw(key, fallback ? 'true' : 'false').toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

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
export const UPDATE_CHECK_ENABLED = readBoolean('UPDATE_CHECK_ENABLED', false);
export const UPDATE_CHECK_INTERVAL_MIN = readNumber('UPDATE_CHECK_INTERVAL_MIN', 360, { min: 1, max: 24 * 60 });
export const UPDATE_CHECK_PACKAGE = readString('UPDATE_CHECK_PACKAGE', String(packageJson.name || '').trim());
export const UPDATE_CHECK_CURRENT_VERSION = readString(
  'UPDATE_CHECK_CURRENT_VERSION',
  String(packageJson.version || '').trim(),
);
export const ENTRY_PATH_ENABLED = readBoolean('ENTRY_PATH_ENABLED', true);
export const ENTRY_PATH_FIXED = readString('ENTRY_PATH_FIXED', '');
export const ENTRY_PATH_TOKEN_LENGTH = readNumber('ENTRY_PATH_TOKEN_LENGTH', 24, { min: 8, max: 128 });
export const ENTRY_PATH_ROTATE_INTERVAL_MIN = readNumber('ENTRY_PATH_ROTATE_INTERVAL_MIN', 60, { min: 1, max: 24 * 60 });
export const ENTRY_PATH_GRACE_MIN = readNumber('ENTRY_PATH_GRACE_MIN', 120, { min: 1, max: 24 * 60 });
export const QR_OVERLAY_ENABLED = readBoolean('QR_OVERLAY_ENABLED', true);
export const QR_OVERLAY_SIZE = readNumber('QR_OVERLAY_SIZE', 75, { min: 32, max: 800 });
export const QR_OVERLAY_MARGIN = readNumber('QR_OVERLAY_MARGIN', 14, { min: 0, max: 400 });
export const HAS_GRAPHICAL_DISPLAY = Boolean(readString('DISPLAY') || readString('WAYLAND_DISPLAY'));

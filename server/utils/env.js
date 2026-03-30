import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';

export function expandHomePath(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  if (raw === '~') {
    return os.homedir();
  }
  if (raw.startsWith('~/')) {
    return path.join(os.homedir(), raw.slice(2));
  }
  return raw;
}

export function resolveConfigDir(explicitConfigDir = '') {
  const configuredDir = expandHomePath(explicitConfigDir);
  if (configuredDir) {
    return path.resolve(process.cwd(), configuredDir);
  }
  if (process.env.NODE_ENV === 'test') {
    return path.join(os.tmpdir(), 'remote-mouse');
  }
  return path.join(os.homedir(), '.config', 'remote-mouse');
}

export function resolvePathFromConfigDir(value, configDir, fallbackName = '') {
  const rawValue = String(value || '').trim();
  const rawFallback = String(fallbackName || '').trim();
  const candidate = expandHomePath(rawValue || rawFallback);

  if (!candidate) {
    return '';
  }

  if (path.isAbsolute(candidate)) {
    return candidate;
  }

  return path.resolve(configDir, candidate);
}

export function resolveEnvFilePath({ appRoot, configDir = '', explicitEnvFilePath = '' }) {
  const cwdEnvFilePath = path.join(process.cwd(), '.env');
  const appEnvFilePath = appRoot ? path.join(appRoot, '.env') : '';
  const configDirEnvFilePath = configDir ? path.join(configDir, '.env') : '';
  const explicitResolved = explicitEnvFilePath
    ? path.resolve(process.cwd(), expandHomePath(explicitEnvFilePath))
    : '';

  if (explicitResolved && fs.existsSync(explicitResolved)) {
    return explicitResolved;
  }
  if (configDirEnvFilePath && fs.existsSync(configDirEnvFilePath)) {
    return configDirEnvFilePath;
  }
  if (fs.existsSync(cwdEnvFilePath)) {
    return cwdEnvFilePath;
  }
  if (appEnvFilePath && fs.existsSync(appEnvFilePath)) {
    return appEnvFilePath;
  }
  return '';
}

export function loadEnvFile(envFilePath) {
  if (!envFilePath) {
    return;
  }
  dotenv.config({ path: envFilePath, override: false });
}

export function readRaw(key, fallback = '') {
  if (Object.prototype.hasOwnProperty.call(process.env, key)
    && process.env[key] !== undefined
    && process.env[key] !== null
    && process.env[key] !== '') {
    return String(process.env[key]);
  }
  return fallback;
}

export function readString(key, fallback = '') {
  return readRaw(key, fallback).trim();
}

export function readOptionalString(key) {
  if (!Object.prototype.hasOwnProperty.call(process.env, key)
    || process.env[key] === undefined
    || process.env[key] === null
    || process.env[key] === '') {
    return undefined;
  }
  return String(process.env[key]).trim();
}

export function readNumber(
  key,
  fallback,
  { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {},
) {
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

export function readOptionalNumber(key) {
  if (!Object.prototype.hasOwnProperty.call(process.env, key)
    || process.env[key] === undefined
    || process.env[key] === null
    || process.env[key] === '') {
    return undefined;
  }
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? value : undefined;
}

export function readBoolean(key, fallback = false) {
  const raw = readRaw(key, fallback ? 'true' : 'false').toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

export function readOptionalBoolean(key) {
  if (!Object.prototype.hasOwnProperty.call(process.env, key)
    || process.env[key] === undefined
    || process.env[key] === null
    || process.env[key] === '') {
    return undefined;
  }
  const normalized = String(process.env[key]).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

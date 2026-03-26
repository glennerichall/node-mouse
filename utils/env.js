import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dotenv from 'dotenv';

export function resolveEnvFilePath({ appRoot, explicitEnvFilePath = '' }) {
  const cwdEnvFilePath = path.join(process.cwd(), '.env');
  const appEnvFilePath = appRoot ? path.join(appRoot, '.env') : '';
  const explicitResolved = explicitEnvFilePath
    ? path.resolve(process.cwd(), explicitEnvFilePath)
    : '';

  if (explicitResolved && fs.existsSync(explicitResolved)) {
    return explicitResolved;
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

export function readBoolean(key, fallback = false) {
  const raw = readRaw(key, fallback ? 'true' : 'false').toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

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

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

export function resolveWritableEnvFilePath({ appRoot, explicitEnvFilePath = '' }) {
  const explicitResolved = explicitEnvFilePath
    ? path.resolve(process.cwd(), explicitEnvFilePath)
    : '';
  if (explicitResolved) {
    return explicitResolved;
  }

  const existing = resolveEnvFilePath({ appRoot, explicitEnvFilePath: '' });
  if (existing) {
    return existing;
  }

  return path.join(process.cwd(), '.env');
}

function parseEnvKey(line) {
  const match = String(line || '').match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!match) {
    return null;
  }
  return {
    key: match[1],
    rhs: match[2] ?? '',
  };
}

function readFileIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

export function mergeEnvWithExample({ exampleEnvPath, targetEnvPath }) {
  const exampleRaw = readFileIfExists(exampleEnvPath);
  if (!exampleRaw) {
    return {
      ok: false,
      reason: 'missing_example',
      targetEnvPath,
      added: 0,
      updated: 0,
      removed: 0,
      unchanged: 0,
    };
  }

  const targetRaw = readFileIfExists(targetEnvPath);
  const targetLines = targetRaw ? targetRaw.split(/\r?\n/) : [];
  const targetRhsByKey = new Map();
  for (const line of targetLines) {
    const parsed = parseEnvKey(line);
    if (!parsed) {
      continue;
    }
    targetRhsByKey.set(parsed.key, parsed.rhs);
  }

  const exampleLines = exampleRaw.split(/\r?\n/);
  const mergedLines = [];
  const seen = new Set();
  let added = 0;
  let updated = 0;
  let unchanged = 0;

  for (const line of exampleLines) {
    const parsed = parseEnvKey(line);
    if (!parsed) {
      mergedLines.push(line);
      continue;
    }

    const { key, rhs: exampleRhs } = parsed;
    seen.add(key);

    if (!targetRhsByKey.has(key)) {
      mergedLines.push(line);
      added += 1;
      continue;
    }

    const targetRhs = targetRhsByKey.get(key);
    if (String(targetRhs) === String(exampleRhs)) {
      mergedLines.push(line);
      unchanged += 1;
      continue;
    }

    mergedLines.push(`${key}=${targetRhs}`);
    updated += 1;
  }

  const targetKeys = new Set(Array.from(targetRhsByKey.keys()));
  let removed = 0;
  for (const key of targetKeys) {
    if (!seen.has(key)) {
      removed += 1;
    }
  }

  const mergedText = `${mergedLines.join('\n').replace(/\n*$/, '\n')}`;
  fs.mkdirSync(path.dirname(targetEnvPath), { recursive: true });
  fs.writeFileSync(targetEnvPath, mergedText, 'utf8');

  return {
    ok: true,
    targetEnvPath,
    added,
    updated,
    removed,
    unchanged,
  };
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

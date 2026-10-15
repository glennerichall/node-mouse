import fs from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {CONFIG_DIR} from '../services/config/bootstrapConfig.js';

export const DIAGNOSTIC_ARCHIVE_RETENTION = 5;
const ARCHIVE_PREFIX = 'remote-mouse-diagnostic-';
const ARCHIVE_SUFFIX = '.json.gz';
const SENSITIVE_KEY_PATTERN = /(secret|password|token|cookie|authorization|credential|private.?key)/i;

export function redactDiagnosticData(value, key = '') {
  if (SENSITIVE_KEY_PATTERN.test(String(key))) {
    return '[redacted]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactDiagnosticData(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      redactDiagnosticData(childValue, childKey),
    ]));
  }

  return value;
}

function archiveName(date) {
  return `${ARCHIVE_PREFIX}${date.toISOString().replaceAll(':', '-').replaceAll('.', '-')}${ARCHIVE_SUFFIX}`;
}

async function rotateDiagnosticArchives(archiveDir, fsApi) {
  const names = (await fsApi.readdir(archiveDir))
    .filter((name) => name.startsWith(ARCHIVE_PREFIX) && name.endsWith(ARCHIVE_SUFFIX))
    .sort()
    .reverse();

  await Promise.all(names.slice(DIAGNOSTIC_ARCHIVE_RETENTION).map(async (name) => {
    try {
      await fsApi.unlink(path.join(archiveDir, name));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }));

  return names.slice(0, DIAGNOSTIC_ARCHIVE_RETENTION);
}

export async function createDiagnosticArchive({
  snapshot,
  archiveDir = path.join(CONFIG_DIR, 'diagnostics'),
  now = new Date(),
  fsApi = fs,
} = {}) {
  await fsApi.mkdir(archiveDir, {recursive: true, mode: 0o700});

  const payload = {
    schemaVersion: 1,
    createdAt: now.toISOString(),
    ...redactDiagnosticData(snapshot || {}),
  };
  const archivePath = path.join(archiveDir, archiveName(now));
  const temporaryPath = `${archivePath}.${process.pid}.tmp`;
  const compressed = gzipSync(JSON.stringify(payload, null, 2));

  await fsApi.writeFile(temporaryPath, compressed, {mode: 0o600});
  await fsApi.rename(temporaryPath, archivePath);

  const retained = await rotateDiagnosticArchives(archiveDir, fsApi);
  return {
    path: archivePath,
    bytes: compressed.byteLength,
    retained,
  };
}

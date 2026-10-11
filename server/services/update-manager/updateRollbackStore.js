import {createHash, randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export async function saveUpdateRollbackArtifact({
  rollbackDirectory,
  packageName,
  version,
  archive,
  integrity,
  registryUrl,
  registryOrigin,
}) {
  if (!versionPattern.test(String(version || '')) || !Buffer.isBuffer(archive)) {
    throw new Error('Cannot save an invalid rollback artifact.');
  }
  await fs.mkdir(rollbackDirectory, {recursive: true, mode: 0o700});
  await fs.chmod(rollbackDirectory, 0o700).catch(() => {});

  const id = randomUUID();
  const filename = `rollback-${version}-${id}.tgz`;
  const archivePath = path.join(rollbackDirectory, filename);
  const metadataPath = path.join(rollbackDirectory, 'previous-update.json');
  const metadataTempPath = path.join(rollbackDirectory, `.previous-update-${id}.tmp`);
  const metadata = {
    schemaVersion: 1,
    packageName,
    version,
    filename,
    integrity,
    registryUrl,
    registryOrigin,
    savedAt: new Date().toISOString(),
  };
  const previousFilename = await fs.readFile(metadataPath, 'utf8')
    .then((contents) => JSON.parse(contents).filename)
    .catch(() => '');

  await fs.writeFile(archivePath, archive, {mode: 0o600, flag: 'wx'});
  try {
    await fs.writeFile(metadataTempPath, `${JSON.stringify(metadata, null, 2)}\n`, {mode: 0o600, flag: 'wx'});
    await fs.rename(metadataTempPath, metadataPath);
  } catch (error) {
    await fs.rm(archivePath, {force: true});
    await fs.rm(metadataTempPath, {force: true});
    throw error;
  }

  if (previousFilename && previousFilename !== filename && path.basename(previousFilename) === previousFilename) {
    await fs.rm(path.join(rollbackDirectory, previousFilename), {force: true});
  }
  return metadata;
}

export async function loadUpdateRollbackArtifact({rollbackDirectory, packageName}) {
  const metadataPath = path.join(rollbackDirectory, 'previous-update.json');
  let metadata;
  try {
    metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {ok: false, status: 'no-rollback', message: 'No previous verified package is available for rollback.'};
    return {ok: false, status: 'invalid-rollback-metadata', message: 'The saved rollback metadata is invalid.'};
  }

  if (metadata?.schemaVersion !== 1
    || metadata.packageName !== packageName
    || !versionPattern.test(String(metadata.version || ''))
    || path.basename(String(metadata.filename || '')) !== metadata.filename
    || !String(metadata.filename).endsWith('.tgz')) {
    return {ok: false, status: 'invalid-rollback-metadata', message: 'The saved rollback metadata does not match this package.'};
  }

  let archive;
  try {
    archive = await fs.readFile(path.join(rollbackDirectory, metadata.filename));
  } catch {
    return {ok: false, status: 'missing-rollback-artifact', message: 'The saved rollback package archive is missing.'};
  }
  const integrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
  if (integrity !== metadata.integrity) {
    return {ok: false, status: 'rollback-integrity-failed', message: 'The saved rollback package failed its SHA-512 integrity check.'};
  }

  return {ok: true, metadata, archivePath: path.join(rollbackDirectory, metadata.filename)};
}

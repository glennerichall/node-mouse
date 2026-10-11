import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileAsync} from '../../utils/process.js';
import {buildNpmGlobalUpdatePlan} from './buildNpmGlobalUpdatePlan.js';
import {loadUpdateRollbackArtifact, saveUpdateRollbackArtifact} from './updateRollbackStore.js';

const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function createUpdateError(status, message, details = '') {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

function parseJsonOutput(stdout, description) {
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`npm returned invalid JSON while ${description}.`);
  }
}

function getRegistryMetadata(value) {
  const metadata = Array.isArray(value) ? value[0] : value;
  const version = String(metadata?.version || '').trim();
  const integrity = String(metadata?.['dist.integrity'] || metadata?.dist?.integrity || '').trim();
  const tarball = String(metadata?.['dist.tarball'] || metadata?.dist?.tarball || '').trim();
  if (!versionPattern.test(version)) throw new Error('The npm registry returned an invalid package version.');
  const sha512 = integrity.split(/\s+/).find((entry) => entry.startsWith('sha512-'));
  if (!sha512) throw new Error('The npm registry did not provide a SHA-512 integrity value.');
  if (!tarball) throw new Error('The npm registry did not provide a package tarball origin.');
  return {version, sha512, tarball};
}

function parseRegistryUrl(value) {
  const raw = String(value || '').trim();
  let registry;
  try {
    registry = new URL(raw);
  } catch {
    throw new Error('npm returned an invalid configured registry URL.');
  }
  if (registry.protocol !== 'https:'
    || !registry.hostname
    || registry.username
    || registry.password
    || registry.search
    || registry.hash
    || /[\s&|<>^%!"()]/.test(raw)) {
    throw new Error('npm returned an unsupported configured registry URL.');
  }
  return {raw, origin: registry.origin};
}

function buildNpmInvocation(platform, args) {
  return platform === 'win32'
    ? {executable: 'cmd.exe', args: ['/d', '/s', '/c', `npm ${args.join(' ')}`]}
    : {executable: 'npm', args};
}

async function runNpm(platform, args, options) {
  const invocation = buildNpmInvocation(platform, args);
  return execFileAsync(invocation.executable, invocation.args, options);
}

async function downloadVerifiedArtifact({packageName, version, registry, directory, platform, timeout, env, onStage, stagePrefix}) {
  onStage({stage: `${stagePrefix}-resolving`, packageName, targetVersion: version, registryOrigin: registry.origin});
  const metadataResult = await runNpm(platform, [
    'view', `${packageName}@${version}`, 'version', 'dist.integrity', 'dist.tarball', '--json', `--registry=${registry.raw}`,
  ], {timeout, env, shell: false, cwd: directory});
  if (!metadataResult.ok) {
    throw createUpdateError(`${stagePrefix}-resolve-failed`, `Unable to resolve ${stagePrefix} package metadata.`, metadataResult.stderr || metadataResult.stdout);
  }
  const metadata = getRegistryMetadata(parseJsonOutput(metadataResult.stdout, `resolving ${stagePrefix} package metadata`));
  if (version !== 'latest' && metadata.version !== version) {
    throw new Error(`The npm registry resolved ${stagePrefix} package to an unexpected version.`);
  }
  let artifactOrigin;
  try {
    artifactOrigin = new URL(metadata.tarball).origin;
  } catch {
    throw new Error('The npm registry returned an invalid package tarball URL.');
  }
  if (artifactOrigin !== registry.origin) {
    throw createUpdateError('artifact-origin-mismatch', 'The package tarball origin does not match the configured npm registry.');
  }

  onStage({stage: `${stagePrefix}-downloading`, packageName, targetVersion: version, registryOrigin: registry.origin});
  const packResult = await runNpm(platform, ['pack', `${packageName}@${metadata.version}`, '--json', `--registry=${registry.raw}`], {
    timeout, env, shell: false, cwd: directory,
  });
  if (!packResult.ok) {
    throw createUpdateError(`${stagePrefix}-download-failed`, `Unable to download ${stagePrefix} package.`, packResult.stderr || packResult.stdout);
  }

  const packed = parseJsonOutput(packResult.stdout, `downloading the ${stagePrefix} package`);
  const artifact = Array.isArray(packed) ? packed[0] : packed;
  if (artifact?.name !== packageName || artifact?.version !== metadata.version) {
    throw createUpdateError(`${stagePrefix}-identity-mismatch`, `The downloaded ${stagePrefix} package identity does not match the requested package.`);
  }
  const filename = String(artifact.filename || '');
  const expectedFilename = `${packageName.replace(/^@/, '').replace('/', '-')}-${metadata.version}.tgz`;
  if (filename !== expectedFilename || path.basename(filename) !== filename) {
    throw createUpdateError('invalid-artifact-path', 'npm returned an invalid package artifact filename.');
  }

  const archivePath = path.join(directory, filename);
  const archive = await fs.readFile(archivePath);
  const actualSha512 = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
  if (actualSha512 !== metadata.sha512) {
    throw createUpdateError(
      stagePrefix === 'candidate' ? 'integrity-failed' : 'rollback-source-integrity-failed',
      `The downloaded ${stagePrefix} package failed its registry SHA-512 integrity check.`,
    );
  }
  onStage({stage: `${stagePrefix}-verified`, packageName, targetVersion: version, registryOrigin: registry.origin, integrity: 'sha512'});
  return {archive, archivePath, filename, integrity: actualSha512, version: metadata.version};
}

export async function rollbackVerifiedNpmPackage({
  packageName,
  rollbackDirectory,
  platform = process.platform,
  timeout = 600_000,
  env = process.env,
  onStage = () => {},
} = {}) {
  if (!buildNpmGlobalUpdatePlan(packageName)) {
    return {ok: false, status: 'invalid-package-name', message: 'The configured npm package name is invalid.'};
  }
  const saved = await loadUpdateRollbackArtifact({rollbackDirectory, packageName});
  if (!saved.ok) return saved;

  let registry;
  try {
    registry = parseRegistryUrl(saved.metadata.registryUrl);
  } catch (error) {
    return {ok: false, status: 'invalid-rollback-metadata', message: error.message};
  }
  if (registry.origin !== saved.metadata.registryOrigin) {
    return {ok: false, status: 'invalid-rollback-metadata', message: 'The saved rollback registry origin is invalid.'};
  }

  onStage({stage: 'rollback-activating', packageName, targetVersion: saved.metadata.version, registryOrigin: registry.origin});
  const install = await runNpm(platform, [
    'install', '-g', saved.metadata.filename, `--registry=${registry.raw}`,
  ], {
    timeout,
    env: {...env, REMOTE_MOUSE_DAEMON: '1'},
    shell: false,
    cwd: rollbackDirectory,
  });
  if (!install.ok) {
    return {
      ok: false,
      status: 'rollback-activation-failed',
      message: 'The previous verified package could not be restored.',
      details: install.stderr || install.stdout,
    };
  }
  onStage({stage: 'rollback-activated', packageName, targetVersion: saved.metadata.version});
  return {
    ok: true,
    status: 'rolled-back',
    message: `Package restored to version ${saved.metadata.version}.`,
    version: saved.metadata.version,
  };
}

export async function installVerifiedNpmPackage({
  packageName,
  targetVersion = '',
  currentVersion = '',
  rollbackDirectory,
  platform = process.platform,
  timeout = 45_000,
  env = process.env,
  onStage = () => {},
} = {}) {
  if (!buildNpmGlobalUpdatePlan(packageName)) {
    return {ok: false, status: 'invalid-package-name', message: 'The configured npm package name is invalid.'};
  }
  if (!versionPattern.test(String(currentVersion || ''))) {
    return {ok: false, status: 'rollback-source-unavailable', message: 'The installed package version is unknown; update aborted because no rollback can be prepared.'};
  }

  let temporaryDirectory;
  let stage = 'resolve';
  try {
    temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'remote-mouse-update-'));
    const requestedVersion = String(targetVersion || 'latest').trim();
    if (requestedVersion !== 'latest' && !versionPattern.test(requestedVersion)) {
      return {ok: false, status: 'invalid-target-version', message: 'The target npm package version is invalid.'};
    }

    onStage({stage: 'resolving-registry', packageName, targetVersion: requestedVersion});
    const registryResult = await runNpm(platform, ['config', 'get', 'registry'], {timeout, env, shell: false});
    if (!registryResult.ok) {
      return {ok: false, status: 'registry-resolution-failed', message: 'Unable to determine the configured npm registry.', details: registryResult.stderr || registryResult.stdout};
    }
    const registry = parseRegistryUrl(registryResult.stdout);

    stage = 'candidate-download';
    const candidate = await downloadVerifiedArtifact({
      packageName,
      version: requestedVersion,
      registry,
      directory: temporaryDirectory,
      platform,
      timeout,
      env,
      onStage,
      stagePrefix: 'candidate',
    });
    const resolvedTargetVersion = candidate.version;

    stage = 'rollback-snapshot';
    const previous = await downloadVerifiedArtifact({
      packageName,
      version: currentVersion,
      registry,
      directory: temporaryDirectory,
      platform,
      timeout,
      env,
      onStage,
      stagePrefix: 'rollback-source',
    });
    await saveUpdateRollbackArtifact({
      rollbackDirectory,
      packageName,
      version: currentVersion,
      archive: previous.archive,
      integrity: previous.integrity,
      registryUrl: registry.raw,
      registryOrigin: registry.origin,
    });
    onStage({stage: 'rollback-ready', packageName, targetVersion: currentVersion});

    stage = 'activate';
    onStage({stage: 'activating', packageName, targetVersion: resolvedTargetVersion});
    const activation = await runNpm(platform, [
      'install', '-g', candidate.filename, `--registry=${registry.raw}`,
    ], {
      timeout, env: {...env, REMOTE_MOUSE_DAEMON: '1'}, shell: false, cwd: temporaryDirectory,
    });
    if (!activation.ok) {
      const rollback = await rollbackVerifiedNpmPackage({
        packageName, rollbackDirectory, platform, timeout, env, onStage,
      });
      return {
        ok: false,
        status: rollback.ok ? 'activation-failed-rolled-back' : 'activation-failed-rollback-failed',
        message: rollback.ok
          ? `Update activation failed; version ${rollback.version} was restored.`
          : 'Update activation failed and the previous package could not be restored.',
        details: activation.stderr || activation.stdout || rollback.message,
        rollbackSucceeded: rollback.ok,
        rolledBackVersion: rollback.version,
        rollbackDetails: rollback.details,
      };
    }

    onStage({stage: 'activated', packageName, targetVersion: resolvedTargetVersion});
    return {
      ok: true,
      status: 'completed',
      message: `Verified package activated successfully; rollback to ${currentVersion} is available.`,
      packageName,
      targetVersion: resolvedTargetVersion,
      previousVersion: currentVersion,
      integrity: 'sha512',
    };
  } catch (error) {
    return {
      ok: false,
      status: error.status || `${stage}-failed`,
      message: error.message || 'The package update failed.',
      details: error.details || error.message,
    };
  } finally {
    if (temporaryDirectory) await fs.rm(temporaryDirectory, {recursive: true, force: true});
  }
}

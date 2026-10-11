import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileAsync} from '../../utils/process.js';
import {buildNpmGlobalUpdatePlan} from './buildNpmGlobalUpdatePlan.js';

const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

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

export async function installVerifiedNpmPackage({
  packageName,
  targetVersion = '',
  platform = process.platform,
  timeout = 45_000,
  env = process.env,
  onStage = () => {},
} = {}) {
  const updatePlan = buildNpmGlobalUpdatePlan(packageName);
  if (!updatePlan) {
    return {ok: false, status: 'invalid-package-name', message: 'The configured npm package name is invalid.'};
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
    const registryResult = await runNpm(platform, ['config', 'get', 'registry'], {
      timeout, env, shell: false,
    });
    if (!registryResult.ok) {
      return {ok: false, status: 'registry-resolution-failed', message: 'Unable to determine the configured npm registry.', details: registryResult.stderr || registryResult.stdout};
    }
    const registry = parseRegistryUrl(registryResult.stdout);

    onStage({stage: 'resolving', packageName, targetVersion: requestedVersion, registryOrigin: registry.origin});
    const metadataResult = await runNpm(platform, [
      'view', `${packageName}@${requestedVersion}`, 'version', 'dist.integrity', 'dist.tarball', '--json', `--registry=${registry.raw}`,
    ], {timeout, env, shell: false, cwd: temporaryDirectory});
    if (!metadataResult.ok) {
      return {ok: false, status: 'resolve-failed', message: 'Unable to resolve package metadata from the configured npm registry.', details: metadataResult.stderr || metadataResult.stdout};
    }
    const metadata = getRegistryMetadata(parseJsonOutput(metadataResult.stdout, 'resolving package metadata'));
    let artifactOrigin;
    try {
      artifactOrigin = new URL(metadata.tarball).origin;
    } catch {
      return {ok: false, status: 'invalid-artifact-origin', message: 'The npm registry returned an invalid package tarball URL.'};
    }
    if (artifactOrigin !== registry.origin) {
      return {ok: false, status: 'artifact-origin-mismatch', message: 'The package tarball origin does not match the configured npm registry.'};
    }
    const packageSpec = `${packageName}@${metadata.version}`;

    stage = 'download';
    onStage({stage: 'downloading', packageName, targetVersion: metadata.version, registryOrigin: registry.origin});
    const packResult = await runNpm(platform, ['pack', packageSpec, '--json', `--registry=${registry.raw}`], {
      timeout, env, shell: false, cwd: temporaryDirectory,
    });
    if (!packResult.ok) {
      return {ok: false, status: 'download-failed', message: 'Unable to download the package from the configured npm registry.', details: packResult.stderr || packResult.stdout};
    }

    const packed = parseJsonOutput(packResult.stdout, 'downloading the package');
    const artifact = Array.isArray(packed) ? packed[0] : packed;
    if (artifact?.name !== packageName || artifact?.version !== metadata.version) {
      return {ok: false, status: 'artifact-mismatch', message: 'The downloaded package identity does not match the requested package.'};
    }
    const filename = String(artifact.filename || '');
    const expectedFilename = `${packageName.replace(/^@/, '').replace('/', '-')}-${metadata.version}.tgz`;
    if (filename !== expectedFilename || path.basename(filename) !== filename) {
      return {ok: false, status: 'invalid-artifact-path', message: 'npm returned an invalid package artifact filename.'};
    }

    stage = 'verify';
    const archivePath = path.join(temporaryDirectory, filename);
    const archive = await fs.readFile(archivePath);
    const actualSha512 = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
    if (actualSha512 !== metadata.sha512) {
      return {ok: false, status: 'integrity-failed', message: 'The downloaded package failed its registry SHA-512 integrity check.'};
    }
    onStage({stage: 'verified', packageName, targetVersion: metadata.version, registryOrigin: registry.origin, integrity: 'sha512'});

    stage = 'activate';
    onStage({stage: 'activating', packageName, targetVersion: metadata.version});
    const activationArgs = ['install', '-g', filename, `--registry=${registry.raw}`];
    const activationResult = await runNpm(platform, activationArgs, {
      timeout, env: {...env, REMOTE_MOUSE_DAEMON: '1'}, shell: false, cwd: temporaryDirectory,
    });
    if (!activationResult.ok) {
      return {ok: false, status: 'activation-failed', message: 'The verified package could not be activated.', details: activationResult.stderr || activationResult.stdout};
    }

    onStage({stage: 'activated', packageName, targetVersion: metadata.version});
    return {
      ok: true,
      status: 'completed',
      message: 'Verified package downloaded and activated successfully.',
      packageName,
      targetVersion: metadata.version,
      integrity: 'sha512',
    };
  } catch (error) {
    return {
      ok: false,
      status: `${stage}-failed`,
      message: error.message || 'The package update failed.',
      details: error.message,
    };
  } finally {
    if (temporaryDirectory) await fs.rm(temporaryDirectory, {recursive: true, force: true});
  }
}

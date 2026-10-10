import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');
const nativeFiles = [
  'remote-mouse-uinput.node',
  'remote-mouse-xwayland-pointer.node',
  'remote-mouse-xwayland-overlay',
];
const supportedArchitectures = ['x64', 'arm64'];
const requiredFiles = [
  '.env.example',
  'README.md',
  'bin/remote-mouse.js',
  'index.js',
  'native/uinput/remote-mouse-uinput.c',
  'native/wayland/remote-mouse-xwayland-overlay.c',
  'native/wayland/remote-mouse-xwayland-pointer.c',
  'package.json',
  'public/index.html',
  'scripts/build-uinput-bridge.sh',
  'scripts/build-xwayland-overlay.sh',
  'scripts/build-xwayland-pointer-bridge.sh',
  'scripts/postinstall-linux.mjs',
  'server/term/cli/versionCommand.js',
];
const forbiddenPathPrefixes = [
  '.artifacts/',
  'build/',
  'coverage/',
  'dev/',
  'docs/project/',
  'node_modules/',
  'test/',
];
const forbiddenFiles = [
  'jest.integration.config.js',
  'jest.vm.config.js',
  'jest.wayland.config.js',
  'jest.x11.config.js',
  'playwright.vm.config.js',
  'playwright.x11.config.js',
  'playwright.wayland.config.js',
  'scripts/check-package-version.mjs',
  'scripts/generate-mobile-screenshots.mjs',
  'scripts/prepare-npm-publish.mjs',
  'scripts/verify-native-prebuilds.mjs',
  'scripts/verify-npm-package.mjs',
];

export function validatePackageManifest({manifest, files}) {
  const paths = new Set(files);
  const errors = [];
  const expectedBin = './bin/remote-mouse.js';

  if (!manifest.name || !manifest.version || manifest.type !== 'module') {
    errors.push('Package metadata must include name, version, and type=module.');
  }
  if (manifest.main !== './index.js' && manifest.main !== 'index.js') {
    errors.push('Package main entry must point to index.js.');
  }
  if (manifest.bin?.['remote-mouse'] !== expectedBin) {
    errors.push(`Package CLI entry must be ${expectedBin}.`);
  }
  for (const dependency of ['better-sqlite3', 'robotjs']) {
    if (!manifest.dependencies?.[dependency]) {
      errors.push(`Runtime dependency '${dependency}' must remain declared by the package.`);
    }
  }

  for (const file of requiredFiles) {
    if (!paths.has(file)) errors.push(`Required package file is missing: ${file}`);
  }
  for (const arch of supportedArchitectures) {
    for (const file of nativeFiles) {
      const packagePath = `prebuilds/linux-${arch}/${file}`;
      if (!paths.has(packagePath)) errors.push(`Required native prebuild is missing: ${packagePath}`);
    }
  }
  for (const file of paths) {
    if (forbiddenFiles.includes(file)) errors.push(`Development-only file must not be published: ${file}`);
    if (forbiddenPathPrefixes.some((prefix) => file.startsWith(prefix))) {
      errors.push(`Development-only path must not be published: ${file}`);
    }
    if (file === '.env' || file.startsWith('.env.') && file !== '.env.example') {
      errors.push(`Local environment file must not be published: ${file}`);
    }
  }
  return errors;
}

function run(command, args, {cwd = projectRoot, env = process.env, label = command} = {}) {
  const result = spawnSync(command, args, {cwd, env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024});
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr || `exit code ${result.status}`;
    throw new Error(`${label} failed: ${detail}`);
  }
  return result.stdout;
}

function parsePackMetadata(output) {
  let metadata;
  try {
    metadata = JSON.parse(output)?.[0];
  } catch (cause) {
    throw new Error('Could not parse npm pack metadata.', {cause});
  }
  if (!metadata?.filename || !Array.isArray(metadata.files)) {
    throw new Error('npm pack did not return package file metadata.');
  }
  return metadata;
}

function verifyInstalledNativeArtifacts(packageRoot) {
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageRequire = createRequire(packageJsonPath);
  const nativePathModule = pathToFileURL(path.join(packageRoot, 'server/os/linux/nativeArtifactPaths.js'));
  return import(nativePathModule.href).then(({getLinuxNativeArtifactPath}) => {
    const uinputPath = getLinuxNativeArtifactPath('uinput', {root: packageRoot});
    const pointerPath = getLinuxNativeArtifactPath('xwaylandPointer', {root: packageRoot});
    const overlayPath = getLinuxNativeArtifactPath('xwaylandOverlay', {root: packageRoot});
    const uinput = packageRequire(uinputPath);
    const pointer = packageRequire(pointerPath);

    for (const method of ['open', 'moveRelative', 'scroll', 'button', 'key', 'close']) {
      assert.equal(typeof uinput[method], 'function', `uinput native export '${method}' is missing`);
    }
    assert.equal(typeof pointer.getPosition, 'function', 'XWayland pointer native export is missing');
    assert.ok(statSync(overlayPath).mode & 0o111, 'XWayland overlay helper must be executable');
    const overlayProbe = spawnSync(overlayPath, [], {encoding: 'utf8'});
    assert.equal(overlayProbe.error, undefined, 'XWayland overlay executable must load.');
    assert.equal(overlayProbe.status, 1, 'XWayland overlay usage probe must exit before opening a display.');
    assert.match(overlayProbe.stderr, /Usage:/, 'XWayland overlay must report its usage.');
    process.stdout.write(`Loaded installed Linux ${process.arch} Node-API artifacts and executed the overlay helper.\n`);
  });
}

export async function verifyNpmPackage({root = projectRoot} = {}) {
  if (process.platform !== 'linux' || !supportedArchitectures.includes(process.arch)) {
    throw new Error('Tarball installation verification requires a Linux x64 or ARM64 host.');
  }

  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-package-'));
  const cachePath = path.join(temporaryRoot, 'npm-cache');
  const prefixPath = path.join(temporaryRoot, 'global-prefix');
  mkdirSync(path.join(prefixPath, 'lib/node_modules'), {recursive: true});
  mkdirSync(path.join(prefixPath, 'bin'), {recursive: true});
  const env = {...process.env, npm_config_cache: cachePath};
  // `npm publish --dry-run` passes this setting to lifecycle scripts. Do not
  // let it turn the verifier's pack/install steps into dry-runs as well.
  delete env.npm_config_dry_run;
  delete env.NPM_CONFIG_DRY_RUN;
  delete env.REMOTE_MOUSE_DAEMON;

  try {
    const metadata = parsePackMetadata(run('npm', [
      'pack', '--json', '--pack-destination', temporaryRoot, '--ignore-scripts',
    ], {cwd: root, env, label: 'npm pack'}));
    const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.equal(metadata.name, manifest.name, 'Packed package name must match package.json.');
    assert.equal(metadata.version, manifest.version, 'Packed package version must match package.json.');
    const files = metadata.files.map(({path: filePath}) => filePath);
    const errors = validatePackageManifest({manifest, files});
    if (errors.length) throw new Error(errors.join('\n'));

    run('npm', ['publish', '--dry-run', '--ignore-scripts'], {
      cwd: root,
      env,
      label: 'npm publish --dry-run',
    });
    process.stdout.write('npm publish --dry-run completed without publishing or requiring a token.\n');

    run('npm', [
      'install', '--global', '--prefix', prefixPath, '--no-audit', '--no-fund',
      path.join(temporaryRoot, metadata.filename),
    ], {cwd: temporaryRoot, env, label: 'global tarball installation'});

    const packageRoot = path.join(prefixPath, 'lib/node_modules', ...manifest.name.split('/'));
    const cliPath = path.join(prefixPath, 'bin/remote-mouse');
    const versionOutput = run(cliPath, ['--version'], {cwd: temporaryRoot, env, label: 'installed CLI --version'}).trim();
    assert.equal(versionOutput, manifest.version, 'Installed CLI version must match package metadata.');
    process.stdout.write(`Installed tarball CLI reports ${versionOutput}.\n`);

    await verifyInstalledNativeArtifacts(packageRoot);
    process.stdout.write(`Verified npm tarball ${metadata.filename} (${metadata.entryCount} files).\n`);
  } finally {
    rmSync(temporaryRoot, {recursive: true, force: true});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  verifyNpmPackage().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

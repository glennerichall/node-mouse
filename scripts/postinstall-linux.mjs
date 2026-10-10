import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {
  getLinuxNativeBuildPath,
  getLinuxNativePrebuildPath,
  isLinuxNativeArtifactCompatible,
  LINUX_NATIVE_COMPONENTS,
} from '../server/os/linux/nativeArtifactPaths.js';
import {configureUInputAfterAppUpdate} from './configure-uinput-after-update.mjs';

const REQUIRED_COMPONENTS = ['uinput', 'xwaylandPointer', 'xwaylandOverlay'];
const BUILD_SCRIPTS = Object.freeze({
  uinput: 'build-uinput-bridge.sh',
  xwaylandPointer: 'build-xwayland-pointer-bridge.sh',
  xwaylandOverlay: 'build-xwayland-overlay.sh',
});
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function compileNativeComponent(name, {root = projectRoot, env = process.env} = {}) {
  const scriptName = BUILD_SCRIPTS[name];
  if (!scriptName) throw new Error(`No installation build script is configured for '${name}'.`);

  const scriptPath = path.join(root, 'scripts', scriptName);
  const result = spawnSync('bash', [scriptPath], {cwd: root, env, stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`build script exited with status ${result.status ?? 'unknown'}`);
  }
}

/**
 * Prefer packaged target binaries, but compile missing project-owned Linux
 * components locally when a compatible compiler toolchain is available.
 */
export function prepareLinuxNativeRuntime({
  platform = process.platform,
  arch = process.arch,
  exists = existsSync,
  isCompatible = isLinuxNativeArtifactCompatible,
  compile = compileNativeComponent,
  root = projectRoot,
  env = process.env,
  stderr = process.stderr,
  migrateUInput = configureUInputAfterAppUpdate,
} = {}) {
  if (platform !== 'linux') {
    return {built: [], skipped: LINUX_NATIVE_COMPONENTS};
  }

  const built = [];
  const unavailable = [];

  for (const name of LINUX_NATIVE_COMPONENTS) {
    const prebuildPath = getLinuxNativePrebuildPath(name, {arch, root});
    if (exists(prebuildPath) && isCompatible(prebuildPath, arch)) continue;

    const buildPath = getLinuxNativeBuildPath(name, {root});
    if (exists(buildPath) && isCompatible(buildPath, arch)) continue;

    if (!REQUIRED_COMPONENTS.includes(name) || !['x64', 'arm64'].includes(arch)) {
      unavailable.push(name);
      if (REQUIRED_COMPONENTS.includes(name)) {
        stderr.write(
          `Native component '${name}' is unavailable for Linux ${arch}; no compatible prebuild or local artifact was found, and npm install continues without it.\n`,
        );
      }
      continue;
    }

    try {
      compile(name, {root, env, arch});
      if (!exists(buildPath) || !isCompatible(buildPath, arch)) {
        throw new Error(`no compatible Linux ${arch} artifact was produced`);
      }
      built.push(name);
    } catch (error) {
      unavailable.push(name);
      stderr.write(
        `Native component '${name}' is unavailable for Linux ${arch}; npm install continues without it. ${error.message}\n`,
      );
    }
  }

  migrateUInput();
  return {built, skipped: unavailable};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  prepareLinuxNativeRuntime();
}

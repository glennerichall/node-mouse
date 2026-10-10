import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const COMPONENTS = Object.freeze({
  uinput: {
    file: 'remote-mouse-uinput.node',
    buildDirectory: 'uinput',
  },
  xwaylandPointer: {
    file: 'remote-mouse-xwayland-pointer.node',
    buildDirectory: 'wayland',
  },
  xwaylandOverlay: {
    file: 'remote-mouse-xwayland-overlay',
    buildDirectory: 'wayland',
  },
  waylandPortal: {
    file: 'remote-mouse-wayland',
    buildDirectory: 'wayland',
  },
});
const ELF_MACHINES = Object.freeze({x64: 62, arm64: 183});

/** Check ELF e_machine so a stale local build can never cross architecture. */
export function isLinuxNativeArtifactCompatible(filePath, arch, {read = readFileSync} = {}) {
  const expectedMachine = ELF_MACHINES[arch];
  if (!expectedMachine) return false;

  try {
    const header = read(filePath);
    if (header.length < 20 || header[0] !== 0x7f || header.toString('ascii', 1, 4) !== 'ELF') {
      return false;
    }
    const byteOrder = header[5];
    if (byteOrder === 1) return header.readUInt16LE(18) === expectedMachine;
    if (byteOrder === 2) return header.readUInt16BE(18) === expectedMachine;
    return false;
  } catch {
    return false;
  }
}

/** Select a target-compatible prebuild or local build, never another architecture. */
export function getLinuxNativeArtifactPath(name, {
  platform = process.platform,
  arch = process.arch,
  root = projectRoot,
  exists = existsSync,
  isCompatible = isLinuxNativeArtifactCompatible,
} = {}) {
  const component = COMPONENTS[name];
  if (!component) {
    throw new Error(`Unknown Linux native component: ${name}`);
  }

  const localBuildPath = path.join(root, 'build', component.buildDirectory, component.file);
  if (platform !== 'linux') {
    return localBuildPath;
  }

  const prebuiltPath = path.join(root, 'prebuilds', `linux-${arch}`, component.file);
  if (exists(prebuiltPath) && isCompatible(prebuiltPath, arch)) return prebuiltPath;
  if (exists(localBuildPath) && isCompatible(localBuildPath, arch)) return localBuildPath;

  // Keep a missing-artifact path separate from both candidates. In particular,
  // never let a stale, wrong-architecture prebuild be passed to a native loader.
  return path.join(root, '.remote-mouse-missing-native', arch, component.file);
}

export function getLinuxNativePrebuildPath(name, options = {}) {
  const component = COMPONENTS[name];
  if (!component) {
    throw new Error(`Unknown Linux native component: ${name}`);
  }

  const {arch = process.arch, root = projectRoot} = options;
  return path.join(root, 'prebuilds', `linux-${arch}`, component.file);
}

export function getLinuxNativeBuildPath(name, options = {}) {
  const component = COMPONENTS[name];
  if (!component) {
    throw new Error(`Unknown Linux native component: ${name}`);
  }

  const {root = projectRoot} = options;
  return path.join(root, 'build', component.buildDirectory, component.file);
}

export const LINUX_NATIVE_COMPONENTS = Object.freeze(Object.keys(COMPONENTS));

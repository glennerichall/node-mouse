import {existsSync} from 'node:fs';
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

/**
 * Return the packaged prebuild when one exists for this Linux architecture;
 * otherwise retain the existing local build path used by source installations.
 */
export function getLinuxNativeArtifactPath(name, {
  platform = process.platform,
  arch = process.arch,
  root = projectRoot,
  exists = existsSync,
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
  return exists(prebuiltPath) ? prebuiltPath : localBuildPath;
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

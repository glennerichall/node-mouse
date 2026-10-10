import path from 'node:path';
import {
  getLinuxNativeArtifactPath,
  getLinuxNativePrebuildPath,
  isLinuxNativeArtifactCompatible,
} from '../../server/os/linux/nativeArtifactPaths.js';

describe('Linux native artifact paths', () => {
  it('checks ELF machine identifiers against the requested architecture', () => {
    const header = Buffer.alloc(20);
    header.set([0x7f, 0x45, 0x4c, 0x46, 2, 1]);
    header.writeUInt16LE(62, 18);

    expect(isLinuxNativeArtifactCompatible('/binary', 'x64', {read: () => header})).toBe(true);
    expect(isLinuxNativeArtifactCompatible('/binary', 'arm64', {read: () => header})).toBe(false);
    expect(isLinuxNativeArtifactCompatible('/missing', 'x64', {read: () => { throw new Error('missing'); }})).toBe(false);
  });

  it('prefers an artifact packaged for the current architecture', () => {
    const root = '/package';
    const expected = path.join(root, 'prebuilds/linux-arm64/remote-mouse-uinput.node');
    const artifact = getLinuxNativeArtifactPath('uinput', {
      root,
      arch: 'arm64',
      platform: 'linux',
      exists: (candidate) => candidate === expected,
      isCompatible: () => true,
    });

    expect(artifact).toBe(expected);
  });

  it('falls back to the developer build directory if a packaged artifact is absent', () => {
    expect(getLinuxNativeArtifactPath('xwaylandOverlay', {
      root: '/package',
      arch: 'x64',
      platform: 'linux',
      exists: (candidate) => candidate === '/package/build/wayland/remote-mouse-xwayland-overlay',
      isCompatible: () => true,
    })).toBe('/package/build/wayland/remote-mouse-xwayland-overlay');
  });

  it('never selects a prebuild or local artifact incompatible with the target architecture', () => {
    const prebuildPath = '/package/prebuilds/linux-arm64/remote-mouse-uinput.node';
    const buildPath = '/package/build/uinput/remote-mouse-uinput.node';

    expect(getLinuxNativeArtifactPath('uinput', {
      root: '/package',
      arch: 'arm64',
      platform: 'linux',
      exists: (candidate) => [prebuildPath, buildPath].includes(candidate),
      isCompatible: (candidate) => candidate === buildPath,
    })).toBe(buildPath);

    expect(getLinuxNativeArtifactPath('uinput', {
      root: '/package',
      arch: 'arm64',
      platform: 'linux',
      exists: (candidate) => [prebuildPath, buildPath].includes(candidate),
      isCompatible: () => false,
    })).toBe('/package/.remote-mouse-missing-native/arm64/remote-mouse-uinput.node');
  });

  it('does not select Linux prebuilds for other platforms', () => {
    expect(getLinuxNativeArtifactPath('uinput', {
      root: '/package',
      arch: 'x64',
      platform: 'darwin',
      exists: () => true,
    })).toBe('/package/build/uinput/remote-mouse-uinput.node');
  });

  it('resolves prebuild paths by architecture for the packaging step', () => {
    expect(getLinuxNativePrebuildPath('xwaylandPointer', {
      root: '/package',
      arch: 'arm64',
    })).toBe('/package/prebuilds/linux-arm64/remote-mouse-xwayland-pointer.node');
  });

  it('rejects unknown native components instead of silently returning a bad path', () => {
    expect(() => getLinuxNativeArtifactPath('unknown')).toThrow('Unknown Linux native component');
  });
});

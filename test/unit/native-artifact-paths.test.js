import path from 'node:path';
import {
  getLinuxNativeArtifactPath,
  getLinuxNativePrebuildPath,
} from '../../server/os/linux/nativeArtifactPaths.js';

describe('Linux native artifact paths', () => {
  it('prefers an artifact packaged for the current architecture', () => {
    const root = '/package';
    const expected = path.join(root, 'prebuilds/linux-arm64/remote-mouse-uinput.node');
    const artifact = getLinuxNativeArtifactPath('uinput', {
      root,
      arch: 'arm64',
      platform: 'linux',
      exists: (candidate) => candidate === expected,
    });

    expect(artifact).toBe(expected);
  });

  it('falls back to the developer build directory if a packaged artifact is absent', () => {
    expect(getLinuxNativeArtifactPath('xwaylandOverlay', {
      root: '/package',
      arch: 'x64',
      platform: 'linux',
      exists: () => false,
    })).toBe('/package/build/wayland/remote-mouse-xwayland-overlay');
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

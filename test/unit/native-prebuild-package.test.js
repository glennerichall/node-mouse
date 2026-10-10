import {jest} from '@jest/globals';
import {
  getMissingNativePrebuilds,
  verifyNativePrebuildPackage,
} from '../../scripts/verify-native-prebuilds.mjs';

describe('native prebuild package verification', () => {
  it('reports missing architecture-specific native files', () => {
    const missing = getMissingNativePrebuilds({root: '/package', exists: () => false});

    expect(missing).toHaveLength(6);
    expect(missing).toContain('/package/prebuilds/linux-x64/remote-mouse-uinput.node');
    expect(missing).toContain('/package/prebuilds/linux-arm64/remote-mouse-xwayland-overlay');
  });

  it('does not run npm pack until both architecture sets are complete', () => {
    const pack = jest.fn();
    const stderr = {write: jest.fn()};

    expect(verifyNativePrebuildPackage({
      root: '/package',
      exists: () => false,
      pack,
      stderr,
    })).toBe(false);
    expect(pack).not.toHaveBeenCalled();
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('Missing project native prebuilds'));
  });

  it('confirms that the npm tarball contains all required binaries', () => {
    const componentFiles = [
      'remote-mouse-uinput.node',
      'remote-mouse-xwayland-pointer.node',
      'remote-mouse-xwayland-overlay',
    ];
    const files = ['x64', 'arm64'].flatMap((arch) => componentFiles.map((file) => ({
      path: `prebuilds/linux-${arch}/${file}`,
    })));
    const stderr = {write: jest.fn()};

    expect(verifyNativePrebuildPackage({
      root: '/package',
      exists: () => true,
      pack: () => ({status: 0, stdout: JSON.stringify([{files}]), stderr: ''}),
      stderr,
    })).toBe(true);
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it('fails when npm ignores a prebuild despite it existing in the workspace', () => {
    const stderr = {write: jest.fn()};

    expect(verifyNativePrebuildPackage({
      root: '/package',
      exists: () => true,
      pack: () => ({status: 0, stdout: JSON.stringify([{files: []}]), stderr: ''}),
      stderr,
    })).toBe(false);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('not included in the npm package'));
  });
});

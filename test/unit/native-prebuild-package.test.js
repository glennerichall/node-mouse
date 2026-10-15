import {jest} from '@jest/globals';
import {
  getMissingNativePrebuilds,
  verifyNativePrebuildPackage,
} from '../../scripts/verify-native-prebuilds.mjs';

describe('native prebuild package verification', () => {
  it('reports missing architecture-specific native files', () => {
    const missing = getMissingNativePrebuilds({root: '/package', exists: () => false});

    expect(missing).toHaveLength(4);
    expect(missing).toContain('/package/prebuilds/linux-x64/remote-mouse-uinput.node');
    expect(missing).toContain('/package/prebuilds/linux-arm64/remote-mouse-xwayland-overlay');
  });

  it('does not inspect ELF files until both architecture sets are complete', () => {
    const inspect = jest.fn();
    const stderr = {write: jest.fn()};

    expect(verifyNativePrebuildPackage({
      root: '/package',
      exists: () => false,
      inspect,
      stderr,
    })).toBe(false);
    expect(inspect).not.toHaveBeenCalled();
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('Missing project native prebuilds'));
  });

  it('confirms matching ELF architectures for both native builds', () => {
    const stderr = {write: jest.fn()};

    expect(verifyNativePrebuildPackage({
      root: '/package',
      exists: () => true,
      inspect: (filePath) => ({
        status: 0,
        stdout: `  Machine:                           ${filePath.includes('linux-x64') ? 'Advanced Micro Devices X86-64' : 'AArch64'}\n`,
      }),
      stderr,
    })).toBe(true);
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it('rejects binaries whose ELF machine does not match their prebuild directory', () => {
    const stderr = {write: jest.fn()};

    expect(verifyNativePrebuildPackage({
      root: '/package',
      exists: () => true,
      inspect: () => ({status: 0, stdout: '  Machine:                           Advanced Micro Devices X86-64\n'}),
      stderr,
    })).toBe(false);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('expected arm64'));
  });
});

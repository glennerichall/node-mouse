import {jest} from '@jest/globals';
import {buildNativeInputIfAvailable} from '../../scripts/build-native-input-if-available.mjs';
import {buildNativePrebuilds} from '../../scripts/build-native-prebuilds.mjs';

describe('native prebuild installation', () => {
  it('does not invoke compilers when all packaged binaries are present', () => {
    const execute = jest.fn();
    const migrateUInput = jest.fn();
    const stderr = {write: jest.fn()};
    const result = buildNativeInputIfAvailable({
      platform: 'linux',
      arch: 'x64',
      exists: (filePath) => filePath.includes('/prebuilds/linux-x64/'),
      probe: () => ({status: 0}),
      execute,
      stderr,
      migrateUInput,
    });

    expect(execute).not.toHaveBeenCalled();
    expect(result.built).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(stderr.write).not.toHaveBeenCalled();
    expect(migrateUInput).toHaveBeenCalledTimes(1);
  });

  it('never compiles native features during installation when package artifacts are missing', () => {
    const execute = jest.fn();
    const probe = jest.fn(() => ({status: 0}));
    const stderr = {write: jest.fn()};
    const result = buildNativeInputIfAvailable({
      platform: 'linux',
      arch: 'arm64',
      exists: () => false,
      probe,
      execute,
      stderr,
      migrateUInput: jest.fn(),
    });

    expect(execute).not.toHaveBeenCalled();
    expect(probe).not.toHaveBeenCalled();
    expect(result.built).toEqual([]);
    expect(result.skipped).toEqual(['uinput', 'xwaylandPointer', 'xwaylandOverlay', 'waylandPortal']);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('npm install did not compile them'));
  });

  it('keeps the libei portal helper optional without warning during installation', () => {
    const stderr = {write: jest.fn()};
    const result = buildNativeInputIfAvailable({
      platform: 'linux',
      arch: 'x64',
      exists: (filePath) => !filePath.endsWith('/remote-mouse-wayland'),
      stderr,
      migrateUInput: jest.fn(),
    });

    expect(result.skipped).toEqual(['waylandPortal']);
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it('builds an architecture-specific package set on native x64 or ARM64 hosts', () => {
    const build = jest.fn();
    const copy = jest.fn();
    const makeDirectory = jest.fn();
    const setMode = jest.fn();
    const result = buildNativePrebuilds({
      platform: 'linux',
      arch: 'arm64',
      root: '/workspace',
      env: {},
      build,
      probe: () => ({status: 0}),
      exists: () => true,
      copy,
      makeDirectory,
      setMode,
      stdout: {write: jest.fn()},
    });

    expect(result.components).toEqual(['uinput', 'xwaylandPointer', 'xwaylandOverlay']);
    expect(build).toHaveBeenCalledTimes(3);
    expect(copy).toHaveBeenCalledTimes(3);
    expect(copy.mock.calls[0][1]).toBe('/workspace/prebuilds/linux-arm64/remote-mouse-uinput.node');
    expect(setMode).toHaveBeenCalledWith('/workspace/prebuilds/linux-arm64/remote-mouse-xwayland-overlay', 0o755);
  });

  it('rejects architectures without a published build target', () => {
    const build = jest.fn();
    expect(() => buildNativePrebuilds({platform: 'linux', arch: 'arm', build})).toThrow(
      'Unsupported prebuild architecture: arm; expected x64 or arm64.',
    );
    expect(build).not.toHaveBeenCalled();
  });
});

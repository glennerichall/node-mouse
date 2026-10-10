import {jest} from '@jest/globals';
import {prepareLinuxNativeRuntime} from '../../scripts/postinstall-linux.mjs';
import {buildNativePrebuilds} from '../../scripts/build-native-prebuilds.mjs';
import {
  getLinuxNativeBuildPath,
  getLinuxNativePrebuildPath,
} from '../../server/os/linux/nativeArtifactPaths.js';

describe('native prebuild installation', () => {
  it('does not invoke compilers when all packaged binaries are present', () => {
    const migrateUInput = jest.fn();
    const stderr = {write: jest.fn()};
    const result = prepareLinuxNativeRuntime({
      platform: 'linux',
      arch: 'x64',
      exists: (filePath) => filePath.includes('/prebuilds/linux-x64/'),
      isCompatible: () => true,
      stderr,
      migrateUInput,
    });

    expect(result.built).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(stderr.write).not.toHaveBeenCalled();
    expect(migrateUInput).toHaveBeenCalledTimes(1);
  });

  it('compiles missing required components and leaves the optional portal helper alone', () => {
    const builtPaths = new Set();
    const compile = jest.fn((name, {root}) => builtPaths.add(getLinuxNativeBuildPath(name, {root})));
    const stderr = {write: jest.fn()};
    const result = prepareLinuxNativeRuntime({
      platform: 'linux',
      arch: 'arm64',
      root: '/package',
      exists: (filePath) => builtPaths.has(filePath),
      isCompatible: (filePath) => builtPaths.has(filePath),
      compile,
      stderr,
      migrateUInput: jest.fn(),
    });

    expect(result.built).toEqual(['uinput', 'xwaylandPointer', 'xwaylandOverlay']);
    expect(result.skipped).toEqual(['waylandPortal']);
    expect(compile.mock.calls.map(([name]) => name)).toEqual(['uinput', 'xwaylandPointer', 'xwaylandOverlay']);
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it('compiles only missing components and never trusts an incompatible prebuild', () => {
    const prebuilt = new Set([getLinuxNativePrebuildPath('uinput', {root: '/package', arch: 'x64'})]);
    const builtPaths = new Set();
    const compile = jest.fn((name, {root}) => builtPaths.add(getLinuxNativeBuildPath(name, {root})));
    const incompatible = getLinuxNativePrebuildPath('xwaylandPointer', {root: '/package', arch: 'x64'});
    prebuilt.add(incompatible);

    const result = prepareLinuxNativeRuntime({
      platform: 'linux',
      arch: 'x64',
      root: '/package',
      exists: (filePath) => prebuilt.has(filePath) || builtPaths.has(filePath),
      isCompatible: (filePath) => filePath !== incompatible || builtPaths.has(
        getLinuxNativeBuildPath('xwaylandPointer', {root: '/package'}),
      ),
      compile,
      stderr: {write: jest.fn()},
      migrateUInput: jest.fn(),
    });

    expect(result.built).toEqual(['xwaylandPointer', 'xwaylandOverlay']);
    expect(compile.mock.calls.map(([name]) => name)).toEqual(['xwaylandPointer', 'xwaylandOverlay']);
  });

  it('continues installation with a diagnostic when compilation is unavailable', () => {
    const stderr = {write: jest.fn()};
    const result = prepareLinuxNativeRuntime({
      platform: 'linux',
      arch: 'x64',
      exists: () => false,
      isCompatible: () => false,
      compile: () => { throw new Error('compiler not found'); },
      stderr,
      migrateUInput: jest.fn(),
    });

    expect(result.built).toEqual([]);
    expect(result.skipped).toEqual(['uinput', 'xwaylandPointer', 'xwaylandOverlay', 'waylandPortal']);
    expect(stderr.write).toHaveBeenCalledTimes(3);
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('npm install continues without it'));
  });

  it('does not compile the optional libei helper when required artifacts are available', () => {
    const compile = jest.fn();
    const result = prepareLinuxNativeRuntime({
      platform: 'linux',
      arch: 'x64',
      exists: (filePath) => !filePath.endsWith('/remote-mouse-wayland'),
      isCompatible: () => true,
      compile,
      stderr: {write: jest.fn()},
      migrateUInput: jest.fn(),
    });

    expect(result.skipped).toEqual(['waylandPortal']);
    expect(compile).not.toHaveBeenCalled();
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
      inspect: () => ({status: 0, stdout: '  Machine:                           AArch64\n'}),
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

  it('selects the ARM64 cross-compiler on an x64 host and passes it to each build script', () => {
    const build = jest.fn();
    const probe = jest.fn(() => ({status: 0}));

    buildNativePrebuilds({
      platform: 'linux',
      hostArch: 'x64',
      arch: 'arm64',
      root: '/workspace',
      env: {},
      build,
      probe,
      inspect: () => ({status: 0, stdout: '  Machine:                           AArch64\n'}),
      exists: () => true,
      copy: jest.fn(),
      makeDirectory: jest.fn(),
      setMode: jest.fn(),
      stdout: {write: jest.fn()},
    });

    expect(probe).toHaveBeenCalledWith('aarch64-linux-gnu-gcc', ['--version']);
    expect(build).toHaveBeenCalledTimes(3);
    expect(build.mock.calls[0][1].env.CC).toBe('aarch64-linux-gnu-gcc');
  });

  it('refuses to label an artifact ARM64 when its ELF machine is x64', () => {
    expect(() => buildNativePrebuilds({
      platform: 'linux',
      hostArch: 'x64',
      arch: 'arm64',
      root: '/workspace',
      env: {},
      build: jest.fn(),
      probe: () => ({status: 0}),
      inspect: () => ({status: 0, stdout: '  Machine:                           Advanced Micro Devices X86-64\n'}),
      exists: () => true,
      copy: jest.fn(),
      makeDirectory: jest.fn(),
      setMode: jest.fn(),
      stdout: {write: jest.fn()},
    })).toThrow("expected arm64");
  });

  it('rejects architectures without a published build target', () => {
    const build = jest.fn();
    expect(() => buildNativePrebuilds({platform: 'linux', arch: 'arm', build})).toThrow(
      'Unsupported prebuild architecture: arm; expected x64 or arm64.',
    );
    expect(build).not.toHaveBeenCalled();
  });
});

import {readFileSync} from 'node:fs';
import {validatePackageManifest} from '../../scripts/verify-npm-package.mjs';

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
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
  ...['x64', 'arm64'].flatMap((arch) => [
    `prebuilds/linux-${arch}/remote-mouse-uinput.node`,
    `prebuilds/linux-${arch}/remote-mouse-xwayland-pointer.node`,
    `prebuilds/linux-${arch}/remote-mouse-xwayland-overlay`,
  ]),
];

describe('npm package manifest validation', () => {
  it('accepts required runtime entries and both Linux native architectures', () => {
    expect(validatePackageManifest({manifest, files: requiredFiles})).toEqual([]);
  });

  it('rejects missing CLI metadata, dependencies, and architecture-specific artifacts', () => {
    const errors = validatePackageManifest({
      manifest: {
        ...manifest,
        bin: {},
        dependencies: {},
      },
      files: requiredFiles.filter((file) => !file.includes('linux-arm64')),
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('CLI entry'),
      expect.stringContaining('better-sqlite3'),
      expect.stringContaining('robotjs'),
      expect.stringContaining('linux-arm64'),
    ]));
  });

  it('requires the native sources and build scripts needed by the install fallback', () => {
    const fallbackFiles = new Set([
      'native/uinput/remote-mouse-uinput.c',
      'native/wayland/remote-mouse-xwayland-overlay.c',
      'native/wayland/remote-mouse-xwayland-pointer.c',
      'scripts/build-uinput-bridge.sh',
      'scripts/build-xwayland-overlay.sh',
      'scripts/build-xwayland-pointer-bridge.sh',
      'scripts/postinstall-linux.mjs',
    ]);
    const errors = validatePackageManifest({
      manifest,
      files: requiredFiles.filter((file) => !fallbackFiles.has(file)),
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('native/uinput/remote-mouse-uinput.c'),
      expect.stringContaining('native/wayland/remote-mouse-xwayland-overlay.c'),
      expect.stringContaining('scripts/build-uinput-bridge.sh'),
      expect.stringContaining('scripts/postinstall-linux.mjs'),
    ]));
  });

  it('rejects development artifacts, internal docs, and local secrets from the tarball', () => {
    const errors = validatePackageManifest({
      manifest,
      files: [
        ...requiredFiles,
        '.artifacts/screenshots/secret.png',
        'docs/project/ROADMAP.md',
        'build/debug.bin',
        '.env.local',
        'scripts/verify-npm-package.mjs',
        'scripts/prepare-npm-publish.mjs',
      ],
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('.artifacts/'),
      expect.stringContaining('docs/project/'),
      expect.stringContaining('build/'),
      expect.stringContaining('.env.local'),
      expect.stringContaining('scripts/verify-npm-package.mjs'),
      expect.stringContaining('scripts/prepare-npm-publish.mjs'),
    ]));
  });
});

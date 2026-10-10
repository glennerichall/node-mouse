import {readFileSync} from 'node:fs';
import {validatePackageManifest} from '../../scripts/verify-npm-package.mjs';

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const requiredFiles = [
  '.env.example',
  'README.md',
  'bin/remote-mouse.js',
  'index.js',
  'package.json',
  'public/index.html',
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

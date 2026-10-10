import {jest} from '@jest/globals';
import {prepareNpmPublish} from '../../scripts/prepare-npm-publish.mjs';

describe('npm prepublishOnly preparation', () => {
  it('builds and validates both Linux architectures before npm packs', () => {
    const run = jest.fn();

    prepareNpmPublish({platform: 'linux', arch: 'x64', run});

    expect(run.mock.calls.map(([args]) => args)).toEqual([
      ['run', 'check:version'],
      ['run', 'build:native:prebuild', '--', '--arch', 'x64'],
      ['run', 'build:native:prebuild', '--', '--arch', 'arm64'],
      ['run', 'verify:native:prebuilds'],
      ['run', 'verify:package'],
    ]);
  });

  it('refuses unsupported hosts before running any preparation step', () => {
    const run = jest.fn();

    expect(() => prepareNpmPublish({platform: 'linux', arch: 'arm64', run}))
      .toThrow('Linux x64 host');
    expect(() => prepareNpmPublish({platform: 'darwin', arch: 'x64', run}))
      .toThrow('Linux x64 host');
    expect(run).not.toHaveBeenCalled();
  });

  it('stops at the first failing build or verification step', () => {
    const error = new Error('cross compilation failed');
    const run = jest.fn().mockImplementationOnce(() => {}).mockImplementationOnce(() => {
      throw error;
    });

    expect(() => prepareNpmPublish({platform: 'linux', arch: 'x64', run})).toThrow(error);
    expect(run).toHaveBeenCalledTimes(2);
  });
});

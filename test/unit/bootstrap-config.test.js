import {jest} from '@jest/globals';

const readFileSync = jest.fn();
const loadEnvFile = jest.fn();
const readString = jest.fn((_key, fallback = '') => fallback);
const resolveConfigDir = jest.fn((value = '') => value || '/tmp/remote-mouse');
const resolveEnvFilePath = jest.fn(() => '');

jest.unstable_mockModule('node:fs', () => ({
  default: {
    readFileSync,
  },
}));

jest.unstable_mockModule('../../server/utils/env.js', () => ({
  loadEnvFile,
  readString,
  resolveConfigDir,
  resolveEnvFilePath,
}));

describe('bootstrap config', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('reads package.json during bootstrap', async () => {
    readFileSync.mockReturnValue(JSON.stringify({
      name: '@velor/remote-mouse',
      version: '6.4.11',
    }));

    const module = await import('../../server/services/config/bootstrapConfig.js');

    expect(readFileSync).toHaveBeenCalledWith(module.packageJsonPath, 'utf8');
    expect(module.packageJson).toEqual({
      name: '@velor/remote-mouse',
      version: '6.4.11',
    });
  });

  it('throws when package.json cannot be read during bootstrap', async () => {
    readFileSync.mockImplementation(() => {
      throw new Error('package.json missing');
    });

    await expect(import('../../server/services/config/bootstrapConfig.js'))
      .rejects
      .toThrow('package.json missing');
  });
});

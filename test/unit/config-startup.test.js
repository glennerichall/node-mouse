import {jest} from '@jest/globals';

describe('getStartupConfigSnapshot', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...originalEnv};
    delete process.env.ENTRY_PATH_ENABLED;
    delete process.env.ENTRY_PATH_FIXED;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps entry path enabled by default when env var is absent', async () => {
    const {getStartupConfigSnapshot} = await import('../../server/init/config/getStartupConfigSnapshot.js');

    expect(getStartupConfigSnapshot().entryPath.enabled).toBe(true);
  });
});

import {jest} from '@jest/globals';

describe('getStartupSystemConfigSnapshot', () => {
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
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(getStartupSystemConfigSnapshot().entryPath.enabled).toBe(true);
  });
});

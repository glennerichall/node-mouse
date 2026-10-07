import {jest} from '@jest/globals';

describe('getStartupSystemConfigSnapshot', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...originalEnv};
    delete process.env.SESSION_COOKIE_SECRET;
    delete process.env.ENTRY_PATH_ENABLED;
    delete process.env.ENTRY_PATH_FIXED;
    delete process.env.ENTRY_PATH_GRACE_MIN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps entry path enabled by default when env var is absent', async () => {
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(getStartupSystemConfigSnapshot().entryPath.enabled).toBe(true);
  });

  it('defaults previous entry tokens to the documented 120-minute grace period', async () => {
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(getStartupSystemConfigSnapshot().entryPath.graceMin).toBe(120);
  });

  it('preserves an explicit entry token grace period from the environment', async () => {
    process.env.ENTRY_PATH_GRACE_MIN = '45';
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(getStartupSystemConfigSnapshot().entryPath.graceMin).toBe(45);
  });

  it('allows the test default session secret', async () => {
    process.env.NODE_ENV = 'test';
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(getStartupSystemConfigSnapshot().session.cookieSecret).toBe('change-me');
  });

  it('allows the development default session secret', async () => {
    process.env.NODE_ENV = 'development';
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(getStartupSystemConfigSnapshot().session.cookieSecret).toBe('change-me');
  });

  it('rejects the default session secret in production without exposing it', async () => {
    process.env.NODE_ENV = 'production';
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(() => getStartupSystemConfigSnapshot()).toThrow(/SESSION_COOKIE_SECRET/);
    expect(() => getStartupSystemConfigSnapshot()).toThrow(/64 characters/);
  });

  it('rejects a too short production session secret', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_COOKIE_SECRET = 'short-secret';
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(() => getStartupSystemConfigSnapshot()).toThrow(/Invalid session cookie secret/);
  });

  it('accepts a sufficiently long production session secret', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_COOKIE_SECRET = 'a'.repeat(64);
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(getStartupSystemConfigSnapshot().session.cookieSecret).toBe('a'.repeat(64));
  });

  it('rejects invalid system values before startup continues', async () => {
    process.env.PORT = '0';
    const {getStartupSystemConfigSnapshot} = await import('../../server/services/config/index.js');

    expect(() => getStartupSystemConfigSnapshot()).toThrow(/Invalid system configuration/);
  });
});

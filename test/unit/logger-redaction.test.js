import {createLogger, getRecentLogs} from '../../server/application/logger.js';

describe('logger secret redaction', () => {
  it('redacts tokens, cookies, and authorization fields before retaining logs', async () => {
    const secret = `sec-007-secret-${Date.now()}`;
    const log = createLogger('test:redaction');
    log.info({
      token: secret,
      headers: {cookie: secret, authorization: secret},
      nested: {sessionToken: secret},
    }, 'redaction test');
    await new Promise((resolve) => setImmediate(resolve));

    const entry = getRecentLogs().find((item) => item.scope === 'test:redaction' && item.message === 'redaction test');
    expect(entry).toBeDefined();
    expect(JSON.stringify(entry)).not.toContain(secret);
    expect(JSON.stringify(entry)).toContain('[REDACTED]');
  });
});

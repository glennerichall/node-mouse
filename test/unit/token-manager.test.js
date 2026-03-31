import {createTokenManager} from '../../server/connection/tokenManager.js';

describe('createTokenManager', () => {
  it('keeps the fixed entry token when fixedPath is configured', () => {
    const tokenManager = createTokenManager({
      enabled: false,
      fixedPath: 'my-fixed-token',
      tokenLength: 24,
      graceMin: 120,
      persistence: {
        loadTokens: () => new Map(),
        deleteExpiredTokens: () => 0,
        hasToken: () => false,
        createToken: () => {},
      },
    });

    expect(tokenManager.getToken()).toBe('my-fixed-token');
    expect(tokenManager.isValid('my-fixed-token')).toBe(true);
    expect(tokenManager.isValid('other-token')).toBe(false);
  });

  it('loads and persists rotating tokens through the persistence adapter', () => {
    let storedTokens = new Map([['persisted-token', 1000]]);
    const persistence = {
      loadTokens: () => new Map(storedTokens),
      deleteExpiredTokens: ({olderThan, keepToken}) => {
        for (const [token, createdAt] of storedTokens.entries()) {
          if (token !== keepToken && createdAt < olderThan) {
            storedTokens.delete(token);
          }
        }
      },
      hasToken: (token) => storedTokens.has(token),
      createToken: (token, createdAt) => {
        storedTokens.set(token, createdAt);
      },
    };

    const tokenManager = createTokenManager({
      enabled: true,
      fixedPath: '',
      tokenLength: 24,
      graceMin: 120,
      persistence,
    });

    expect(tokenManager.getToken()).toBe('persisted-token');

    const nextToken = tokenManager.createToken();

    expect(nextToken).not.toBe('persisted-token');
    expect(storedTokens.has(nextToken)).toBe(true);
  });
});

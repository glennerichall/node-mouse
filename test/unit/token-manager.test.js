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
        saveTokens: () => {},
      },
    });

    expect(tokenManager.getToken()).toBe('my-fixed-token');
    expect(tokenManager.isValid('my-fixed-token')).toBe(true);
    expect(tokenManager.isValid('other-token')).toBe(false);
  });

  it('loads and persists rotating tokens through the persistence adapter', () => {
    const savedStates = [];
    let storedTokens = new Map([['persisted-token', 1000]]);
    const tokenManager = createTokenManager({
      enabled: true,
      fixedPath: '',
      tokenLength: 24,
      graceMin: 120,
      persistence: {
        loadTokens: () => new Map(storedTokens),
        saveTokens: (tokens) => {
          storedTokens = new Map(tokens);
          savedStates.push(new Map(tokens));
        },
      },
    });

    expect(tokenManager.getToken()).toBe('persisted-token');

    const nextToken = tokenManager.createToken();

    expect(nextToken).not.toBe('persisted-token');
    expect(savedStates.length).toBeGreaterThan(0);
    expect(storedTokens.has(nextToken)).toBe(true);
  });
});

import {jest} from '@jest/globals';
import {createTokenManager} from '../../server/services/token-manager/createTokenManager.js';

describe('createTokenManager', () => {
  it('keeps the fixed entry token when fixedPath is configured', () => {
    const tokenManager = createTokenManager({
      getSystemConfig: () => ({
        entryPath: {
          enabled: false,
          fixed: 'my-fixed-token',
          tokenLength: 24,
          graceMin: 120,
        },
      }),
      getPersistence: () => ({
        entryTokenDao: {
          countEntryTokens: () => 0,
          deleteExpiredEntryTokens: () => 0,
          getLatestEntryToken: () => '',
          hasEntryToken: () => false,
          createEntryToken: () => {},
        },
      }),
    });

    expect(tokenManager.getToken()).toBe('my-fixed-token');
    expect(tokenManager.isValid('my-fixed-token')).toBe(true);
    expect(tokenManager.isValid('other-token')).toBe(false);
  });

  it('loads and persists rotating tokens through the persistence adapter', () => {
    let storedTokens = new Map([['persisted-token', 1000]]);
    const getLatestToken = () => Array.from(storedTokens.entries())
      .sort((left, right) => right[1] - left[1])[0]?.[0] || '';
    const persistence = {
      countTokens: () => storedTokens.size,
      deleteExpiredTokens: ({olderThan, keepToken}) => {
        for (const [token, createdAt] of storedTokens.entries()) {
          if (token !== keepToken && createdAt < olderThan) {
            storedTokens.delete(token);
          }
        }
      },
      getLatestToken,
      hasToken: (token) => storedTokens.has(token),
      createToken: (token, createdAt) => {
        storedTokens.set(token, createdAt);
      },
    };

    const tokenManager = createTokenManager({
      getSystemConfig: () => ({
        entryPath: {
          enabled: true,
          fixed: '',
          tokenLength: 24,
          graceMin: 120,
        },
      }),
      getPersistence: () => ({
        entryTokenDao: {
          countEntryTokens: persistence.countTokens,
          deleteExpiredEntryTokens: persistence.deleteExpiredTokens,
          getLatestEntryToken: persistence.getLatestToken,
          hasEntryToken: persistence.hasToken,
          createEntryToken: persistence.createToken,
        },
      }),
    });

    expect(tokenManager.getToken()).toBe('persisted-token');

    const nextToken = tokenManager.createToken();

    expect(nextToken).not.toBe('persisted-token');
    expect(storedTokens.has(nextToken)).toBe(true);
  });

  it('does not create an implicit token when none exists yet', () => {
    const createEntryToken = jest.fn();
    const tokenManager = createTokenManager({
      getSystemConfig: () => ({
        entryPath: {
          enabled: true,
          fixed: '',
          tokenLength: 24,
          graceMin: 120,
        },
      }),
      getPersistence: () => ({
        entryTokenDao: {
          countEntryTokens: () => 0,
          deleteExpiredEntryTokens: () => 0,
          getLatestEntryToken: () => '',
          hasEntryToken: () => false,
          createEntryToken,
        },
      }),
    });

    expect(tokenManager.getToken()).toBe('');
    expect(createEntryToken).not.toHaveBeenCalled();
  });

  it('createToken always forces a new token in rotating mode', () => {
    let storedTokens = new Map([['persisted-token', 1000]]);
    const getLatestToken = () => Array.from(storedTokens.entries())
      .sort((left, right) => right[1] - left[1])[0]?.[0] || '';

    const tokenManager = createTokenManager({
      getSystemConfig: () => ({
        entryPath: {
          enabled: true,
          fixed: '',
          tokenLength: 24,
          graceMin: 120,
        },
      }),
      getPersistence: () => ({
        entryTokenDao: {
          countEntryTokens: () => storedTokens.size,
          deleteExpiredEntryTokens: () => 0,
          getLatestEntryToken: getLatestToken,
          hasEntryToken: (token) => storedTokens.has(token),
          createEntryToken: (token, createdAt) => {
            storedTokens.set(token, createdAt);
          },
        },
      }),
    });

    const currentToken = tokenManager.getToken();
    const nextToken = tokenManager.createToken();

    expect(currentToken).toBe('persisted-token');
    expect(nextToken).not.toBe(currentToken);
  });

  it('keeps the previous token valid for a grace window after rotation', () => {
    let storedTokens = new Map([['persisted-token', 1000]]);
    const getLatestToken = () => Array.from(storedTokens.entries())
      .sort((left, right) => right[1] - left[1])[0]?.[0] || '';
    const persistence = {
      countTokens: () => storedTokens.size,
      deleteExpiredTokens: ({olderThan, keepToken}) => {
        for (const [token, createdAt] of storedTokens.entries()) {
          if (token !== keepToken && createdAt < olderThan) {
            storedTokens.delete(token);
          }
        }
      },
      getLatestToken,
      hasToken: (token) => storedTokens.has(token),
      createToken: (token, createdAt) => {
        storedTokens.set(token, createdAt);
      },
    };

    const tokenManager = createTokenManager({
      getSystemConfig: () => ({
        entryPath: {
          enabled: true,
          fixed: '',
          tokenLength: 24,
          graceMin: 120,
        },
      }),
      getPersistence: () => ({
        entryTokenDao: {
          countEntryTokens: persistence.countTokens,
          deleteExpiredEntryTokens: persistence.deleteExpiredTokens,
          getLatestEntryToken: persistence.getLatestToken,
          hasEntryToken: persistence.hasToken,
          createEntryToken: persistence.createToken,
        },
      }),
    });

    const previousToken = tokenManager.getToken();
    const nextToken = tokenManager.createToken();

    expect(nextToken).not.toBe(previousToken);
    expect(tokenManager.isValid(previousToken)).toBe(true);
    expect(tokenManager.isValid(nextToken)).toBe(true);
    expect(storedTokens.size).toBe(2);
  });

  it('re-reads rotating tokens from persistence instead of keeping a stale in-memory cache', () => {
    let storedTokens = new Map([['persisted-token', 1000]]);
    const getLatestToken = () => Array.from(storedTokens.entries())
      .sort((left, right) => right[1] - left[1])[0]?.[0] || '';
    const persistence = {
      countTokens: () => storedTokens.size,
      deleteExpiredTokens: () => 0,
      getLatestToken,
      hasToken: (token) => storedTokens.has(token),
      createToken: (token, createdAt) => {
        storedTokens.set(token, createdAt);
      },
    };

    const tokenManager = createTokenManager({
      getSystemConfig: () => ({
        entryPath: {
          enabled: true,
          fixed: '',
          tokenLength: 24,
          graceMin: 120,
        },
      }),
      getPersistence: () => ({
        entryTokenDao: {
          countEntryTokens: persistence.countTokens,
          deleteExpiredEntryTokens: persistence.deleteExpiredTokens,
          getLatestEntryToken: persistence.getLatestToken,
          hasEntryToken: persistence.hasToken,
          createEntryToken: persistence.createToken,
        },
      }),
    });

    expect(tokenManager.getToken()).toBe('persisted-token');

    storedTokens = new Map([['fresh-token', 2000]]);

    expect(tokenManager.getToken()).toBe('fresh-token');
    expect(tokenManager.isValid('fresh-token')).toBe(true);
    expect(tokenManager.isValid('persisted-token')).toBe(false);
  });
});

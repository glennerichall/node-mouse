import {createTokenManager} from '../../server/connection/tokenManager.js';

describe('createTokenManager', () => {
  it('keeps the fixed entry token when fixedPath is configured', () => {
    const tokenManager = createTokenManager({
      enabled: false,
      fixedPath: 'my-fixed-token',
      tokenLength: 24,
      graceMin: 120,
      stateFilePath: '',
    });

    expect(tokenManager.getToken()).toBe('my-fixed-token');
    expect(tokenManager.isValid('my-fixed-token')).toBe(true);
    expect(tokenManager.isValid('other-token')).toBe(false);
  });
});

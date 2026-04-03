import {__testables} from '../../server/connection/api/server-info.router.js';

describe('server info router token entries', () => {
  it('masks token values and computes expiration dates', () => {
    const tokens = __testables.buildTokenEntries({
      entries: new Map([
        ['old-token', Date.parse('2026-04-03T10:00:00.000Z')],
        ['current-token', Date.parse('2026-04-03T11:00:00.000Z')],
      ]),
      currentToken: 'current-token',
      entryPathConfig: {
        graceMin: 120,
        rotateMin: 60,
      },
    });

    expect(tokens).toEqual([
      expect.objectContaining({
        token: expect.stringMatching(/^\[masque:[0-9a-f]{8}\]$/),
        isCurrent: false,
        createdAt: '2026-04-03T10:00:00.000Z',
        expiresAt: '2026-04-03T12:00:00.000Z',
      }),
      expect.objectContaining({
        token: expect.stringMatching(/^\[masque:[0-9a-f]{8}\]$/),
        isCurrent: true,
        createdAt: '2026-04-03T11:00:00.000Z',
        expiresAt: '2026-04-03T13:00:00.000Z',
      }),
    ]);
    expect(tokens[0].token).not.toBe(tokens[1].token);
  });

  it('keeps currentToken only once when it is already present in entries', () => {
    const tokens = __testables.buildTokenEntries({
      entries: [
        ['current-token', Date.parse('2026-04-03T11:00:00.000Z')],
        ['old-token', Date.parse('2026-04-03T10:00:00.000Z')],
        ['current-token', Date.parse('2026-04-03T11:00:00.000Z')],
      ],
      currentToken: 'current-token',
      entryPathConfig: {
        graceMin: 120,
        rotateMin: 60,
      },
    });

    expect(tokens).toHaveLength(2);
    expect(tokens.filter((entry) => entry.isCurrent)).toHaveLength(1);
    expect(tokens.at(-1)).toEqual(expect.objectContaining({
      token: expect.stringMatching(/^\[masque:[0-9a-f]{8}\]$/),
      isCurrent: true,
      createdAt: '2026-04-03T11:00:00.000Z',
      expiresAt: '2026-04-03T13:00:00.000Z',
    }));
  });

  it('throws when graceMin is missing from the effective config', () => {
    expect(() => __testables.buildTokenEntries({
      entries: new Map([
        ['token-a', Date.parse('2026-04-03T10:00:00.000Z')],
      ]),
      currentToken: '',
      entryPathConfig: {
        rotateMin: 60,
      },
    })).toThrow('entryPath.graceMin must be a finite number');
  });
});

import {jest} from '@jest/globals';
import {executeCliCommand} from '../../server/cli/executeCliCommand.js';

describe('server cli', () => {
  it('executes the QR command through admin actions', async () => {
    const openQrBrowserServer = jest.fn(async () => ({
      ok: true,
      message: 'Page QR ouverte sur le serveur.',
    }));

    const result = await executeCliCommand({
      getRemotes: () => ({
        adminActions: {
          openQrBrowserServer,
        },
      }),
    }, 'open-qr');

    expect(openQrBrowserServer).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      message: 'Page QR ouverte sur le serveur.',
    });
  });

  it('returns help text for help command', async () => {
    const result = await executeCliCommand({
      getRemotes: () => ({
        adminActions: {},
      }),
    }, 'help');

    expect(result.ok).toBe(true);
    expect(result.message).toContain('open-qr');
  });

  it('returns the effective persisted config for config command', async () => {
    const config = {
      preview: {
        enabled: true,
      },
    };

    const result = await executeCliCommand({
      getConfig: () => config,
      getRemotes: () => ({
        adminActions: {},
      }),
    }, 'config');

    expect(result).toEqual({
      ok: true,
      message: 'Configuration persistée effective.',
      data: config,
    });
  });
});

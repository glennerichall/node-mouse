import {jest} from '@jest/globals';
import {getManagedConfigContext} from '../../server/connection/api/getManagedConfigContext.js';

function createServices({vlcAvailable, config = {vlc: {enabled: true}}} = {}) {
  return {
    getRemotes: () => ({
      vlc: {
        isAvailable: jest.fn().mockResolvedValue(vlcAvailable),
      },
    }),
    getConfig: jest.fn(() => config),
  };
}

describe('getManagedConfigContext', () => {
  it('returns the managed schema and preserves enabled VLC when available', async () => {
    const services = createServices({vlcAvailable: true});

    const context = await getManagedConfigContext(services);

    expect(context.managedPaths).toContain('vlc.enabled');
    expect(context.schema.vlc).toBeDefined();
    expect(context.config.vlc.enabled).toBe(true);
    expect(context.defaults.vlc.enabled).toBe(false);
    expect(services.getConfig).toHaveBeenCalledTimes(1);
  });

  it('forces VLC disabled when the host integration is unavailable', async () => {
    const services = createServices({vlcAvailable: false, config: {vlc: {enabled: true}}});

    const context = await getManagedConfigContext(services);

    expect(context.config.vlc.enabled).toBe(false);
  });
});

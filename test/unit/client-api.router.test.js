import {jest} from '@jest/globals';
import {getClientConfig} from '../../server/connection/api/client-api.router.js';

describe('client API router', () => {
  it('returns only controller-readable configuration and disables admin actions', async () => {
    const json = jest.fn();
    const req = {
      securityContext: {role: 'controller'},
      services: {
        getConfig: () => ({
          input: {touchDragHoldMs: 420, touchDragStillDistancePx: 8, mouseSpeed: 2},
          browser: {enabled: true, firefox: true},
          keyboard: {enabled: true},
          vlc: {enabled: true},
          preview: {enabled: true, hideDelayMs: 5000, fps: 60},
          samsungTv: {enabled: true, host: '192.168.30.20', mac: 'secret-mac'},
        }),
        getRemotes: () => ({
          vlc: {isAvailable: async () => true},
          preview: {isAvailable: () => false},
        }),
        getSystemConfig: () => ({adminActionsEnabled: true, session: {secret: 'secret'}}),
      },
    };

    await getClientConfig(req, {json});

    const payload = json.mock.calls[0][0];
    expect(payload.systemConfig).toEqual({adminActionsEnabled: false});
    expect(payload.config.samsungTv).toEqual({enabled: true});
    expect(payload.config.preview).toEqual({enabled: false, hideDelayMs: 5000});
    expect(JSON.stringify(payload)).not.toContain('192.168.30.20');
    expect(JSON.stringify(payload)).not.toContain('secret-mac');
    expect(JSON.stringify(payload)).not.toContain('session');
  });

  it('keeps admin actions available for an authorized local administrator', async () => {
    const json = jest.fn();
    const req = {
      securityContext: {role: 'admin'},
      services: {
        getConfig: () => ({vlc: {enabled: false}}),
        getRemotes: () => ({
          vlc: {isAvailable: async () => false},
          preview: {isAvailable: () => true},
        }),
        getSystemConfig: () => ({adminActionsEnabled: true}),
      },
    };

    await getClientConfig(req, {json});

    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      systemConfig: {adminActionsEnabled: true},
    }));
  });
});

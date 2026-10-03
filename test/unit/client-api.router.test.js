import {jest} from '@jest/globals';
import {
  connectClientSubscription,
  createClientConfigSubscription,
  deleteClientSubscription,
  getClientConfig,
} from '../../server/connection/api/client-api.router.js';

function createResponse() {
  const response = {status: jest.fn(), json: jest.fn()};
  response.status.mockReturnValue(response);
  return response;
}

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
    expect(payload.systemConfig).toEqual({
      adminActionsEnabled: false,
      adminUnlocked: false,
      adminRelockAvailable: false,
      adminUnlockAvailable: false,
    });
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
      systemConfig: {
        adminActionsEnabled: true,
        adminUnlocked: true,
        adminRelockAvailable: false,
        adminUnlockAvailable: false,
      },
    }));
  });

  it('offers relocking only to an administrator elevated from a device session', async () => {
    const json = jest.fn();
    const req = {
      securityContext: {role: 'admin', authenticationMethod: 'session'},
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

    expect(json.mock.calls[0][0].systemConfig.adminRelockAvailable).toBe(true);
  });
});

describe('client config subscriptions API', () => {
  it('creates a subscription filtered to client configuration events', () => {
    const createSubscription = jest.fn(() => 'subscription-1');
    const req = {services: {getSseService: () => ({createSubscription})}};
    const res = createResponse();

    createClientConfigSubscription(req, res);

    expect(createSubscription).toHaveBeenCalledWith({
      filters: {service: 'client-config'},
    });
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      id: 'subscription-1',
      eventsUrl: '/api/client/subs/subscription-1',
    });
  });

  it('connects an existing subscription and reports a missing one', () => {
    const connect = jest.fn(() => false);
    const req = {
      params: {id: ' subscription-1 '},
      services: {getSseService: () => ({connect})},
    };
    const res = createResponse();

    connectClientSubscription(req, res);

    expect(connect).toHaveBeenCalledWith('subscription-1', req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ok: false, message: 'Subscription not found.'});
  });

  it('deletes an existing subscription and preserves the response contract', () => {
    const deleteSubscription = jest.fn(() => true);
    const req = {
      params: {id: 'subscription-1'},
      services: {getSseService: () => ({deleteSubscription})},
    };
    const res = createResponse();

    deleteClientSubscription(req, res);

    expect(deleteSubscription).toHaveBeenCalledWith('subscription-1');
    expect(res.json).toHaveBeenCalledWith({ok: true});
  });
});

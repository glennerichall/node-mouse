import sinon from 'sinon';
import {createAdminEventSubscriber} from '../../server/connection/subscribers/admin.subscriber.js';
import {
  REMOTE_EVENT_ADMIN_UPDATE_CHECK,
} from '../../utils/remoteCommands.js';

describe('createAdminEventSubscriber', () => {
  it('subscribes guarded admin actions and returns results through the channel response', async () => {
    const handlers = new Map();
    const channel = {
      id: 'channel-123456789',
      on: sinon.spy((eventName, ...callbacks) => {
        handlers.set(eventName, (...args) => {
          const next = (error) => {
            if (error) throw error;
            return callbacks[1]?.(...args, next);
          };
          return callbacks[0](...args, next);
        });
        return channel;
      }),
    };
    const adminActions = {
      forceUpdateCheck: sinon.stub().resolves({ok: true, message: 'done'}),
    };
    const qrActions = {};
    const response = sinon.stub();

    createAdminEventSubscriber({adminActions, qrActions})(channel);
    await handlers.get(REMOTE_EVENT_ADMIN_UPDATE_CHECK)({}, response);

    expect(channel.on.callCount).toBeGreaterThan(0);
    expect(adminActions.forceUpdateCheck.calledOnceWithExactly({
      clientId: channel.id,
    })).toBe(true);
    expect(response.calledOnceWithExactly({
      ok: true,
      message: 'done',
    })).toBe(true);
  });
});

import sinon from 'sinon';
import {createAdminEventSubscriber} from '../../server/connection/subscribers/admin.subscriber.js';
import {
  REMOTE_EVENT_ADMIN_UPDATE_CHECK,
} from '../../utils/remoteCommands.js';

describe('createAdminEventRegistrar', () => {
  it('subscribes on a channel and emits action results without requiring socket guards', async () => {
    const handlers = new Map();
    const channel = {
      id: 'channel-123456789',
      on: sinon.spy((eventName, handler) => handlers.set(eventName, handler)),
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
      action: 'update-check',
      ok: true,
      message: 'done',
      openUrl: undefined,
    })).toBe(true);
  });
});

import sinon from 'sinon';
import {createAdminEventRegistrar} from '../../server/remotes/admin/registrar.js';
import {
  REMOTE_EVENT_ADMIN_RESULT,
  REMOTE_EVENT_ADMIN_UPDATE_CHECK,
} from '../../utils/remoteCommands.js';

describe('createAdminEventRegistrar', () => {
  it('subscribes on a channel and emits action results without requiring socket guards', async () => {
    const handlers = new Map();
    const emit = sinon.stub();
    const channel = {
      id: 'channel-123456789',
      on: sinon.spy((eventName, handler) => handlers.set(eventName, handler)),
    };
    const adminActions = {
      forceUpdateCheck: sinon.stub().resolves({ok: true, message: 'done'}),
    };
    const legacyQrActions = {};

    createAdminEventRegistrar({adminActions, legacyQrActions})(channel, {emit});
    await handlers.get(REMOTE_EVENT_ADMIN_UPDATE_CHECK)();

    expect(channel.on.callCount).toBeGreaterThan(0);
    expect(adminActions.forceUpdateCheck.calledOnceWithExactly({
      clientId: channel.id,
    })).toBe(true);
    expect(emit.calledOnceWithExactly(REMOTE_EVENT_ADMIN_RESULT, {
      action: 'update-check',
      ok: true,
      message: 'done',
      openUrl: undefined,
    })).toBe(true);
  });
});

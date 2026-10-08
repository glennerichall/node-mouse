import sinon from 'sinon';
import {adminRouter} from '../../server/connection/actions/admin.router.js';
import {
  REMOTE_EVENT_ADMIN_UPDATE_CHECK,
} from '../../utils/remoteCommands.js';

describe('adminRouter', () => {
  it('subscribes guarded admin actions and returns results through the channel response', async () => {
    const channel = {id: 'channel-123456789'};
    const adminActions = {
      forceUpdateCheck: sinon.stub().resolves({ok: true, message: 'done'}),
    };
    const qrActions = {};
    const response = sinon.stub();

    await adminRouter({
      method: 'POST',
      url: '/update-check',
      originalUrl: '/update-check',
      socket: channel,
      services: {
        getRemotes: () => ({adminActions, qrActions}),
        getSystemConfig: () => ({adminActionsEnabled: true}),
        getAuthorization: () => ({authorize: () => ({allowed: true})}),
      },
      log: {info() {}},
      body: {},
    }, {response}, () => {});

    expect(adminActions.forceUpdateCheck.calledOnceWithExactly({
      clientId: channel.id,
    })).toBe(true);
    expect(response.calledOnceWithExactly({
      ok: true,
      message: 'done',
    })).toBe(true);
  });
});

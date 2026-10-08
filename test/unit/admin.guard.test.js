import sinon from 'sinon';
import {adminGuard} from '../../server/connection/actions/admin.guard.js';

function request({allowed = true, enabled = true} = {}) {
  return {
    socket: {id: 'abc12345', securityContext: {}},
    log: {warn: sinon.stub()},
    services: {
      getAuthorization: () => ({authorize: () => ({allowed})}),
      getSystemConfig: () => ({adminActionsEnabled: enabled}),
    },
  };
}

describe('adminGuard', () => {
  it('allows an enabled admin request', () => {
    const next = sinon.stub();
    adminGuard(request(), {status: sinon.stub()}, next);
    expect(next.calledOnceWithExactly()).toBe(true);
  });

  it.each([
    [false, true, 'admin_forbidden', 'Permission administrateur requise.'],
    [true, false, 'admin_actions_disabled', 'Admin actions disabled.'],
  ])('sends an error response when allowed=%s and enabled=%s', (allowed, enabled, _errorCode, message) => {
    const next = sinon.stub();
    const send = sinon.stub();
    const response = {status: sinon.stub().returns({send})};
    adminGuard(request({allowed, enabled}), response, next);
    expect(send.calledOnceWithExactly({ok: false, message})).toBe(true);
    expect(next.notCalled).toBe(true);
  });
});

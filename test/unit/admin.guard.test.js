import sinon from 'sinon';
import {createAdminEventGuard} from '../../server/connection/actions/admin.guard.js';

describe('createAdminEventGuard', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('allows an admin action when enabled', () => {
    const next = sandbox.stub();
    const guard = createAdminEventGuard({
      isAdminActionsEnabled: true,
      isAdmin: true,
      client: 'abc12345',
      log: {warn: sandbox.stub()},
    });

    guard({}, sandbox.stub(), next);

    expect(next.calledOnceWithExactly()).toBe(true);
  });

  it('responds and blocks when admin actions are disabled', () => {
    const next = sandbox.stub();
    const response = sandbox.stub();
    const guard = createAdminEventGuard({
      isAdminActionsEnabled: false,
      isAdmin: true,
      client: 'abc12345',
      log: {warn: sandbox.stub()},
    });

    guard({}, response, next);

    expect(response.calledOnceWithExactly({
      ok: false,
      message: 'Admin actions disabled.',
    })).toBe(true);
    expect(next.firstCall.args[0].message).toBe('admin_actions_disabled');
  });

  it('responds and blocks a non-admin client', () => {
    const next = sandbox.stub();
    const response = sandbox.stub();
    const guard = createAdminEventGuard({
      isAdminActionsEnabled: true,
      isAdmin: false,
      client: 'abc12345',
      log: {warn: sandbox.stub()},
    });

    guard({}, response, next);

    expect(response.calledOnceWithExactly({
      ok: false,
      message: 'Permission administrateur requise.',
    })).toBe(true);
    expect(next.firstCall.args[0].message).toBe('admin_forbidden');
  });
});

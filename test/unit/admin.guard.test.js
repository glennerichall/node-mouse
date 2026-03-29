import sinon from 'sinon';
import {createAdminEventGuardMiddleware} from '../../server/connection/events/admin.guard.js';

describe('createAdminEventGuardMiddleware', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('passes through non-admin events', () => {
    const warn = sandbox.stub();
    const respondAdminAction = sandbox.stub();
    const next = sandbox.stub();
    const guard = createAdminEventGuardMiddleware({
      isAdminActionsEnabled: false,
      client: 'abc12345',
      log: {warn},
      respondAdminAction,
    });

    guard(['mouse:move', {dx: 1, dy: 2}], next);

    expect(next.calledOnceWithExactly()).toBe(true);
    expect(warn.called).toBe(false);
    expect(respondAdminAction.called).toBe(false);
  });

  it('allows admin events when enabled', () => {
    const warn = sandbox.stub();
    const respondAdminAction = sandbox.stub();
    const next = sandbox.stub();
    const guard = createAdminEventGuardMiddleware({
      isAdminActionsEnabled: true,
      client: 'abc12345',
      log: {warn},
      respondAdminAction,
    });

    guard(['admin:update-check', {}], next);

    expect(next.calledOnceWithExactly()).toBe(true);
    expect(warn.called).toBe(false);
    expect(respondAdminAction.called).toBe(false);
  });

  it('blocks admin events when disabled and responds to client', () => {
    const warn = sandbox.stub();
    const respondAdminAction = sandbox.stub();
    const next = sandbox.stub();
    const guard = createAdminEventGuardMiddleware({
      isAdminActionsEnabled: false,
      client: 'abc12345',
      log: {warn},
      respondAdminAction,
    });

    guard(['admin:service-restart', {}], next);

    expect(warn.calledOnce).toBe(true);
    expect(respondAdminAction.calledOnce).toBe(true);
    expect(respondAdminAction.firstCall.args[0]).toBe('service-restart');
    expect(respondAdminAction.firstCall.args[1]).toEqual({
      ok: false,
      message: 'Actions admin desactivees.',
    });
    expect(next.calledOnce).toBe(true);
    expect(next.firstCall.args[0]).toBeInstanceOf(Error);
    expect(next.firstCall.args[0].message).toBe('admin_actions_disabled');
  });
});

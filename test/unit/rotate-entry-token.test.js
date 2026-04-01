import sinon from 'sinon';
import {createRotateEntryTokenAction} from '../../server/remotes/admin/rotate-entry-token.js';
import {
  NOTIFIER_LEVEL_ERROR,
  NOTIFIER_LEVEL_INFO,
  NOTIFIER_LEVEL_WARNING,
  NOTIFIER_TARGET_CLIENT,
} from '../../server/notifier/notifier-composite.js';

describe('createRotateEntryTokenAction', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns error when token is empty after rotate', async () => {
    const notify = sandbox.stub();
    const target = sandbox.stub().withArgs(NOTIFIER_TARGET_CLIENT).returns({notify});
    const action = createRotateEntryTokenAction({
      notifier: {target},
      tokenManager: {
        getToken: sandbox.stub().returns('old-token'),
        createToken: sandbox.stub().returns(''),
      },
    });

    const result = await action({clientId: 'client-a'});

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/desactive/i);
    expect(target.calledOnceWithExactly(NOTIFIER_TARGET_CLIENT)).toBe(true);
    expect(notify.calledOnce).toBe(true);
    expect(notify.firstCall.args[0].level).toBe(NOTIFIER_LEVEL_ERROR);
    expect(notify.firstCall.args[1]).toEqual({clientId: 'client-a'});
  });

  it('returns warning when token does not change', async () => {
    const notify = sandbox.stub();
    const target = sandbox.stub().withArgs(NOTIFIER_TARGET_CLIENT).returns({notify});
    const action = createRotateEntryTokenAction({
      notifier: {target},
      tokenManager: {
        getToken: sandbox.stub().returns('same-token'),
        createToken: sandbox.stub().returns('same-token'),
      },
    });

    const result = await action({clientId: 'client-b'});

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/non change|fixe/i);
    expect(target.calledOnceWithExactly(NOTIFIER_TARGET_CLIENT)).toBe(true);
    expect(notify.calledOnce).toBe(true);
    expect(notify.firstCall.args[0].level).toBe(NOTIFIER_LEVEL_WARNING);
  });

  it('succeeds when token changes', async () => {
    const notify = sandbox.stub();
    const target = sandbox.stub().withArgs(NOTIFIER_TARGET_CLIENT).returns({notify});
    const action = createRotateEntryTokenAction({
      notifier: {target},
      tokenManager: {
        getToken: sandbox.stub().returns('old-token'),
        createToken: sandbox.stub().returns('new-token'),
      },
    });

    const result = await action({clientId: 'client-c'});

    expect(result.ok).toBe(true);
    expect(target.calledOnceWithExactly(NOTIFIER_TARGET_CLIENT)).toBe(true);
    expect(notify.calledOnce).toBe(true);
    expect(notify.firstCall.args[0].level).toBe(NOTIFIER_LEVEL_INFO);
    expect(notify.firstCall.args[1]).toEqual({clientId: 'client-c'});
  });
});

import sinon from 'sinon';
import {createRotateEntryTokenAction} from '../../server/admin/rotate-entry-token.js';

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
    const action = createRotateEntryTokenAction({
      notifier: {notify},
      tokenManager: {
        getToken: sandbox.stub().returns('old-token'),
        createToken: sandbox.stub().returns(''),
      },
    });

    const result = await action({clientId: 'client-a'});

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/desactive/i);
    expect(notify.calledOnce).toBe(true);
    expect(notify.firstCall.args[0].target).toBe('client');
    expect(notify.firstCall.args[0].clientId).toBe('client-a');
  });

  it('returns warning when token does not change', async () => {
    const notify = sandbox.stub();
    const action = createRotateEntryTokenAction({
      notifier: {notify},
      tokenManager: {
        getToken: sandbox.stub().returns('same-token'),
        createToken: sandbox.stub().returns('same-token'),
      },
    });

    const result = await action({clientId: 'client-b'});

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/non change|fixe/i);
    expect(notify.calledOnce).toBe(true);
    expect(notify.firstCall.args[0].level).toBe('warning');
  });

  it('succeeds when token changes', async () => {
    const notify = sandbox.stub();
    const action = createRotateEntryTokenAction({
      notifier: {notify},
      tokenManager: {
        getToken: sandbox.stub().returns('old-token'),
        createToken: sandbox.stub().returns('new-token'),
      },
    });

    const result = await action({clientId: 'client-c'});

    expect(result.ok).toBe(true);
    expect(notify.calledOnce).toBe(true);
    expect(notify.firstCall.args[0].level).toBe('info');
    expect(notify.firstCall.args[0].target).toBe('client');
  });
});

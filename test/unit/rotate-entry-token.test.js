import sinon from 'sinon';
import {createRotateEntryTokenAction} from '../../server/remotes/admin/rotate-entry-token.js';
import {
  PUBSUB_EVENT_ADMIN_REJECTED_DISABLED,
  PUBSUB_EVENT_ADMIN_ROTATED,
  PUBSUB_EVENT_ADMIN_UNCHANGED,
  PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN,
} from '../../server/services/pubsub/serviceEventConstants.js';

describe('createRotateEntryTokenAction', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns error when token is empty after rotate', async () => {
    const publishEvent = sandbox.stub();
    const action = createRotateEntryTokenAction({
      getLogger: sandbox.stub().returns({info: sandbox.stub()}),
      getEvents: sandbox.stub().returns({publishEvent}),
      getTokenManager: sandbox.stub().returns({
        getToken: sandbox.stub().returns('old-token'),
        createToken: sandbox.stub().returns(''),
      }),
    });

    const result = await action({clientId: 'client-a'});

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/desactive/i);
    expect(publishEvent.calledOnce).toBe(true);
    expect(publishEvent.firstCall.args).toEqual([
      PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN,
      PUBSUB_EVENT_ADMIN_REJECTED_DISABLED,
      {clientId: 'client-a'},
    ]);
  });

  it('returns warning when token does not change', async () => {
    const publishEvent = sandbox.stub();
    const action = createRotateEntryTokenAction({
      getLogger: sandbox.stub().returns({info: sandbox.stub()}),
      getEvents: sandbox.stub().returns({publishEvent}),
      getTokenManager: sandbox.stub().returns({
        getToken: sandbox.stub().returns('same-token'),
        createToken: sandbox.stub().returns('same-token'),
      }),
    });

    const result = await action({clientId: 'client-b'});

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/non change|fixe/i);
    expect(publishEvent.calledOnce).toBe(true);
    expect(publishEvent.firstCall.args).toEqual([
      PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN,
      PUBSUB_EVENT_ADMIN_UNCHANGED,
      {clientId: 'client-b'},
    ]);
  });

  it('succeeds when token changes', async () => {
    const publishEvent = sandbox.stub();
    const info = sandbox.stub();
    const action = createRotateEntryTokenAction({
      getLogger: sandbox.stub().returns({info}),
      getEvents: sandbox.stub().returns({publishEvent}),
      getTokenManager: sandbox.stub().returns({
        getToken: sandbox.stub().returns('old-token'),
        createToken: sandbox.stub().returns('new-token'),
      }),
    });

    const result = await action({clientId: 'client-c'});

    expect(result.ok).toBe(true);
    expect(publishEvent.calledOnce).toBe(true);
    expect(publishEvent.firstCall.args).toEqual([
      PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN,
      PUBSUB_EVENT_ADMIN_ROTATED,
      {clientId: 'client-c'},
    ]);
    expect(info.calledOnce).toBe(true);
  });
});

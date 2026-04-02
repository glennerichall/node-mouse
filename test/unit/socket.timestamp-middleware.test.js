import sinon from 'sinon';
import {socketTimestampGuardMiddleware} from '../../server/connection/socket/socket.timestamp-middleware.js';

describe('createSocketTimestampGuardMiddleware', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('rejects packet without timestamp', () => {
    const middleware = socketTimestampGuardMiddleware({maxEventAgeMs: 1000, socketId: 's1'});
    const next = sandbox.stub();

    middleware(['mouse:move', {}], next);

    expect(next.calledOnce).toBe(true);
    expect(next.firstCall.args[0]).toBeInstanceOf(Error);
    expect(next.firstCall.args[0].message).toBe('missing_timestamp');
  });

  it('rejects stale packet', () => {
    const middleware = socketTimestampGuardMiddleware({maxEventAgeMs: 100, socketId: 's1'});
    const next = sandbox.stub();
    const ts = Date.now() - 1000;

    middleware(['mouse:move', {ts}], next);

    expect(next.calledOnce).toBe(true);
    expect(next.firstCall.args[0]).toBeInstanceOf(Error);
    expect(next.firstCall.args[0].message).toBe('stale_event');
  });

  it('accepts fresh packet', () => {
    const middleware = socketTimestampGuardMiddleware({maxEventAgeMs: 1000, socketId: 's1'});
    const next = sandbox.stub();
    const ts = Date.now();

    middleware(['mouse:move', {ts}], next);

    expect(next.calledOnceWithExactly()).toBe(true);
  });
});

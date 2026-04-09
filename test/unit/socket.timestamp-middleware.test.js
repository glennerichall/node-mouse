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
    const middleware = socketTimestampGuardMiddleware({
      maxEventAgeMs: 100,
      maxClockSkewMs: 500,
      socketId: 's1',
    });
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

  it('accepts packets when client clock is consistently behind within skew budget', () => {
    const middleware = socketTimestampGuardMiddleware({
      maxEventAgeMs: 1000,
      maxClockSkewMs: 60_000,
      socketId: 's1',
    });
    const next = sandbox.stub();

    middleware(['mouse:move', {ts: Date.now() - 15_000}], next);
    middleware(['mouse:move', {ts: Date.now() - 15_020}], next);

    expect(next.calledTwice).toBe(true);
    expect(next.firstCall.args).toEqual([]);
    expect(next.secondCall.args).toEqual([]);
  });

  it('still rejects truly stale packets after clock calibration', () => {
    const middleware = socketTimestampGuardMiddleware({
      maxEventAgeMs: 1000,
      maxClockSkewMs: 60_000,
      socketId: 's1',
    });
    const next = sandbox.stub();

    middleware(['mouse:move', {ts: Date.now() - 15_000}], next);
    middleware(['mouse:move', {ts: Date.now() - 18_000}], next);

    expect(next.firstCall.args).toEqual([]);
    expect(next.secondCall.args[0]).toBeInstanceOf(Error);
    expect(next.secondCall.args[0].message).toBe('stale_event');
  });
});

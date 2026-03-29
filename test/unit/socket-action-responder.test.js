import sinon from 'sinon';
import {createSocketActionResponder} from '../../server/connection/socket/socket-action-responder.js';

describe('createSocketActionResponder', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('emits normalized action payload on default event', () => {
    const emit = sandbox.stub();
    const respond = createSocketActionResponder({
      socket: {emit},
    });

    respond('update-check', {ok: true, message: 'done'});

    expect(emit.calledOnce).toBe(true);
    expect(emit.firstCall.args[0]).toBe('admin:result');
    expect(emit.firstCall.args[1]).toEqual({
      action: 'update-check',
      ok: true,
      message: 'done',
    });
  });

  it('uses custom event name and coerces ok boolean', () => {
    const emit = sandbox.stub();
    const respond = createSocketActionResponder({
      socket: {emit},
      eventName: 'custom:event',
    });

    respond('rotate', {message: 'x'});

    expect(emit.calledOnce).toBe(true);
    expect(emit.firstCall.args[0]).toBe('custom:event');
    expect(emit.firstCall.args[1]).toEqual({
      action: 'rotate',
      ok: false,
      message: 'x',
    });
  });
});

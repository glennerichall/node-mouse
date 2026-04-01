import sinon from 'sinon';
import {
  createNotifierComposite,
  NOTIFIER_TARGET_ALL_CLIENTS,
  NOTIFIER_TARGET_CLIENT,
  NOTIFIER_TARGET_SERVER,
} from '../../server/notifier/notifier-composite.js';

describe('createNotifierComposite', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns a targeted notifier that sends to a specific client', () => {
    const clientNotify = sandbox.stub();
    const serverNotify = sandbox.stub();
    const notifier = createNotifierComposite({
      clientNotifier: {notify: clientNotify},
      serverNotifier: {notify: serverNotify},
    });

    notifier.target(NOTIFIER_TARGET_CLIENT).notify({
      title: 'Admin',
      message: 'Done',
    }, {
      clientId: 'socket-1',
    });

    expect(clientNotify.calledOnce).toBe(true);
    expect(clientNotify.firstCall.args[1]).toEqual({
      scope: NOTIFIER_TARGET_CLIENT,
      clientId: 'socket-1',
    });
    expect(serverNotify.called).toBe(false);
  });

  it('defaults target() to all targets', () => {
    const clientNotify = sandbox.stub();
    const serverNotify = sandbox.stub();
    const notifier = createNotifierComposite({
      clientNotifier: {notify: clientNotify},
      serverNotifier: {notify: serverNotify},
    });

    notifier.target().notify({
      title: 'Broadcast',
      message: 'Hello',
    });

    expect(clientNotify.calledOnce).toBe(true);
    expect(clientNotify.firstCall.args[1]).toEqual({
      scope: NOTIFIER_TARGET_ALL_CLIENTS,
      clientId: undefined,
    });
    expect(serverNotify.calledOnce).toBe(true);
  });

  it('returns a targeted notifier that sends to server only', () => {
    const clientNotify = sandbox.stub();
    const serverNotify = sandbox.stub();
    const notifier = createNotifierComposite({
      clientNotifier: {notify: clientNotify},
      serverNotifier: {notify: serverNotify},
    });

    notifier.target(NOTIFIER_TARGET_SERVER).notify({
      title: 'Server',
      message: 'Hello',
    });

    expect(clientNotify.called).toBe(false);
    expect(serverNotify.calledOnce).toBe(true);
  });

  it('returns a targeted notifier that sends to all clients only', () => {
    const clientNotify = sandbox.stub();
    const serverNotify = sandbox.stub();
    const notifier = createNotifierComposite({
      clientNotifier: {notify: clientNotify},
      serverNotifier: {notify: serverNotify},
    });

    notifier.target(NOTIFIER_TARGET_ALL_CLIENTS).notify({
      title: 'Clients',
      message: 'Clients only',
    });

    expect(clientNotify.calledOnce).toBe(true);
    expect(clientNotify.firstCall.args[1]).toEqual({
      scope: NOTIFIER_TARGET_ALL_CLIENTS,
      clientId: undefined,
    });
    expect(serverNotify.called).toBe(false);
  });

  it('does nothing when message is empty', () => {
    const clientNotify = sandbox.stub();
    const serverNotify = sandbox.stub();
    const notifier = createNotifierComposite({
      clientNotifier: {notify: clientNotify},
      serverNotifier: {notify: serverNotify},
    });

    notifier.target().notify({
      title: 'Ignore',
      message: '',
    });

    expect(clientNotify.called).toBe(false);
    expect(serverNotify.called).toBe(false);
  });
});

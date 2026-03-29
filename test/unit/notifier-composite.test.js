import sinon from 'sinon';
import {createNotifierComposite} from '../../server/notifier/notifier-composite.js';

describe('createNotifierComposite', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('sends to specific client when target=client', () => {
    const clientNotify = sandbox.stub();
    const serverNotify = sandbox.stub();
    const notifier = createNotifierComposite({
      clientNotifier: {notify: clientNotify},
      serverNotifier: {notify: serverNotify},
    });

    notifier.notify({
      title: 'Admin',
      message: 'Done',
      target: 'client',
      clientId: 'socket-1',
    });

    expect(clientNotify.calledOnce).toBe(true);
    expect(clientNotify.firstCall.args[1]).toEqual({
      scope: 'client',
      clientId: 'socket-1',
    });
    expect(serverNotify.called).toBe(false);
  });

  it('sends to server only when target=server', () => {
    const clientNotify = sandbox.stub();
    const serverNotify = sandbox.stub();
    const notifier = createNotifierComposite({
      clientNotifier: {notify: clientNotify},
      serverNotifier: {notify: serverNotify},
    });

    notifier.notify({
      title: 'Server',
      message: 'Hello',
      target: 'server',
    });

    expect(clientNotify.called).toBe(false);
    expect(serverNotify.calledOnce).toBe(true);
  });

  it('keeps legacy flags compatibility', () => {
    const clientNotify = sandbox.stub();
    const serverNotify = sandbox.stub();
    const notifier = createNotifierComposite({
      clientNotifier: {notify: clientNotify},
      serverNotifier: {notify: serverNotify},
    });

    notifier.notify({
      title: 'Legacy',
      message: 'Clients only',
      toDesktop: false,
      toClients: true,
    });

    expect(clientNotify.calledOnce).toBe(true);
    expect(clientNotify.firstCall.args[1]).toEqual({
      scope: 'all-clients',
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

    notifier.notify({
      title: 'Ignore',
      message: '',
      target: 'all',
    });

    expect(clientNotify.called).toBe(false);
    expect(serverNotify.called).toBe(false);
  });
});

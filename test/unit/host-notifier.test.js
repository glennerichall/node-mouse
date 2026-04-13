import {jest} from '@jest/globals';

describe('createHostNotifier', () => {
  const previousLang = process.env.LANG;

  afterEach(() => {
    process.env.LANG = previousLang;
    jest.resetModules();
  });

  it('does not materialize the platform notifier during builder creation', async () => {
    const notify = jest.fn();
    const createHostNotifierByPlatform = jest.fn(() => ({notify}));

    jest.unstable_mockModule('../../server/services/notifier/host-notifier/index.js', () => ({
      createHostNotifierByPlatform,
    }));

    const {createHostNotifier} = await import('../../server/services/notifier/createHostNotifier.js');
    const hostNotifier = createHostNotifier({getConfig: jest.fn()});

    expect(createHostNotifierByPlatform).not.toHaveBeenCalled();

    hostNotifier.notify({message: 'hello', ttlMs: 1000});

    expect(createHostNotifierByPlatform).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith({message: 'hello', ttlMs: 1000});
  });

  it('translates key-based notifications before sending them to the platform notifier', async () => {
    process.env.LANG = 'fr_CA.UTF-8';
    const notify = jest.fn();
    const createHostNotifierByPlatform = jest.fn(() => ({notify}));

    jest.unstable_mockModule('../../server/services/notifier/host-notifier/index.js', () => ({
      createHostNotifierByPlatform,
    }));

    const {createHostNotifier} = await import('../../server/services/notifier/createHostNotifier.js');
    const hostNotifier = createHostNotifier({getConfig: jest.fn()});

    hostNotifier.notify({
      titleKey: 'notification.clientConnected.title',
      messageKey: 'notification.clientConnected.message',
      params: {
        clientId: 'abc123',
      },
      ttlMs: 1000,
    });

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Client connecte',
      message: 'Client abc123 connecte.',
      titleKey: 'notification.clientConnected.title',
      messageKey: 'notification.clientConnected.message',
      ttlMs: 1000,
    }));
  });
});

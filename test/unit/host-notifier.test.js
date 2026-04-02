import {jest} from '@jest/globals';

describe('createHostNotifier', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('does not materialize the platform notifier during builder creation', async () => {
    const notify = jest.fn();
    const createHostNotifierByPlatform = jest.fn(() => ({notify}));

    jest.unstable_mockModule('../../server/services/notifier/host-notifier/index.js', () => ({
      createHostNotifierByPlatform,
    }));

    const {createHostNotifier} = await import('../../server/services/notifier/createHostNotifier.js');
    const getConfig = jest.fn(() => ({
      notifications: {
        desktop: true,
      },
    }));

    const hostNotifier = createHostNotifier({getConfig});

    expect(createHostNotifierByPlatform).not.toHaveBeenCalled();
    expect(getConfig).not.toHaveBeenCalled();

    hostNotifier.notify({message: 'hello', ttlMs: 1000});

    expect(getConfig).toHaveBeenCalled();
    expect(createHostNotifierByPlatform).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith({message: 'hello', ttlMs: 1000});
  });
});

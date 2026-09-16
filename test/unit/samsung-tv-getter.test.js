import {jest} from '@jest/globals';
import {createSamsungTvGetter} from '../../server/remotes/samsung/createSamsungTvGetter.js';

describe('Samsung TV getter', () => {
  const config = {
    alwaysAutoResolve: true,
    appName: 'Remote Mouse',
    host: '192.168.1.50',
    mac: 'AA:BB:CC:DD:EE:FF',
    port: 8002,
    timeoutMs: 5000,
  };

  it('checks the Samsung control port instead of relying on ping', async () => {
    const isTcpPortOpenFn = jest.fn().mockResolvedValue(false);
    const getSamsungTv = createSamsungTvGetter({
      getConfig: () => config,
      resolveDeviceConfig: async () => ({ip: config.host, mac: config.mac}),
      isTcpPortOpenFn,
      wakeHostFn: jest.fn(),
      SamsungTvRemoteClass: class {},
    });

    const samsungTv = await getSamsungTv();

    await expect(samsungTv.getPowerState()).resolves.toBe('off');
    expect(isTcpPortOpenFn).toHaveBeenCalledWith(config.host, config.port, 2000);
  });

  it('sends Wake-on-LAN even when the TV still responds to ping', async () => {
    const wakeHostFn = jest.fn().mockResolvedValue();
    const remoteWake = jest.fn();
    const getSamsungTv = createSamsungTvGetter({
      getConfig: () => config,
      resolveDeviceConfig: async () => ({ip: config.host, mac: config.mac}),
      isTcpPortOpenFn: jest.fn(),
      wakeHostFn,
      SamsungTvRemoteClass: class {
        wakeTV = remoteWake;
      },
    });

    const samsungTv = await getSamsungTv();
    await samsungTv.wakeTV();

    expect(wakeHostFn).toHaveBeenCalledWith(config.mac);
    expect(remoteWake).not.toHaveBeenCalled();
  });
});

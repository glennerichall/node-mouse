import sinon from 'sinon';

import {
  createSamsungDeviceConfigResolver,
  normalizeMac,
  pickSamsungDevice,
} from '../../server/remotes/samsung/device-config.js';

describe('samsung device config', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('normalizes mac addresses consistently', () => {
    expect(normalizeMac('AA:BB-CC dd.ee ff')).toBe('aabbccddeeff');
  });

  it('picks a candidate by configured host first', () => {
    const selected = pickSamsungDevice([
      {ip: '192.168.1.10', wifiMac: 'AA:BB:CC:DD:EE:01'},
      {ip: '192.168.1.20', wifiMac: 'AA:BB:CC:DD:EE:02'},
    ], {
      host: '192.168.1.20',
      mac: '',
    });

    expect(selected?.ip).toBe('192.168.1.20');
  });

  it('returns explicit host and mac without network discovery', async () => {
    const getLastConnectedDeviceFn = sandbox.stub();
    const getAwakeSamsungDevicesFn = sandbox.stub();

    const resolveDeviceConfig = createSamsungDeviceConfigResolver({
      config: {
        host: '192.168.1.55',
        mac: 'AA:BB:CC:DD:EE:FF',
        discoveryTimeoutMs: 3000,
      },
      log: {info: sandbox.stub()},
      getLastConnectedDeviceFn,
      getAwakeSamsungDevicesFn,
    });

    await expect(resolveDeviceConfig()).resolves.toEqual({
      ip: '192.168.1.55',
      mac: 'AA:BB:CC:DD:EE:FF',
    });
    expect(getLastConnectedDeviceFn.called).toBe(false);
    expect(getAwakeSamsungDevicesFn.called).toBe(false);
  });

  it('throws when several devices are discovered without a selector', async () => {
    const resolveDeviceConfig = createSamsungDeviceConfigResolver({
      config: {
        host: '',
        mac: '',
        discoveryTimeoutMs: 3000,
      },
      log: {info: sandbox.stub()},
      getLastConnectedDeviceFn: sandbox.stub().returns(null),
      getAwakeSamsungDevicesFn: sandbox.stub().resolves([
        {ip: '192.168.1.10', wifiMac: 'AA:BB:CC:DD:EE:01'},
        {ip: '192.168.1.20', wifiMac: 'AA:BB:CC:DD:EE:02'},
      ]),
    });

    await expect(resolveDeviceConfig()).rejects.toThrow(
      'plusieurs TV Samsung detectees, renseignez SAMSUNG_TV_HOST ou SAMSUNG_TV_MAC',
    );
  });
});

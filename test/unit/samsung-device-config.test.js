import sinon from 'sinon';

import {
  createSamsungDeviceConfigResolver,
  discoverSamsungDevices,
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
    const getLogger = () => ({info: sandbox.stub()});

    const resolveDeviceConfig = createSamsungDeviceConfigResolver({
      getConfig: () => ({
        host: '192.168.1.55',
        mac: 'AA:BB:CC:DD:EE:FF',
        discoveryTimeoutMs: 3000,
      }),
      getLogger,
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

  it('deduplicates discovered devices with the last connected candidate first', async () => {
    const discoverDevices = discoverSamsungDevices({
      getConfig: () => ({
        discoveryTimeoutMs: 3000,
      }),
      getLastConnectedDeviceFn: sandbox.stub().returns({
        ip: '192.168.1.10',
        wifiMac: 'AA:BB:CC:DD:EE:01',
        name: 'Salon',
      }),
      getAwakeSamsungDevicesFn: sandbox.stub().resolves([
        {ip: '192.168.1.10', wifiMac: 'AA:BB:CC:DD:EE:01', name: 'Salon'},
        {ip: '192.168.1.20', wifiMac: 'AA:BB:CC:DD:EE:02', name: 'Bureau'},
      ]),
    });

    await expect(discoverDevices()).resolves.toEqual([
      {ip: '192.168.1.10', wifiMac: 'AA:BB:CC:DD:EE:01', name: 'Salon'},
      {ip: '192.168.1.20', wifiMac: 'AA:BB:CC:DD:EE:02', name: 'Bureau'},
    ]);
  });

  it('ignores configured host and mac when always auto resolve is enabled', async () => {
    const getLastConnectedDeviceFn = sandbox.stub().returns(null);
    const getAwakeSamsungDevicesFn = sandbox.stub().resolves([
      {ip: '192.168.1.20', wifiMac: 'AA:BB:CC:DD:EE:02', name: 'Bureau'},
    ]);
    const getLogger = () => ({info: sandbox.stub()});

    const resolveDeviceConfig = createSamsungDeviceConfigResolver({
      getConfig: () => ({
        alwaysAutoResolve: true,
        host: '192.168.1.55',
        mac: 'AA:BB:CC:DD:EE:FF',
        discoveryTimeoutMs: 3000,
      }),
      getLogger,
      getLastConnectedDeviceFn,
      getAwakeSamsungDevicesFn,
    });

    await expect(resolveDeviceConfig()).resolves.toEqual({
      ip: '192.168.1.20',
      mac: 'AA:BB:CC:DD:EE:02',
    });
    expect(getAwakeSamsungDevicesFn.calledOnce).toBe(true);
  });

  it('throws when several devices are discovered without a selector', async () => {
    const getLogger = () => ({info: sandbox.stub()});
    const resolveDeviceConfig = createSamsungDeviceConfigResolver({
      getConfig: () => ({
        host: '',
        mac: '',
        discoveryTimeoutMs: 3000,
      }),
      getLogger,
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

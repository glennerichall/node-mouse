import {jest} from '@jest/globals';

const discoverSamsungDevices = jest.fn();
const getSamsungDeviceMac = jest.fn((device) => device?.mac || '');
const normalizeMac = jest.fn((value) => String(value || '').toLowerCase());
const pickSamsungDevice = jest.fn((devices) => devices[0] || null);

jest.unstable_mockModule('../../server/remotes/samsung/device-config.js', () => ({
  discoverSamsungDevices,
  getSamsungDeviceMac,
  normalizeMac,
  pickSamsungDevice,
}));

const {discoverSamsung, restartService} = await import('../../server/connection/api/admin-action.handlers.js');

function response() {
  return {status: jest.fn().mockReturnThis(), json: jest.fn()};
}

describe('admin action handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps discovered Samsung devices and selected state', async () => {
    const devices = [{name: 'TV', model: 'Q90', ip: '192.168.1.5', mac: 'AA:BB'}];
    discoverSamsungDevices.mockReturnValue(jest.fn().mockResolvedValue(devices));
    const res = response();

    await discoverSamsung({
      services: {
        getConfig: () => ({samsungTv: {alwaysAutoResolve: true}}),
      },
    }, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      devices: [{
        name: 'TV',
        model: 'Q90',
        host: '192.168.1.5',
        mac: 'AA:BB',
        isSelected: true,
      }],
    });
  });

  it('returns a controlled error when discovery fails', async () => {
    discoverSamsungDevices.mockImplementation(() => {
      throw new Error('discovery failed');
    });
    const res = response();

    await discoverSamsung({services: {getConfig: () => ({samsungTv: {}})}}, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('restarts the service and mirrors its result status', async () => {
    const restart = jest.fn().mockResolvedValue({ok: true});
    const res = response();

    await restartService({services: {getApplicationDaemonService: () => ({restart})}}, res);

    expect(restart).toHaveBeenCalledWith({cause: 'user', source: 'admin-http'});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ok: true});
  });
});

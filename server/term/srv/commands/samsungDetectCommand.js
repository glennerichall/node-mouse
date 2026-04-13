import {
  getSamsungDeviceMac,
  pickSamsungDevice,
} from '../../../remotes/samsung/device-config.js';

function mapDevice(device) {
  return {
    name: String(device?.name || '').trim(),
    model: String(device?.model || '').trim(),
    host: String(device?.ip || '').trim(),
    mac: getSamsungDeviceMac(device),
  };
}

export async function executeSamsungDetectCommand(services) {
  try {
    const samsungConfig = services.getConfig().samsungTv;
    const devices = await services.getRemotes().samsung.discoverDevices();
    const selected = pickSamsungDevice(
      devices,
      samsungConfig.alwaysAutoResolve
        ? {...samsungConfig, host: '', mac: ''}
        : samsungConfig,
    );

    if (!selected) {
      if (!devices.length) {
        return {
          ok: false,
          message: 'Aucune TV Samsung detectee.',
        };
      }

      return {
        ok: false,
        message: 'Plusieurs TV Samsung detectees. Configurez samsungTv.host ou samsungTv.mac, ou desactivez alwaysAutoResolve.',
        data: devices.map(mapDevice),
      };
    }

    return {
      ok: true,
      message: 'TV Samsung detectee.',
      data: mapDevice(selected),
    };
  } catch (error) {
    return {
      ok: false,
      message: String(error?.message || error || 'Decouverte Samsung impossible.'),
    };
  }
}

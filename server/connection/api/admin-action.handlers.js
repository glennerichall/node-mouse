import {
  discoverSamsungDevices,
  getSamsungDeviceMac,
  normalizeMac,
  pickSamsungDevice,
} from '../../remotes/samsung/device-config.js';

export async function discoverSamsung(req, res) {
  const {services} = req;
  try {
    const config = services.getConfig().samsungTv;
    const discoverDevices = discoverSamsungDevices({
      getConfig: () => config,
    });
    const devices = await discoverDevices();
    const selected = pickSamsungDevice(devices, config.alwaysAutoResolve ? {
      ...config,
      host: '',
      mac: '',
    } : config);

    res.json({
      ok: true,
      devices: devices.map((device) => ({
        name: String(device?.name || '').trim(),
        model: String(device?.model || '').trim(),
        host: String(device?.ip || '').trim(),
        mac: getSamsungDeviceMac(device),
        isSelected: Boolean(
          selected
          && String(selected.ip || '').trim() === String(device?.ip || '').trim()
          && normalizeMac(getSamsungDeviceMac(selected)) === normalizeMac(getSamsungDeviceMac(device)),
        ),
      })),
    });
  } catch (_error) {
    res.status(500).json({
      ok: false,
      message: 'Erreur lors de la découverte Samsung.',
    });
  }
}

export async function restartService(req, res) {
  const result = await req.services.getApplicationDaemonService().restart({
    cause: 'user',
    source: 'admin-http',
  });

  res.status(result?.ok ? 200 : 500).json(result);
}

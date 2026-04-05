import express from 'express';
import path from 'node:path';

import {
    discoverSamsungDevices,
    getSamsungDeviceMac,
    normalizeMac,
    pickSamsungDevice
} from '../../remotes/samsung/device-config.js';
import {
    commandExists,
    spawnDetached
} from '../../utils/process.js';
import {writeRestartMarker} from '../../remotes/admin/notifyIfRestarted.js';

export {
    buildManagedConfigPayload,
    coerceConfigValue,
} from './admin-config.shared.js';

export function createAdminConfigRouter({publicDir} = {}) {
    const router = express.Router();

    router.get('/', (_req, res) => {
        res.sendFile(path.join(publicDir, 'admin-config.html'));
    });

    return router;
}

export function createAdminConfigActionsRouter(services) {
    const router = express.Router();

    router.post('/configs/samsung/discover', async (_req, res) => {
        try {
            const discoverDevices = discoverSamsungDevices({
                getConfig: () => services.getConfig().samsungTv,
            });
            const samsungConfig = services.getConfig().samsungTv;
            const devices = await discoverDevices();
            const selected = pickSamsungDevice(
                devices,
                samsungConfig.alwaysAutoResolve
                    ? {...samsungConfig, host: '', mac: ''}
                    : samsungConfig,
            );

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
        } catch (error) {
            res.status(500).json({
                ok: false,
                message: String(error?.message || error || 'Erreur de decouverte Samsung.'),
            });
        }
    });

    router.post('/restart-service', async (_req, res) => {
        const config = services.getConfig();

        if (!(await commandExists('systemctl'))) {
            res.status(400).json({
                ok: false,
                message: 'systemctl is unavailable.',
            });
            return;
        }

        writeRestartMarker();
        const spawned = await spawnDetached(
            'bash',
            ['-lc', `sleep 0.8; systemctl --user restart ${config.serviceName}`],
        );

        if (!spawned) {
            res.status(500).json({
                ok: false,
                message: 'Unable to start the restart command.',
            });
            return;
        }

        res.json({
            ok: true,
            message: `Restart requested for ${config.serviceName}.`,
        });
    });

    return router;
}

import express from 'express';
import path from 'node:path';

import {
    commandExists,
    spawnDetached
} from '../../utils/process.js';
import {writeRestartMarker} from '../../remotes/admin/restart-marker.js';

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

export function createAdminConfigActionsRouter({getConfigSnapshot} = {}) {
    const router = express.Router();

    router.post('/restart-service', async (_req, res) => {
        const config = getConfigSnapshot();

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

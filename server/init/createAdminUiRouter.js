import express from "express";
import path from "node:path";
import {createAdminConfigRouter} from "../connection/api/admin-config.router.js";
import {publicDir} from "../utils/paths.js";

export function createAdminUiRouter(_services) {
    const router = express.Router();

    router.use('/config', createAdminConfigRouter({
        publicDir,
    }));

    router.get('/server-info', (_req, res) => {
        res.sendFile(path.join(publicDir, 'server-info.html'));
    });

    return router;
}

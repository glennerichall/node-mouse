import express from "express";
import path from "node:path";
import {publicDir} from "../utils/paths.js";

export function createAdminUiRouter(_services) {
    const router = express.Router();

    router.get('/config', (_req, res) => {
        res.sendFile(path.join(publicDir, 'admin-config.html'));
    });
    
    router.get('/server-info', (_req, res) => {
        res.sendFile(path.join(publicDir, 'server-info.html'));
    });

    router.get('/preferences', (_req, res) => {
        res.sendFile(path.join(publicDir, 'preferences.html'));
    });

    return router;
}

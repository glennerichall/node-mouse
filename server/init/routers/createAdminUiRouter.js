import express from "express";
import path from "node:path";
import {publicDir} from "../../utils/paths.js";

export const adminUiRouter = express.Router()

    .get('/config', (_req, res) => {
        res.sendFile(path.join(publicDir, 'admin-config.html'));
    })

    .get('/security', (_req, res) => {
        res.sendFile(path.join(publicDir, 'admin-security.html'));
    })

    .get('/server-info', (_req, res) => {
        res.sendFile(path.join(publicDir, 'server-info.html'));
    })

    .get('/preferences', (_req, res) => {
        res.sendFile(path.join(publicDir, 'preferences.html'));
    });

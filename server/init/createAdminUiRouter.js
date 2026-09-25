import express from "express";
import path from "node:path";
import {publicDir} from "../utils/paths.js";

export const adminUiRouter = express.Router();

    adminUiRouter.get('/config', (_req, res) => {
        res.sendFile(path.join(publicDir, 'admin-config.html'));
    });
    
    adminUiRouter.get('/server-info', (_req, res) => {
        res.sendFile(path.join(publicDir, 'server-info.html'));
    });

    adminUiRouter.get('/preferences', (_req, res) => {
        res.sendFile(path.join(publicDir, 'preferences.html'));
    });

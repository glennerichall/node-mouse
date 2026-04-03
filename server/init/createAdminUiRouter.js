import express from "express";
import path from 'node:path';
import {createAdminConfigRouter} from "../connection/api/admin-config.router.js";
import {projectRoot, publicDir} from "../utils/paths.js";
import {createServerInfoRouter} from "../connection/api/server-info.router.js";
import {getRecentLogs} from "../services/log/logger.js";
import {readPackageVersion} from '../utils/env.js';

const packageJsonPath = path.join(projectRoot, 'package.json');

export function createAdminUiRouter(services) {
    const router = express.Router();

    router.use('/config', createAdminConfigRouter({
        publicDir,
    }));

    router.use('/server-info', createServerInfoRouter({
        publicDir,
        io: services.getServer().io,
        serverStartedAt: services.getServer().serverStartedAt,
        getConfigSnapshot: services.getConfig,
        getSystemConfigSnapshot: services.getSystemConfig,
        getEntryPathConfig: () => services.getSystemConfig().entryPath,
        getRecentLogs,
        getVersion: () => readPackageVersion(packageJsonPath),
        getTasksSnapshot: () => services.getTaskManager().getTasksSnapshot(),
        getTokenEntriesSnapshot: () => services.getPersistence().entryTokenDao.loadEntryTokens(),
        getCurrentToken: () => services.getTokenManager().getToken(),
    }));

    return router;
}

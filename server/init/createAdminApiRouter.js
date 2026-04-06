import express from "express";
import {createServerInfoRouter} from "../connection/api/server-info.router.js";
import {createAdminConfigsRouter} from "../connection/api/admin-configs.router.js";
import {createAdminConfigActionsRouter} from "../connection/api/admin-config.router.js";
import {createAdminSubsRouter} from "../connection/api/admin-subs.router.js";
import {createAdminRemotesRouter} from '../connection/api/admin-remotes.router.js';

export function createAdminApiRouter(services) {
    const router = express.Router();

    router.use('/server-info', createServerInfoRouter(services));

    router.use('/configs', createAdminConfigsRouter(services));
    
    router.use('/remotes', createAdminRemotesRouter(services));

    router.use('/subs', createAdminSubsRouter(services));

    router.use('/', createAdminConfigActionsRouter(services));

    return router;
}

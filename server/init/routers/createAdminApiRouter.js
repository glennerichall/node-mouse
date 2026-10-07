import express from "express";
import {serverInfoRouter} from "../../connection/api/routers/server-info.router.js";
import {adminConfigsRouter} from "../../connection/api/routers/admin-configs.router.js";
import {adminConfigActionsRouter} from "../../connection/api/routers/admin-actions.router.js";
import {adminSubsRouter} from "../../connection/api/routers/admin-subs.router.js";
import {remotesCatalogRouter} from '../../connection/api/routers/remotes-catalog.router.js';
import {adminSessionsRouter} from '../../connection/api/routers/admin-sessions.router.js';
import {guardAdmin} from '../../connection/api/guards/admin.guard.js';

export const adminApiRouter = express.Router()

    .use(guardAdmin)

    .use('/server-info', serverInfoRouter)

    .use('/configs', adminConfigsRouter)

    .use('/remotes', remotesCatalogRouter)

    .use('/sessions', adminSessionsRouter)

    .use('/subs', adminSubsRouter)

    .use('/', adminConfigActionsRouter);

import express from "express";
import {serverInfoRouter} from "../connection/api/server-info.router.js";
import {adminConfigsRouter} from "../connection/api/admin-configs.router.js";
import {adminConfigActionsRouter} from "../connection/api/admin-actions.router.js";
import {adminSubsRouter} from "../connection/api/admin-subs.router.js";
import {adminRemotesRouter} from '../connection/api/admin-remotes.router.js';
import {guardAdmin} from '../connection/api/guard.admin.js';

export const adminApiRouter = express.Router()

    .use(guardAdmin)

    .use('/server-info', serverInfoRouter)

    .use('/configs', adminConfigsRouter)

    .use('/remotes', adminRemotesRouter)

    .use('/subs', adminSubsRouter)

    .use('/', adminConfigActionsRouter);

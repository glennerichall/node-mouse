import express from "express";
import {serverInfoRouter} from "../connection/api/server-info.router.js";
import {adminConfigsRouter} from "../connection/api/admin-configs.router.js";
import {adminConfigActionsRouter} from "../connection/api/admin-actions.router.js";
import {adminSubsRouter} from "../connection/api/admin-subs.router.js";
import {adminRemotesRouter} from '../connection/api/admin-remotes.router.js';

export const adminApiRouter = express.Router();

    adminApiRouter.use('/server-info', serverInfoRouter);

    adminApiRouter.use('/configs', adminConfigsRouter);
    
    adminApiRouter.use('/remotes', adminRemotesRouter);

    adminApiRouter.use('/subs', adminSubsRouter);

    adminApiRouter.use('/', adminConfigActionsRouter);

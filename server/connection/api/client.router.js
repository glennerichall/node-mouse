import express from 'express';

export function createStaticShareRouter({
                                    publicDir,
                                    clientDir,
                                    sharedUtilsDir,
                                }) {
    const router = express.Router();

    router.use(express.static(publicDir));
    router.use('/client', express.static(clientDir));
    router.use('/utils', express.static(sharedUtilsDir));
    return router;
}


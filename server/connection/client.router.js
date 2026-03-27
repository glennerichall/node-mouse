import express from 'express';

export function createClientEndpointsRouter({
                                    publicDir,
                                    clientDir,
                                    sharedUtilsDir,
                                    clientUtilsDir,
                                }) {
    const router = express.Router();

    router.use(express.static(publicDir));
    router.use('/client', express.static(clientDir));
    router.use('/utils/shared', express.static(sharedUtilsDir));
    router.use('/utils/client', express.static(clientUtilsDir));
    return router;
}



import {createSocketSessionAuthMiddleware} from '../connection/socket/socket-session-auth.js';
import {buildSocketApi} from '../connection/socket/buildSocketApi.js';
import {createSocketActionRegistrars} from './createSocketActionRegistrars.js';

export async function createSocket(instances) {
    const {configService} = instances;
    const config = configService.get();
    const {prepareSocketAuth, authorizeSocket} = createSocketSessionAuthMiddleware(
        instances,
        {
            cookieName: config.session.cookieName,
        });

    const socketActionRegistrars = await createSocketActionRegistrars(instances);

    buildSocketApi({
        ...instances,
        socketActionRegistrars,
        maxEventAgeMs: config.session.socketEventMaxAgeMs,
        prepareSocketAuth,
        authorizeSocket,
    });

    return {
        ...instances,
        socketActionRegistrars
    };
}

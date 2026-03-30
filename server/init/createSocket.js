import {createSocketSessionAuthMiddleware} from "../connection/socket/socket-session-auth.js";
import {
    getConfig,
} from "./config/index.js";
import {buildSocketApi} from "../connection/socket/buildSocketApi.js";
import {createSocketActionRegistrars} from "./createSocketActionRegistrars.js";

export async function createSocket(instances) {
    const config = getConfig();
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

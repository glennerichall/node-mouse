import {createWsSessionAuth} from "../connection/ws-session-auth.js";
import {
    SOCKET_EVENT_MAX_AGE_MS,
    SESSION_COOKIE_NAME,
} from "./config.js";
import {registerSocketHandlers} from "../connection/socket.js";
import {createActions} from "./createActions.js";

export async function createSocket(instances) {
    const {prepareSocketAuth, authorizeSocket} = createWsSessionAuth(
        instances,
        {
            cookieName: SESSION_COOKIE_NAME,
        });

    const actions = await createActions(instances);

    registerSocketHandlers({
        ...instances,
        actions,
        maxEventAgeMs: SOCKET_EVENT_MAX_AGE_MS,
        prepareSocketAuth,
        authorizeSocket,
    });

    return {
        ...instances,
        actions
    };
}

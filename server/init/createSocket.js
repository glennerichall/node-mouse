import {createWsSessionAuth} from "../connection/ws-session-auth.js";
import {
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
        prepareSocketAuth,
        authorizeSocket,
    });

    return {
        ...instances,
        actions
    };
}

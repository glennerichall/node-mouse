import {notify} from "./notify.js";
import {
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_TARGET_ALL
} from "../createNotifierComposite.js";
import {
    PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED,
    PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED
} from "../../pubsub/serviceEventConstants.js";
import {
    NOTIFICATION_TITLE_CLIENT_CONNECTED,
    NOTIFICATION_TITLE_CLIENT_DISCONNECTED
} from "../notificationTitles.js";

export function handleSocketEvent(notifier, event) {
    const clientId = event.payload?.clientId;
    const shortClientId = String(clientId || '').slice(0, 8);

    if (event.type === PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_CLIENT_CONNECTED,
            message: `Client ${shortClientId} connecte.`,
        }, {clientId});
    } else if (event.type === PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_CLIENT_DISCONNECTED,
            message: `Client ${shortClientId} deconnecte.`,
        }, {clientId});
    }
}

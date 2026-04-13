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
    NOTIFICATION_ID_CLIENT_CONNECTED,
    NOTIFICATION_ID_CLIENT_DISCONNECTED
} from "../../../../utils/notificationSettings.js";

export function handleSocketEvent(notifier, event) {
    const clientId = event.payload?.clientId;
    const shortClientId = String(clientId || '').slice(0, 8);

    if (event.type === PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_CLIENT_CONNECTED,
            level: NOTIFIER_LEVEL_INFO,
            titleKey: 'notification.clientConnected.title',
            messageKey: 'notification.clientConnected.message',
            params: {
                clientId: shortClientId,
            },
        }, {clientId});
    } else if (event.type === PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_CLIENT_DISCONNECTED,
            level: NOTIFIER_LEVEL_INFO,
            titleKey: 'notification.clientDisconnected.title',
            messageKey: 'notification.clientDisconnected.message',
            params: {
                clientId: shortClientId,
            },
        }, {clientId});
    }
}

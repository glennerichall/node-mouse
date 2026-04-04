import {notify} from "./mapper/notify.js";
import {
    NOTIFIER_LEVEL_ERROR,
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_TARGET_CLIENT
} from "./createNotifierComposite.js";
import {
    PUBSUB_EVENT_ADMIN_CLIENT_OPENED,
    PUBSUB_EVENT_ADMIN_SERVER_OPEN_FAILED,
    PUBSUB_EVENT_ADMIN_SERVER_OPENED
} from "../pubsub/serviceEventConstants.js";
import {NOTIFICATION_TITLE_SERVER_INFO} from "./notificationTitles.js";
import { NOTIFICATION_ID_SERVER_INFO } from '../../../utils/shared/notificationSettings.js';

export function handleOpenServerInfoBrowserEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_CLIENT_OPENED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            notificationId: NOTIFICATION_ID_SERVER_INFO,
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_SERVER_INFO,
            titleKey: 'notification.serverInfo.title',
            message: 'Page server info ouverte sur le client.',
            messageKey: 'notification.serverInfo.clientOpened',
            ttlMs: 2200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_SERVER_OPEN_FAILED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            notificationId: NOTIFICATION_ID_SERVER_INFO,
            level: NOTIFIER_LEVEL_ERROR,
            title: NOTIFICATION_TITLE_SERVER_INFO,
            message: "Impossible d'ouvrir /ui/admin/server-info sur le serveur.",
            titleKey: 'notification.serverInfo.title',
            messageKey: 'notification.serverInfo.serverOpenFailed',
            ttlMs: 3200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_SERVER_OPENED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            notificationId: NOTIFICATION_ID_SERVER_INFO,
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_SERVER_INFO,
            message: 'Page server info ouverte sur le serveur.',
            titleKey: 'notification.serverInfo.title',
            messageKey: 'notification.serverInfo.serverOpened',
            ttlMs: 2200,
        }, {clientId: event.payload?.clientId});
    }
}

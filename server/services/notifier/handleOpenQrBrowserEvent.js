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
import {NOTIFICATION_TITLE_QR} from "./notificationTitles.js";
import { NOTIFICATION_ID_QR } from '../../../utils/shared/notificationSettings.js';

export function handleOpenQrBrowserEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_CLIENT_OPENED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            notificationId: NOTIFICATION_ID_QR,
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_QR,
            titleKey: 'notification.qr.title',
            message: 'Page QR ouverte sur le client.',
            messageKey: 'notification.qr.clientOpened',
            ttlMs: 2200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_SERVER_OPEN_FAILED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            notificationId: NOTIFICATION_ID_QR,
            level: NOTIFIER_LEVEL_ERROR,
            title: NOTIFICATION_TITLE_QR,
            message: "Impossible d'ouvrir le navigateur du serveur sur /qr.",
            titleKey: 'notification.qr.title',
            messageKey: 'notification.qr.serverOpenFailed',
            ttlMs: 3200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_SERVER_OPENED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            notificationId: NOTIFICATION_ID_QR,
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_QR,
            message: 'Page QR ouverte sur le serveur.',
            titleKey: 'notification.qr.title',
            messageKey: 'notification.qr.serverOpened',
            ttlMs: 2200,
        }, {clientId: event.payload?.clientId});
    }
}

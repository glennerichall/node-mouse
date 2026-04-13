import {notify} from "./notify.js";
import {
    NOTIFIER_LEVEL_ERROR,
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_ALL
} from "../createNotifierComposite.js";
import {
    PUBSUB_EVENT_ADMIN_COMPLETED,
    PUBSUB_EVENT_ADMIN_FAILED,
    PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND,
    PUBSUB_EVENT_ADMIN_STARTED
} from "../../pubsub/serviceEventConstants.js";
import { NOTIFICATION_ID_UPDATE_INSTALL } from '../../../../utils/notificationSettings.js';

export function handleInstallUpdateEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_UPDATE_INSTALL,
            level: NOTIFIER_LEVEL_ERROR,
            titleKey: 'notification.updateInstall.title',
            messageKey: 'notification.updateInstall.noCommand',
            ttlMs: 3600,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_STARTED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_UPDATE_INSTALL,
            level: NOTIFIER_LEVEL_WARNING,
            titleKey: 'notification.updateInstall.title',
            messageKey: 'notification.updateInstall.started',
            ttlMs: 2200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_COMPLETED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_UPDATE_INSTALL,
            level: NOTIFIER_LEVEL_INFO,
            titleKey: 'notification.updateInstall.title',
            messageKey: 'notification.updateInstall.completed',
            ttlMs: 3200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_FAILED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_UPDATE_INSTALL,
            level: NOTIFIER_LEVEL_ERROR,
            titleKey: 'notification.updateInstall.title',
            messageKey: 'notification.updateInstall.failed',
            params: {
                details: event.payload?.details || 'Unknown error',
            },
            ttlMs: 5000,
        }, {clientId: event.payload?.clientId});
    }
}

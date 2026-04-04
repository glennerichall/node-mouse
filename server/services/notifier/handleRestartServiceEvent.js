import {notify} from "./mapper/notify.js";
import {
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_ALL,
    NOTIFIER_TARGET_CLIENT
} from "./createNotifierComposite.js";
import {
    PUBSUB_EVENT_ADMIN_RESTART_DETECTED,
    PUBSUB_EVENT_ADMIN_STARTED
} from "../pubsub/serviceEventConstants.js";
import {
    NOTIFICATION_TITLE_SERVICE_RESTARTED,
    NOTIFICATION_TITLE_SERVICE_RESTARTING
} from "./notificationTitles.js";
import {
    NOTIFICATION_ID_SERVICE_RESTARTED,
    NOTIFICATION_ID_SERVICE_RESTARTING
} from '../../../utils/shared/notificationSettings.js';

export function handleRestartServiceEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_STARTED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            notificationId: NOTIFICATION_ID_SERVICE_RESTARTING,
            level: NOTIFIER_LEVEL_WARNING,
            title: NOTIFICATION_TITLE_SERVICE_RESTARTING,
            titleKey: 'notification.serviceRestarting.title',
            message: `Redemarrage de ${event.payload?.serviceName} en cours...`,
            messageKey: 'notification.serviceRestarting.message',
            params: {
                serviceName: event.payload?.serviceName || 'Remote Mouse',
            },
            ttlMs: 2200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_RESTART_DETECTED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_SERVICE_RESTARTED,
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_SERVICE_RESTARTED,
            message: 'Le service Remote Mouse a redemarre avec succes.',
            titleKey: 'notification.serviceRestarted.title',
            messageKey: 'notification.serviceRestarted.message',
            ttlMs: 3000,
        });
    }
}

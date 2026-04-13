import {notify} from "./mapper/notify.js";
import {
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_ALL
} from "./createNotifierComposite.js";
import {
    PUBSUB_EVENT_ADMIN_RESTART_DETECTED,
    PUBSUB_EVENT_ADMIN_STARTED
} from "../pubsub/serviceEventConstants.js";
import {
    NOTIFICATION_ID_SERVICE_RESTARTED,
    NOTIFICATION_ID_SERVICE_RESTARTING
} from '../../../utils/notificationSettings.js';

export function handleRestartServiceEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_STARTED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_SERVICE_RESTARTING,
            level: NOTIFIER_LEVEL_WARNING,
            titleKey: 'notification.serviceRestarting.title',
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
            titleKey: 'notification.serviceRestarted.title',
            messageKey: 'notification.serviceRestarted.message',
            ttlMs: 3000,
        });
    }
}

import {notify} from "./mapper/notify.js";
import {
    NOTIFIER_LEVEL_ERROR,
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_ALL,
    NOTIFIER_TARGET_CLIENT
} from "./createNotifierComposite.js";
import {
    PUBSUB_EVENT_ADMIN_REJECTED_DISABLED,
    PUBSUB_EVENT_ADMIN_ROTATED,
    PUBSUB_EVENT_ADMIN_UNCHANGED
} from "../pubsub/serviceEventConstants.js";
import { NOTIFICATION_ID_ENTRY_TOKEN } from '../../../utils/notificationSettings.js';

export function handleRotateEntryTokenEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_REJECTED_DISABLED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_ENTRY_TOKEN,
            level: NOTIFIER_LEVEL_ERROR,
            titleKey: 'notification.entryToken.title',
            messageKey: 'notification.entryToken.disabled',
            ttlMs: 2800,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_UNCHANGED) {
        notify(notifier, NOTIFIER_TARGET_ALL, {
            notificationId: NOTIFICATION_ID_ENTRY_TOKEN,
            level: NOTIFIER_LEVEL_WARNING,
            titleKey: 'notification.entryToken.title',
            messageKey: 'notification.entryToken.unchanged',
            ttlMs: 2800,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_ROTATED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            notificationId: NOTIFICATION_ID_ENTRY_TOKEN,
            level: NOTIFIER_LEVEL_INFO,
            titleKey: 'notification.entryToken.title',
            messageKey: 'notification.entryToken.rotated',
            ttlMs: 2400,
        }, {clientId: event.payload?.clientId});
    }
}

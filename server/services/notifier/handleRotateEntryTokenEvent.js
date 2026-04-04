import {notify} from "./mapper/notify.js";
import {
    NOTIFIER_LEVEL_ERROR,
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_CLIENT
} from "./createNotifierComposite.js";
import {
    PUBSUB_EVENT_ADMIN_REJECTED_DISABLED,
    PUBSUB_EVENT_ADMIN_ROTATED,
    PUBSUB_EVENT_ADMIN_UNCHANGED
} from "../pubsub/serviceEventConstants.js";
import {NOTIFICATION_TITLE_ENTRY_TOKEN} from "./notificationTitles.js";

export function handleRotateEntryTokenEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_REJECTED_DISABLED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_ERROR,
            title: NOTIFICATION_TITLE_ENTRY_TOKEN,
            message: 'Rotation impossible: entry path desactive.',
            titleKey: 'notification.entryToken.title',
            messageKey: 'notification.entryToken.disabled',
            ttlMs: 2800,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_UNCHANGED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_WARNING,
            title: NOTIFICATION_TITLE_ENTRY_TOKEN,
            message: 'Aucun changement de token (entry path fixe ou rotation indisponible).',
            titleKey: 'notification.entryToken.title',
            messageKey: 'notification.entryToken.unchanged',
            ttlMs: 2800,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_ROTATED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_ENTRY_TOKEN,
            message: 'Token d entree rotation forcee.',
            titleKey: 'notification.entryToken.title',
            messageKey: 'notification.entryToken.rotated',
            ttlMs: 2400,
        }, {clientId: event.payload?.clientId});
    }
}

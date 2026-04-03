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

export function handleRotateEntryTokenEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_REJECTED_DISABLED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_ERROR,
            title: 'Entry token',
            message: 'Rotation impossible: entry path desactive.',
            ttlMs: 2800,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_UNCHANGED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_WARNING,
            title: 'Entry token',
            message: 'Aucun changement de token (entry path fixe ou rotation indisponible).',
            ttlMs: 2800,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_ROTATED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_INFO,
            title: 'Entry token',
            message: 'Token d entree rotation forcee.',
            ttlMs: 2400,
        }, {clientId: event.payload?.clientId});
    }
}

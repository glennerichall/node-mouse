import {notify} from "./notify.js";
import {
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_ALL
} from "../createNotifierComposite.js";
import {PUBSUB_EVENT_UPDATE_AVAILABLE} from "../../pubsub/serviceEventConstants.js";
import { NOTIFICATION_ID_UPDATE_AVAILABLE } from '../../../../utils/notificationSettings.js';

export function handleUpdateManagerEvent(notifier, event) {
    if (event.type !== PUBSUB_EVENT_UPDATE_AVAILABLE) {
        return;
    }

    const result = event.payload?.lastResult || {};
    notify(notifier, NOTIFIER_TARGET_ALL, {
        notificationId: NOTIFICATION_ID_UPDATE_AVAILABLE,
        level: NOTIFIER_LEVEL_WARNING,
        title: result.title,
        titleKey: result.title ? undefined : 'notification.update.title',
        message: result.message,
        messageKey: result.message ? undefined : 'notification.update.available',
        ttlMs: result.ttlMs || 8000,
    });
}

import {notify} from "./notify.js";
import {
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_ALL
} from "../createNotifierComposite.js";
import {PUBSUB_EVENT_UPDATE_AVAILABLE} from "../../pubsub/serviceEventConstants.js";
import {NOTIFICATION_TITLE_UPDATE} from "../notificationTitles.js";
import { NOTIFICATION_ID_UPDATE_AVAILABLE } from '../../../../utils/shared/notificationSettings.js';

export function handleUpdateManagerEvent(notifier, event) {
    if (event.type !== PUBSUB_EVENT_UPDATE_AVAILABLE) {
        return;
    }

    const result = event.payload?.lastResult || {};
    notify(notifier, NOTIFIER_TARGET_ALL, {
        notificationId: NOTIFICATION_ID_UPDATE_AVAILABLE,
        level: NOTIFIER_LEVEL_WARNING,
        title: result.title || NOTIFICATION_TITLE_UPDATE,
        titleKey: result.title ? undefined : 'notification.update.title',
        message: result.message,
        ttlMs: result.ttlMs || 8000,
    });
}

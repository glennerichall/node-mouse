import {notify} from "./notify.js";
import {
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_ALL
} from "../createNotifierComposite.js";
import {PUBSUB_EVENT_ADMIN_COMPLETED} from "../../pubsub/serviceEventConstants.js";
import { NOTIFICATION_ID_FORCE_UPDATE_CHECK } from '../../../../utils/notificationSettings.js';

export function handleForceUpdateCheckEvent(notifier, event) {
    if (event.type !== PUBSUB_EVENT_ADMIN_COMPLETED) {
        return;
    }

    notify(notifier, NOTIFIER_TARGET_ALL, {
        notificationId: NOTIFICATION_ID_FORCE_UPDATE_CHECK,
        level: event.payload?.hasUpdate ? NOTIFIER_LEVEL_WARNING : NOTIFIER_LEVEL_INFO,
        titleKey: 'notification.updateCheck.title',
        messageKey: event.payload?.hasUpdate
            ? 'notification.updateCheck.available'
            : 'notification.updateCheck.none',
        ttlMs: event.payload?.hasUpdate ? 2500 : 2200,
    }, {clientId: event.payload?.clientId});
}

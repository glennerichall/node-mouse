import {notify} from "./mapper/notify.js";
import {
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_TARGET_ALL
} from "./createNotifierComposite.js";
import {PUBSUB_EVENT_ADMIN_TOGGLED} from "../pubsub/serviceEventConstants.js";
import { NOTIFICATION_ID_QR_OVERLAY } from '../../../utils/notificationSettings.js';

export function handleToggleQrOverlayEvent(notifier, event) {
    if (event.type !== PUBSUB_EVENT_ADMIN_TOGGLED) {
        return;
    }

    notify(notifier, NOTIFIER_TARGET_ALL, {
        notificationId: NOTIFICATION_ID_QR_OVERLAY,
        level: NOTIFIER_LEVEL_INFO,
        titleKey: 'notification.qrOverlay.title',
        messageKey: event.payload?.visible ? 'notification.qrOverlay.shown' : 'notification.qrOverlay.hidden',
        ttlMs: 2200,
    }, {clientId: event.payload?.clientId});
}

import {notify} from "./mapper/notify.js";
import {
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_TARGET_CLIENT
} from "./createNotifierComposite.js";
import {PUBSUB_EVENT_ADMIN_TOGGLED} from "../pubsub/serviceEventConstants.js";

export function handleToggleQrOverlayEvent(notifier, event) {
    if (event.type !== PUBSUB_EVENT_ADMIN_TOGGLED) {
        return;
    }

    notify(notifier, NOTIFIER_TARGET_CLIENT, {
        level: NOTIFIER_LEVEL_INFO,
        title: 'QR overlay',
        message: event.payload?.visible ? 'QR overlay affiche.' : 'QR overlay masque.',
        ttlMs: 2200,
    }, {clientId: event.payload?.clientId});
}

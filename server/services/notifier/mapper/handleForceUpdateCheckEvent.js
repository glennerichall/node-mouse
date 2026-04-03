import {notify} from "./notify.js";
import {
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_CLIENT
} from "../createNotifierComposite.js";
import {PUBSUB_EVENT_ADMIN_COMPLETED} from "../../pubsub/serviceEventConstants.js";

export function handleForceUpdateCheckEvent(notifier, event) {
    if (event.type !== PUBSUB_EVENT_ADMIN_COMPLETED) {
        return;
    }

    notify(notifier, NOTIFIER_TARGET_CLIENT, {
        level: event.payload?.hasUpdate ? NOTIFIER_LEVEL_WARNING : NOTIFIER_LEVEL_INFO,
        title: 'Check update',
        message: event.payload?.hasUpdate
            ? 'Mise a jour detectee.'
            : 'Aucune nouvelle mise a jour detectee.',
        ttlMs: event.payload?.hasUpdate ? 2500 : 2200,
    }, {clientId: event.payload?.clientId});
}

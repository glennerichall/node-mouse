import {notify} from "./notify.js";
import {
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_ALL
} from "../createNotifierComposite.js";
import {PUBSUB_EVENT_UPDATE_AVAILABLE} from "../../pubsub/serviceEventConstants.js";

export function handleUpdateManagerEvent(notifier, event) {
    if (event.type !== PUBSUB_EVENT_UPDATE_AVAILABLE) {
        return;
    }

    const result = event.payload?.lastResult || {};
    notify(notifier, NOTIFIER_TARGET_ALL, {
        level: NOTIFIER_LEVEL_WARNING,
        title: result.title || 'Update',
        message: result.message,
        ttlMs: result.ttlMs || 8000,
    });
}

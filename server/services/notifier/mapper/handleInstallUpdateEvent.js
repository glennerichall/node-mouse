import {notify} from "./notify.js";
import {
    NOTIFIER_LEVEL_ERROR,
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_CLIENT
} from "../createNotifierComposite.js";
import {
    PUBSUB_EVENT_ADMIN_COMPLETED,
    PUBSUB_EVENT_ADMIN_FAILED,
    PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND,
    PUBSUB_EVENT_ADMIN_STARTED
} from "../../pubsub/serviceEventConstants.js";
import {NOTIFICATION_TITLE_UPDATE_INSTALL} from "../notificationTitles.js";

export function handleInstallUpdateEvent(notifier, event) {
    if (event.type === PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_ERROR,
            title: NOTIFICATION_TITLE_UPDATE_INSTALL,
            message: 'Aucune commande update disponible (configurer UPDATE_INSTALL_COMMAND ou UPDATE_CHECK_PACKAGE).',
            ttlMs: 3600,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_STARTED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_WARNING,
            title: NOTIFICATION_TITLE_UPDATE_INSTALL,
            message: 'Installation de mise a jour demarree...',
            ttlMs: 2200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_COMPLETED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_UPDATE_INSTALL,
            message: 'Installation terminee avec succes.',
            ttlMs: 3200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_FAILED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_ERROR,
            title: NOTIFICATION_TITLE_UPDATE_INSTALL,
            message: `Echec installation: ${event.payload?.details || 'Erreur inconnue'}`,
            ttlMs: 5000,
        }, {clientId: event.payload?.clientId});
    }
}

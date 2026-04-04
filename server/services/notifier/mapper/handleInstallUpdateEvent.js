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
            titleKey: 'notification.updateInstall.title',
            message: 'Aucune commande update disponible (configurer UPDATE_INSTALL_COMMAND ou UPDATE_CHECK_PACKAGE).',
            messageKey: 'notification.updateInstall.noCommand',
            ttlMs: 3600,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_STARTED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_WARNING,
            title: NOTIFICATION_TITLE_UPDATE_INSTALL,
            titleKey: 'notification.updateInstall.title',
            message: 'Installation de mise a jour demarree...',
            messageKey: 'notification.updateInstall.started',
            ttlMs: 2200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_COMPLETED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_INFO,
            title: NOTIFICATION_TITLE_UPDATE_INSTALL,
            titleKey: 'notification.updateInstall.title',
            message: 'Installation terminee avec succes.',
            messageKey: 'notification.updateInstall.completed',
            ttlMs: 3200,
        }, {clientId: event.payload?.clientId});
    } else if (event.type === PUBSUB_EVENT_ADMIN_FAILED) {
        notify(notifier, NOTIFIER_TARGET_CLIENT, {
            level: NOTIFIER_LEVEL_ERROR,
            title: NOTIFICATION_TITLE_UPDATE_INSTALL,
            message: `Echec installation: ${event.payload?.details || 'Erreur inconnue'}`,
            titleKey: 'notification.updateInstall.title',
            messageKey: 'notification.updateInstall.failed',
            params: {
                details: event.payload?.details || 'Unknown error',
            },
            ttlMs: 5000,
        }, {clientId: event.payload?.clientId});
    }
}

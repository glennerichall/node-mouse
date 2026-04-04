import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';
import {createLogger} from '../log/logger.js';

const log = createLogger('notifier:composite');

export const NOTIFIER_TARGET_ALL = 'all';
export const NOTIFIER_TARGET_ALL_CLIENTS = 'all-clients';
export const NOTIFIER_TARGET_CLIENT = 'client';
export const NOTIFIER_TARGET_SERVER = 'server';
export const NOTIFIER_TARGET_NONE = 'none';
export const NOTIFIER_TARGETS = [
    NOTIFIER_TARGET_ALL,
    NOTIFIER_TARGET_ALL_CLIENTS,
    NOTIFIER_TARGET_CLIENT,
    NOTIFIER_TARGET_SERVER,
    NOTIFIER_TARGET_NONE,
];
export const NOTIFIER_LEVEL_INFO = 'info';
export const NOTIFIER_LEVEL_WARNING = 'warning';
export const NOTIFIER_LEVEL_ERROR = 'error';
export const NOTIFIER_LEVELS = [
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_LEVEL_ERROR,
];

export function createNotifierComposite({clientNotifier, serverNotifier, getNotificationsConfig}) {
    function getDefaultTtlMs() {
        return getNotificationsConfig?.()?.ttlMs
            ?? DEFAULT_PERSISTED_CONFIG.notifications.ttlMs;
    }

    function createTargetNotifier(selectedTarget) {
        return {
            notify({
                       title = 'Remote Mouse',
                       titleKey,
                       message,
                       messageKey,
                       params,
                       level = NOTIFIER_LEVEL_INFO,
                       ttlMs = getDefaultTtlMs(),
                   } = {}, options = {}) {
                if (!message && !messageKey) {
                    return;
                }

                const safeTtlMs = Math.max(500, Math.round(ttlMs));
                const payload = {
                    title,
                    titleKey,
                    message,
                    messageKey,
                    params,
                    level,
                    ttlMs: safeTtlMs,
                    createdAt: Date.now(),
                };

                const resolvedTarget = String(selectedTarget ?? NOTIFIER_TARGET_ALL).toLowerCase();
                const clientId = options.clientId;

                if ((resolvedTarget === NOTIFIER_TARGET_ALL ||
                    resolvedTarget === NOTIFIER_TARGET_ALL_CLIENTS ||
                    resolvedTarget === NOTIFIER_TARGET_CLIENT) && clientNotifier) {
                    clientNotifier.notify(payload, {
                        scope: resolvedTarget === NOTIFIER_TARGET_CLIENT ?
                            NOTIFIER_TARGET_CLIENT : NOTIFIER_TARGET_ALL_CLIENTS,
                        clientId,
                    });
                }

                if ((resolvedTarget === NOTIFIER_TARGET_ALL ||
                    resolvedTarget === NOTIFIER_TARGET_SERVER) && serverNotifier) {
                    serverNotifier.notify(payload);
                }

                if (!NOTIFIER_TARGETS.includes(resolvedTarget)) {
                    log.warn({target: resolvedTarget}, 'Target de notification inconnu');
                }
            },
        };
    }

    return {
        target(target = NOTIFIER_TARGET_ALL) {
            return createTargetNotifier(target);
        },
        notify(args) {
            return this.target(args.target).notify(args);
        }
    };
}

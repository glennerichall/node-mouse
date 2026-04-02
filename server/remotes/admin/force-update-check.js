import {createLogger} from '../../services/log/logger.js';
import {
    NOTIFIER_LEVEL_INFO,
    NOTIFIER_LEVEL_WARNING,
    NOTIFIER_TARGET_CLIENT
} from '../../services/notifier/createNotifierComposite.js';

const log = createLogger('admin:force-update-check');

export function createForceUpdateCheckAction(services) {
    const {
        getNotifier,
        getUpdateManager
    } = services;
    return async function forceUpdateCheck({clientId} = {}) {
        log.info('Début force update check');
        const result = await getUpdateManager().runNow();

        if (result && result.checked && result.hasUpdate) {
            log.info('Force update check: mise à jour détectée');
            getNotifier().target(NOTIFIER_TARGET_CLIENT).notify({
                level: NOTIFIER_LEVEL_WARNING,
                title: 'Check update',
                message: 'Mise a jour detectee.',
                ttlMs: 2500,
            }, {
                clientId,
            });
            return {ok: true, message: 'Mise a jour detectee.'};
        }

        log.info('Force update check: aucune mise à jour détectée');
        getNotifier().target(NOTIFIER_TARGET_CLIENT).notify({
            level: NOTIFIER_LEVEL_INFO,
            title: 'Check update',
            message: 'Aucune nouvelle mise a jour detectee.',
            ttlMs: 2200,
        }, {
            clientId,
        });
        return {ok: true, message: 'Aucune mise a jour detectee.'};
    };
}

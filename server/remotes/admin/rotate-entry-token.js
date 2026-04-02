import {createLogger} from '../../services/log/logger.js';
import {
  NOTIFIER_LEVEL_ERROR,
  NOTIFIER_LEVEL_INFO,
  NOTIFIER_LEVEL_WARNING,
  NOTIFIER_TARGET_CLIENT,
} from '../../services/notifier/createNotifierComposite.js';

const log = createLogger('admin:rotate-entry-token');

export function createRotateEntryTokenAction(servicesOrOptions) {
  const getNotifier = servicesOrOptions?.getNotifier
    ? () => servicesOrOptions.getNotifier()
    : () => servicesOrOptions.notifier;
  const getTokenManager = servicesOrOptions?.getTokenManager
    ? () => servicesOrOptions.getTokenManager()
    : () => servicesOrOptions.tokenManager;

  return async function rotateEntryToken({ clientId } = {}) {
    const notifier = getNotifier();
    const tokenManager = getTokenManager();
    const before = String(tokenManager?.getToken?.() || '');
    const after = String(tokenManager?.createToken?.() || '');

    if (!after) {
      notifier.target(NOTIFIER_TARGET_CLIENT).notify({
        level: NOTIFIER_LEVEL_ERROR,
        title: 'Entry token',
        message: 'Rotation impossible: entry path desactive.',
        ttlMs: 2800,
      }, {
        clientId,
      });
      return { ok: false, message: 'Entry path desactive.' };
    }

    if (after === before) {
      notifier.target(NOTIFIER_TARGET_CLIENT).notify({
        level: NOTIFIER_LEVEL_WARNING,
        title: 'Entry token',
        message: 'Aucun changement de token (entry path fixe ou rotation indisponible).',
        ttlMs: 2800,
      }, {
        clientId,
      });
      return { ok: false, message: 'Token non change (mode fixe ou rotation indisponible).' };
    }

    log.info('Token d entree force en rotation');
    notifier.target(NOTIFIER_TARGET_CLIENT).notify({
      level: NOTIFIER_LEVEL_INFO,
      title: 'Entry token',
      message: 'Token d entree rotation forcee.',
      ttlMs: 2400,
    }, {
      clientId,
    });
    return { ok: true, message: 'Token d entree rotation forcee.' };
  };
}

import {createLogger} from '../log/logger.js';

const log = createLogger('admin:rotate-entry-token');

export function createRotateEntryTokenAction({ notifier, tokenManager }) {
  return async function rotateEntryToken({ clientId } = {}) {
    const before = String(tokenManager?.getToken?.() || '');
    const after = String(tokenManager?.createToken?.() || '');

    if (!after) {
      notifier.notify({
        level: 'error',
        title: 'Entry token',
        message: 'Rotation impossible: entry path desactive.',
        ttlMs: 2800,
        target: 'client',
        clientId,
      });
      return { ok: false, message: 'Entry path desactive.' };
    }

    if (after === before) {
      notifier.notify({
        level: 'warning',
        title: 'Entry token',
        message: 'Aucun changement de token (entry path fixe ou rotation indisponible).',
        ttlMs: 2800,
        target: 'client',
        clientId,
      });
      return { ok: false, message: 'Token non change (mode fixe ou rotation indisponible).' };
    }

    log.info('Token d entree force en rotation');
    notifier.notify({
      level: 'info',
      title: 'Entry token',
      message: 'Token d entree rotation forcee.',
      ttlMs: 2400,
      target: 'client',
      clientId,
    });
    return { ok: true, message: 'Token d entree rotation forcee.' };
  };
}

import {getStartupConfigSnapshot} from '../init/config.js';
import {createLogger} from '../log/logger.js';

const config = getStartupConfigSnapshot();
const log = createLogger('notifier:composite');

export function createNotifierComposite({ clientNotifier, serverNotifier }) {
  function resolveTarget({ target, toDesktop, toClients }) {
    if (target) {
      return String(target).toLowerCase();
    }
    const desktop = Boolean(toDesktop);
    const clients = Boolean(toClients);
    if (desktop && clients) {
      return 'all';
    }
    if (desktop) {
      return 'server';
    }
    if (clients) {
      return 'all-clients';
    }
    return 'none';
  }

  return {
    notify({
      title = 'Remote Mouse',
      message,
      level = 'info',
      toDesktop = true,
      toClients = true,
      target,
      clientId,
      ttlMs = config.notifications.ttlMs,
    }) {
      if (!message) {
        return;
      }

      const safeTtlMs = Math.max(500, Math.round(ttlMs));
      const payload = {
        title,
        message,
        level,
        ttlMs: safeTtlMs,
        createdAt: Date.now(),
      };

      const resolvedTarget = resolveTarget({ target, toDesktop, toClients });

      if ((resolvedTarget === 'all' || resolvedTarget === 'all-clients' || resolvedTarget === 'client') && clientNotifier) {
        clientNotifier.notify(payload, {
          scope: resolvedTarget === 'client' ? 'client' : 'all-clients',
          clientId,
        });
      }

      if ((resolvedTarget === 'all' || resolvedTarget === 'server') && serverNotifier) {
        serverNotifier.notify(payload);
      }

      if (!['all', 'all-clients', 'client', 'server', 'none'].includes(resolvedTarget)) {
        log.warn({ target: resolvedTarget }, 'Target de notification inconnu');
      }
    },
  };
}

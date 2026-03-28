import {getStartupConfigSnapshot} from '../init/config.js';

const config = getStartupConfigSnapshot();

export function createNotifierComposite({ clientNotifier, serverNotifier }) {
  return {
    notify({
      title = 'Remote Mouse',
      message,
      level = 'info',
      toDesktop = true,
      toClients = true,
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

      if (toClients && clientNotifier) {
        clientNotifier.notify(payload);
      }

      if (toDesktop && serverNotifier) {
        serverNotifier.notify(payload);
      }
    },
  };
}

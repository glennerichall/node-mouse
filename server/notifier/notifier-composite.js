import { NOTIFICATION_TTL_MS } from '../config.js';

export function createNotifierComposite({ clientNotifier, serverNotifier }) {
  return {
    notify({
      title = 'Remote Mouse',
      message,
      level = 'info',
      toDesktop = true,
      toClients = true,
      ttlMs = NOTIFICATION_TTL_MS,
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

import {NOTIFIER_TARGET_ALL_CLIENTS, NOTIFIER_TARGET_CLIENT} from './createNotifierComposite.js';
import {createLogger} from '../../application/logger.js';

export function createClientNotifier(services) {
  const log = createLogger('notifier:client');
  return {
    notify(payload, options = {}) {
      const scope = String(options.scope || NOTIFIER_TARGET_ALL_CLIENTS);
      const clientId = String(options.clientId || '').trim();

      if (scope === NOTIFIER_TARGET_CLIENT) {
        if (!clientId) {
          log.warn('Notification ciblée client ignorée: clientId manquant');
          return;
        }
        services.getServer().io.to(clientId).emit('notification', payload);
        return;
      }

      services.getServer().io.emit('notification', payload);
    },
  };
}

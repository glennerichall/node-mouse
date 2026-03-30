import {getConfig} from '../init/config/index.js';
import {createLogger} from '../log/logger.js';

const log = createLogger('notifier:client');

export function createClientNotifier(io) {
  return {
    notify(payload, options = {}) {
      const config = getConfig();
      if (!config.notifications.client) {
        return;
      }
      const scope = String(options.scope || 'all-clients');
      const clientId = String(options.clientId || '').trim();

      if (scope === 'client') {
        if (!clientId) {
          log.warn('Notification ciblée client ignorée: clientId manquant');
          return;
        }
        io.to(clientId).emit('notification', payload);
        return;
      }

      io.emit('notification', payload);
    },
  };
}

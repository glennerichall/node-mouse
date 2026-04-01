import {getConfig} from '../init/config/index.js';
import {createLogger} from '../log/logger.js';
import {NOTIFIER_TARGET_ALL_CLIENTS, NOTIFIER_TARGET_CLIENT} from './notifier-composite.js';

const log = createLogger('notifier:client');

export function createClientNotifier(io, { configService } = {}) {
  return {
    notify(payload, options = {}) {
      const config = configService?.get?.() ?? getConfig();
      if (!config.notifications.client) {
        return;
      }
      const scope = String(options.scope || NOTIFIER_TARGET_ALL_CLIENTS);
      const clientId = String(options.clientId || '').trim();

      if (scope === NOTIFIER_TARGET_CLIENT) {
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

import {NOTIFIER_TARGET_ALL_CLIENTS, NOTIFIER_TARGET_CLIENT} from './createNotifierComposite.js';

export function createClientNotifier(services) {
  return {
    notify(payload, options = {}) {
      const notifications = services.getConfig().notifications;
      if (!notifications.client) {
        return;
      }
      const scope = String(options.scope || NOTIFIER_TARGET_ALL_CLIENTS);
      const clientId = String(options.clientId || '').trim();

      if (scope === NOTIFIER_TARGET_CLIENT) {
        if (!clientId) {
          services.getLogger('notifier:client').warn('Notification ciblée client ignorée: clientId manquant');
          return;
        }
        services.getServer().io.to(clientId).emit('notification', payload);
        return;
      }

      services.getServer().io.emit('notification', payload);
    },
  };
}

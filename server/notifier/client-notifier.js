import { CLIENT_NOTIFICATIONS_ENABLED } from '../config.js';

export function createClientNotifier(io) {
  return {
    notify(payload) {
      if (!CLIENT_NOTIFICATIONS_ENABLED) {
        return;
      }
      io.emit('notification', payload);
    },
  };
}

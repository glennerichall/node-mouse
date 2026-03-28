import {getStartupConfigSnapshot} from '../init/config.js';

const config = getStartupConfigSnapshot();

export function createClientNotifier(io) {
  return {
    notify(payload) {
      if (!config.notifications.client) {
        return;
      }
      io.emit('notification', payload);
    },
  };
}

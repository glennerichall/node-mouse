import { DESKTOP_NOTIFICATIONS_ENABLED } from '../init/config.js';
import { createHostNotifierByPlatform } from './host-notifier/index.js';

export function createHostNotifier() {
  const platformNotifier = createHostNotifierByPlatform();

  return {
    notify(payload) {
      if (!DESKTOP_NOTIFICATIONS_ENABLED) {
        return;
      }
      platformNotifier.notify(payload);
    },
  };
}

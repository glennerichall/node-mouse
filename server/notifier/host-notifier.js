import {getConfig} from '../init/config/index.js';
import { createHostNotifierByPlatform } from './host-notifier/index.js';

export function createHostNotifier() {
  const platformNotifier = createHostNotifierByPlatform();

  return {
    notify(payload) {
      const config = getConfig();
      if (!config.notifications.desktop) {
        return;
      }
      platformNotifier.notify(payload);
    },
  };
}

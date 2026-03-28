import {getStartupConfigSnapshot} from '../init/config.js';
import { createHostNotifierByPlatform } from './host-notifier/index.js';

const config = getStartupConfigSnapshot();

export function createHostNotifier() {
  const platformNotifier = createHostNotifierByPlatform();

  return {
    notify(payload) {
      if (!config.notifications.desktop) {
        return;
      }
      platformNotifier.notify(payload);
    },
  };
}

import { createClientNotifier } from './createClientNotifier.js';
import { createHostNotifier } from './createHostNotifier.js';
import { createNotifierComposite } from './createNotifierComposite.js';

export function createNotifier(services) {
  const clientNotifier = createClientNotifier(services);
  const serverNotifier = createHostNotifier(services);
  return createNotifierComposite({
    clientNotifier,
    serverNotifier,
    getNotificationsConfig: () => services.getConfig().notifications,
  });
}

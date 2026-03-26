import { createClientNotifier } from './client-notifier.js';
import { createHostNotifier } from './host-notifier.js';
import { createNotifierComposite } from './notifier-composite.js';

export function createNotifier(io) {
  const clientNotifier = createClientNotifier(io);
  const serverNotifier = createHostNotifier();
  return createNotifierComposite({
    clientNotifier,
    serverNotifier,
  });
}

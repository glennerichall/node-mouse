import { createClientNotifier } from './client-notifier.js';
import { createHostNotifier } from './host-notifier.js';
import { createNotifierComposite } from './notifier-composite.js';

export function createNotifier({ io, configService }) {
  const clientNotifier = createClientNotifier(io, { configService });
  const serverNotifier = createHostNotifier({ configService });
  return createNotifierComposite({
    clientNotifier,
    serverNotifier,
    configService,
  });
}

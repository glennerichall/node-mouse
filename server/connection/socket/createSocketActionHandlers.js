import {createEventSubscriptions} from './createEventSubscriptions.js';

export function createSocketActionHandlers(services) {
  const subscriptions = createEventSubscriptions(services);
  return channel => {
    for (const subscribe of Object.values(subscriptions)) {
      subscribe(channel);
    }
  };
}

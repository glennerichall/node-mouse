import {createEventSubscriptions} from './createEventSubscriptions.js';

/** Compatibility adapter for consumers still expecting an array of callbacks. */
export function createSocketActionRegistrars(services) {
  return Object.values(createEventSubscriptions(services));
}

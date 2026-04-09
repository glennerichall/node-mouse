import {PUBSUB_EVENT_STATE_CHANGED} from './serviceEventConstants.js';

export function createServiceEvents(services) {
  function publish(service, payload, options = {}) {
    return services.getPubSub().publish(service, payload, options);
  }

  function publishState(service, state, options = {}) {
    return publish(service, state, {
      type: String(options.type || PUBSUB_EVENT_STATE_CHANGED).trim() || PUBSUB_EVENT_STATE_CHANGED,
      ...options,
      snapshot: options.snapshot ?? true,
    });
  }

  function publishEvent(service, type, payload, options = {}) {
    return publish(service, payload, {
      ...options,
      type: String(type || 'event').trim() || 'event',
      snapshot: options.snapshot ?? false,
    });
  }

  return {
    publish,
    publishState,
    publishEvent,
  };
}

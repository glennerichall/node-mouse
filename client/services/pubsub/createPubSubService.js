import {createWindowEventListener, emitWindowEvent} from '../../core/window-events.js';

let nextPubSubInstanceId = 1;

function toPubSubEventName(instanceId, eventName) {
  return `client:pubsub:${instanceId}:${String(eventName || '').trim() || 'unknown'}`;
}

export function createPubSubService(services) {
  const instanceId = nextPubSubInstanceId++;

  return {
    publish(eventName, payload = {}) {
      emitWindowEvent(toPubSubEventName(instanceId, eventName), payload);
    },
    subscribe(eventName, listener) {
      return createWindowEventListener(toPubSubEventName(instanceId, eventName))(listener);
    },
  };
}

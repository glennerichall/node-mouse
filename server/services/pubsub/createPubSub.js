import {createExactMatchPredicate} from '../../../utils/predicates.js';

function normalizeServiceName(service) {
  const value = String(service || '').trim();
  return value || 'unknown';
}

function cloneEvent(event) {
  return {
    sequence: event.sequence,
    service: event.service,
    type: event.type,
    at: event.at,
    payload: event.payload,
    snapshot: event.snapshot,
  };
}

function createListenerEntry(listener, predicateOrObject) {
  if (typeof listener !== 'function') {
    return null;
  }

  let predicate = null;
  if (typeof predicateOrObject === 'function') {
    predicate = predicateOrObject;
  } else if (predicateOrObject && typeof predicateOrObject === 'object') {
    const normalizedFilters = {...predicateOrObject};
    if (normalizedFilters.service !== undefined) {
      normalizedFilters.service = normalizeServiceName(normalizedFilters.service);
    }
    predicate = Object.keys(normalizedFilters).length
      ? createExactMatchPredicate(normalizedFilters)
      : null;
  }

  return {
    notify(event) {
      if (predicate && !predicate(event)) {
        return;
      }

      listener(event);
    },
  };
}

export function createPubSub() {
  const listeners = new Set();
  let nextSequence = 1;

  function publish(service, payload, options = {}) {
    const event = {
      sequence: nextSequence++,
      service: normalizeServiceName(service),
      type: String(options.type || 'event').trim() || 'event',
      at: new Date().toISOString(),
      payload,
      snapshot: options.snapshot !== false,
    };

    for (const listener of listeners) {
      try {
        listener.notify(cloneEvent(event));
      } catch (_error) {
        // Best effort: keep the bus alive even if one subscriber fails.
      }
    }

    return cloneEvent(event);
  }

  function subscribe(listener, predicateOrObject) {
    const entry = createListenerEntry(listener, predicateOrObject);
    if (!entry) {
      return () => {};
    }

    listeners.add(entry);
    return () => {
      listeners.delete(entry);
    };
  }

  return {
    publish,
    subscribe,
  };
}

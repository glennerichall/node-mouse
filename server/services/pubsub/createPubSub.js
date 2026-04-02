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
    state: event.state,
  };
}

export function createPubSub() {
  const listeners = new Set();
  const latestByService = new Map();
  const history = [];
  let nextSequence = 1;

  function publish(service, state, options = {}) {
    const event = {
      sequence: nextSequence++,
      service: normalizeServiceName(service),
      type: String(options.type || 'state.changed').trim() || 'state.changed',
      at: new Date().toISOString(),
      state,
    };

    latestByService.set(event.service, event);
    history.push(event);
    if (history.length > 500) {
      history.splice(0, history.length - 500);
    }

    for (const listener of listeners) {
      try {
        listener(cloneEvent(event));
      } catch (_error) {
        // Best effort: keep the bus alive even if one subscriber fails.
      }
    }

    return cloneEvent(event);
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getLatestSnapshot() {
    return Array.from(latestByService.values(), (event) => cloneEvent(event));
  }

  function getHistory(limit = 100) {
    const safeLimit = Math.max(0, Math.floor(Number(limit) || 0));
    const source = safeLimit > 0 ? history.slice(-safeLimit) : history;
    return source.map((event) => cloneEvent(event));
  }

  function getServiceState(service) {
    const event = latestByService.get(normalizeServiceName(service));
    return event ? cloneEvent(event) : null;
  }

  return {
    publish,
    subscribe,
    getLatestSnapshot,
    getHistory,
    getServiceState,
  };
}

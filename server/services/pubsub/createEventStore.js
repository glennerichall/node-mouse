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

export function createEventStore(services) {
  const latestByService = new Map();
  const history = [];
  const bus = typeof services.getPubSub === 'function'
    ? services.getPubSub()
    : null;

  if (bus && typeof bus.subscribe === 'function') {
    bus.subscribe((event) => {
      if (event.snapshot) {
        latestByService.set(event.service, cloneEvent(event));
      }

      history.push(cloneEvent(event));
      if (history.length > 500) {
        history.splice(0, history.length - 500);
      }
    });
  }

  function getLatestSnapshot() {
    return Array.from(latestByService.values(), (event) => cloneEvent(event));
  }

  function getHistory(limit = 100) {
    const safeLimit = Math.max(0, Math.floor(Number(limit) || 0));
    const source = safeLimit > 0 ? history.slice(-safeLimit) : history;
    return source.map((event) => cloneEvent(event));
  }

  function getLatestEvent(service) {
    const event = latestByService.get(normalizeServiceName(service));
    return event ? cloneEvent(event) : null;
  }

  return {
    getLatestSnapshot,
    getHistory,
    getLatestEvent,
    getServiceState: getLatestEvent,
  };
}

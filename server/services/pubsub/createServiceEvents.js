export function createServiceEvents(services) {
  function getBus() {
    return typeof services.getPubSub === 'function'
      ? services.getPubSub()
      : null;
  }

  function publish(service, payload, options = {}) {
    const bus = getBus();
    if (!bus || typeof bus.publish !== 'function') {
      return null;
    }

    return bus.publish(service, payload, options);
  }

  function publishState(service, state, options = {}) {
    return publish(service, state, {
      type: String(options.type || 'state.changed').trim() || 'state.changed',
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

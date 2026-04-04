import {PUBSUB_SERVICE_CONFIG} from '../../services/pubsub/serviceEventConstants.js';

export function startConfigObserver(services) {
  if (typeof services.getPubSub !== 'function' || typeof services.getSseService !== 'function') {
    return () => {};
  }

  const bus = services.getPubSub();

  return bus.subscribe((event) => {
    const sse = services.getSseService();
    sse.emit({
      name: 'config.changed',
      service: event.service,
      type: event.type,
      payload: {
        sequence: event.sequence,
        at: event.at,
        type: event.type,
        changeType: event.payload?.changeType || '',
        changedKeys: Array.isArray(event.payload?.changedKeys) ? event.payload.changedKeys : [],
        config: services.getConfig(),
        sysConfig: services.getSystemConfig(),
      },
    });
  }, {
    service: PUBSUB_SERVICE_CONFIG,
  });
}

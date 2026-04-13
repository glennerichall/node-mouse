import {PUBSUB_SERVICE_CONFIG} from '../../services/pubsub/serviceEventConstants.js';
import {createLogger} from '../../application/logger.js';

let log;
function getModuleLog() {
  log ??= createLogger('config:observer');
  return log;
}

function getValueAtPath(source, dottedPath) {
  return String(dottedPath || '')
    .split('.')
    .filter(Boolean)
    .reduce((cursor, segment) => (cursor == null ? undefined : cursor[segment]), source);
}

export function startConfigObserver(services) {
  const log = getModuleLog();
  const bus = services.getPubSub();

  return bus.subscribe((event) => {
    const sse = services.getSseService();
    const config = services.getConfig();
    const changedKeys = Array.isArray(event.payload?.changedKeys) ? event.payload.changedKeys : [];
    log.debug({
      type: event.type,
      changeType: event.payload?.changeType || '',
      changedKeys,
    }, 'Configuration persistante changee');
    sse.emit({
      name: 'config.changed',
      service: event.service,
      type: event.type,
      payload: {
        sequence: event.sequence,
        at: event.at,
        type: event.type,
        changeType: event.payload?.changeType || '',
        changedKeys,
        entries: changedKeys.map((path) => ({
          path,
          value: getValueAtPath(config, path),
        })),
        config,
        sysConfig: services.getSystemConfig(),
      },
    });
  }, {
    service: PUBSUB_SERVICE_CONFIG,
  });
}

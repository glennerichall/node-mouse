import {
  PUBSUB_SERVICE_CLIENT_CONFIG,
  PUBSUB_SERVICE_CONFIG,
} from '../../services/pubsub/serviceEventConstants.js';
import {CLIENT_CONFIG_PATHS} from '../../services/config/configPaths.js';
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

    const clientChangedKeys = changedKeys.filter((path) => CLIENT_CONFIG_PATHS.includes(path));
    if (clientChangedKeys.length > 0) {
      sse.emit({
        name: 'config.changed',
        service: PUBSUB_SERVICE_CLIENT_CONFIG,
        type: event.type,
        payload: {
          sequence: event.sequence,
          at: event.at,
          type: event.type,
          changeType: event.payload?.changeType || '',
          changedKeys: clientChangedKeys,
          entries: clientChangedKeys.map((path) => ({
            path,
            value: path === 'preview.enabled'
              ? services.getRemotes().preview.isAvailable() && getValueAtPath(config, path) !== false
              : getValueAtPath(config, path),
          })),
        },
      });
    }
  }, {
    service: PUBSUB_SERVICE_CONFIG,
  });
}

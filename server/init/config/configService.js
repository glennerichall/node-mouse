import EventEmitter from 'node:events';

/**
 * Lightweight wrapper to share the current config snapshot and notify long-lived services
 * when persisted config changes. The loader is injected (typically getConfig) to avoid
 * hard dependencies and to keep tests easy to stub.
 */
export function createConfigService({ loadConfig }) {
  const emitter = new EventEmitter();
  let current = loadConfig();

  function get() {
    return current;
  }

  function refresh() {
    const next = loadConfig();
    current = next;
    emitter.emit('change', next);
    return next;
  }

  function onChange(listener) {
    emitter.on('change', listener);
    return () => emitter.off('change', listener);
  }

  return {
    get,
    refresh,
    onChange,
  };
}

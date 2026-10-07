/**
 * Creates the listener used by a transport adapter for one event.
 *
 * The transport owns delivery (Socket.IO `on`, WebRTC `message`, HTTP, ...).
 * This helper only owns the Express-like callback semantics exposed to a
 * subscriber: every callback receives the same payload and optional response,
 * and the next callback runs only after `next()` is called.
 *
 * @param {Function[]} callbacks Ordered subscriber callbacks or guards.
 * @param {(error: unknown) => void} onError Transport-specific error handler.
 * @returns {(payload: unknown, response?: unknown) => unknown}
 */
export function createEventCallbackChain(callbacks, onError = () => {}) {
  if (!Array.isArray(callbacks) || callbacks.length === 0
    || callbacks.some((callback) => typeof callback !== 'function')) {
    throw new TypeError('An event callback chain must contain at least one function.');
  }

  return function runEventCallbackChain(payload, response) {
    const invoke = (index) => {
      const callback = callbacks[index];
      if (!callback) return undefined;

      const next = (error) => {
        if (error) {
          onError(error);
          return undefined;
        }
        return invoke(index + 1);
      };

      return callback(payload, response, next);
    };

    return invoke(0);
  };
}

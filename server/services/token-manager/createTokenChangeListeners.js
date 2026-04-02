export function createTokenChangeListeners() {
  const listeners = new Set();

  return {
    notify(nextToken) {
      for (const listener of listeners) {
        try {
          listener(nextToken);
        } catch (_error) {
          // Best effort: keep other listeners alive.
        }
      }
    },

    subscribe(listener) {
      if (typeof listener !== 'function') {
        return () => {};
      }

      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

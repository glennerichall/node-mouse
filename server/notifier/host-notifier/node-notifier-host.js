import nodeNotifier from 'node-notifier';

export function createNodeNotifierHostNotifier() {
  function sendViaNodeNotifier({ title, message, safeTtlMs }) {
    try {
      nodeNotifier.notify({
        title,
        message,
        wait: false,
        sound: false,
        timeout: Math.max(1, Math.round(safeTtlMs / 1000)),
      });
    } catch (_error) {
      // Best effort.
    }
  }

  return {
    notify({ title, message, ttlMs }) {
      const safeTtlMs = Math.max(500, Math.round(ttlMs));
      sendViaNodeNotifier({ title, message, safeTtlMs });
    },
  };
}

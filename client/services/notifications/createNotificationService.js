import {showToast} from '../../ui/notifications/show-toast.js';

export function createNotificationService(services) {
  const {getI18n, getPubSub, getTransport} = services;
  let root = null;
  let transportBound = false;
  const queuedPayloads = [];

  function flushQueue() {
    if (!root) {
      return;
    }

    while (queuedPayloads.length > 0) {
      showToast(root, queuedPayloads.shift(), getI18n().t);
    }
  }

  function notify(payload = {}) {
    getPubSub().publish('notification.received', payload);

    if (!root) {
      queuedPayloads.push(payload);
      return;
    }

    showToast(root, payload, getI18n().t);
  }

  return {
    bindRoot(nextRoot) {
      root = nextRoot || null;
      flushQueue();
    },
    bindTransport() {
      if (transportBound) {
        return;
      }

      const transport = getTransport();
      transport.on('notification', notify);
      transportBound = true;
    },
    notify,
  };
}

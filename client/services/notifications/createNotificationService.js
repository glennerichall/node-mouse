import {REMOTE_EVENT_ADMIN_RESULT} from '../../../utils/shared/remoteCommands.js';
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

  function handleAdminResult(payload = {}) {
    getPubSub().publish('admin.result.received', payload);

    if (payload?.openUrl) {
      window.open(String(payload.openUrl), '_blank', 'noopener,noreferrer');
    }
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
      transport.on(REMOTE_EVENT_ADMIN_RESULT, handleAdminResult);
      transportBound = true;
    },
    notify,
  };
}

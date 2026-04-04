import { showToast } from './show-toast.js';
import { REMOTE_EVENT_ADMIN_RESULT } from '../../../utils/shared/remoteCommands.js';

export function bindClientNotifications(socket, root) {
  socket.on('notification', (payload = {}) => {
    showToast(root, payload);
  });

  socket.on(REMOTE_EVENT_ADMIN_RESULT, (payload = {}) => {
    if (payload?.openUrl) {
      window.open(String(payload.openUrl), '_blank', 'noopener,noreferrer');
    }
  });
}

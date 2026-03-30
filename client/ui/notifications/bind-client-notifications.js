import { showToast } from './show-toast.js';

export function bindClientNotifications(socket, root) {
  socket.on('notification', (payload = {}) => {
    showToast(root, payload);
  });

  socket.on('admin:result', (payload = {}) => {
    if (payload?.openUrl) {
      window.open(String(payload.openUrl), '_blank', 'noopener,noreferrer');
    }
  });
}

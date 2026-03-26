import { showToast } from './show-toast.js';

export function bindClientNotifications(socket, root) {
  socket.on('notification', (payload = {}) => {
    showToast(root, payload);
  });

  socket.on('admin:result', (payload = {}) => {
    console.log('Admin: result', payload);
  });
}

import { initSocketIo } from './core/init-socket-io.js';
import { initUi } from './core/init-ui.js';

function initClient() {
  const socket = initSocketIo();
  initUi(socket);
}

initClient();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

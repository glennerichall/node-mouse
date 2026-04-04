import { initSocketIo } from './core/init-socket-io.js';
import { initUi } from './core/init-ui.js';
import {applyPageTranslations, initClientHandedness, initClientI18n, initClientTheme} from './i18n/index.js';
import { initClientConfig } from './config/client-config.js';

async function initClient() {
  await initClientI18n();
  initClientTheme();
  initClientHandedness();
  applyPageTranslations(document);
  await initClientConfig();
  const socket = initSocketIo();
  initUi(socket);
}

void initClient();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

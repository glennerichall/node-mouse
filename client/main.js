import { initSocketIo } from './core/init-socket-io.js';
import { initUi } from './core/init-ui.js';
import {applyPageTranslations, initClientI18n, mountLanguageSwitcher} from './i18n/index.js';

async function initClient() {
  await initClientI18n();
  applyPageTranslations(document);
  mountLanguageSwitcher();
  const socket = initSocketIo();
  initUi(socket);
}

void initClient();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

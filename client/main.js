import { initUi } from './core/init-ui.js';
import {createServicesRegistry} from './services/createServicesRegistry.js';

async function initClient() {
  const services = createServicesRegistry();
  await services.initializeCoreServices();
  services.initializeRealtimeServices();
  services.getI18n().translateRoot(document);
  initUi(services);
}

void initClient();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

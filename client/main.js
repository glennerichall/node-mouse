import { initUi } from './core/init-ui.js';
import {createServicesRegistry} from './services/createServicesRegistry.js';
import {
  initializeCoreServices,
  initializeRealtimeServices,
} from './services/createServicesContainer.js';

async function initClient() {
  const services = createServicesRegistry();
  await initializeCoreServices(services);
  initializeRealtimeServices(services);
  initUi(services);
}

void initClient();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

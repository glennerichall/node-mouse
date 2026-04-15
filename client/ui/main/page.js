import { initUi } from './init-ui.js';
import {createServicesRegistry} from '../../services/createServicesRegistry.js';
import {
  initializeCoreServices,
  initializeRealtimeServices,
} from '../../services/createServicesContainer.js';
import {
  APP_STATE_PROPERTY_CHANGED_EVENT,
  getAppStatePropertyChangedEventName,
} from '../../services/app-state/createAppStateService.js';

function wireAppStateToPubSub(services) {
  const appState = services.getAppState();
  const pubsub = services.getPubSub();

  appState.subscribe((payload) => {
    pubsub.publish(APP_STATE_PROPERTY_CHANGED_EVENT, payload);
    pubsub.publish(getAppStatePropertyChangedEventName(payload.property), payload);
  });
}

async function initClient() {
  const services = createServicesRegistry();
  await initializeCoreServices(services);
  initializeRealtimeServices(services);
  wireAppStateToPubSub(services);
  initUi(services);
}

void initClient();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

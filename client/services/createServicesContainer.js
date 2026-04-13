import {createLazy} from '../../utils/createLazy.js';
import {ConfigView} from './config/ConfigView.js';
import {PreferenceView} from './preferences/PreferenceView.js';

export async function initializeCoreServices(container) {
  await container.getI18n().init();
  container.getPreferences().init();
  container.getPreferenceView().init();
  await container.getClientConfig().init();
  return container;
}

export function initializeRealtimeServices(container) {
  container.getTransport().connect();
  container.getNotifications().bindTransport();
  return container;
}

export function createServicesContainer({
  createI18nService,
  createPreferencesService,
  createClientConfigService,
  createTransportService,
  createBackendService,
  createRemotesService,
  createPubSubService,
  createNotificationService,
}) {
  const container = {
    getI18n: createLazy(() => createI18nService(container)),
    getPreferences: createLazy(() => createPreferencesService(container)),
    getClientConfig: createLazy(() => createClientConfigService(container)),
    getConfigView: () => new ConfigView(container.getClientConfig().getConfig()),
    getPreferenceView: createLazy(() => new PreferenceView(container.getPreferences(), container.getPubSub())),
    getTransport: createLazy(() => createTransportService(container)),
    getBackend: createLazy(() => createBackendService(container)),
    getRemotes: createLazy(() => createRemotesService(container)),
    getPubSub: createLazy(() => createPubSubService(container)),
    getNotifications: createLazy(() => createNotificationService(container)),
  };

  return container;
}

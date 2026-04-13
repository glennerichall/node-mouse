import {createLazy} from '../../utils/createLazy.js';
import {ConfigView} from './config/ConfigView.js';
import {PreferenceView} from './preferences/PreferenceView.js';

export async function initializeCoreServices(services) {
  await services.getI18n().init();
  services.getPreferences().init();
  services.getPreferenceView().init();
  await services.getClientConfig().init();
  return services;
}

export function initializeRealtimeServices(services) {
  services.getTransport().connect();
  services.getNotifications().bindTransport();
  return services;
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

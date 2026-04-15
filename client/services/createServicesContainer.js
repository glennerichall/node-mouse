import {createLazy} from '../../utils/createLazy.js';
import {ConfigView} from './config/ConfigView.js';
import {APP_STATE_LOCALE} from './app-state/createAppStateService.js';

export async function initializeCoreServices(services) {
  await services.getClientConfig().init();
  services.getAppState().init();
  await services.getI18n().init(services.getAppState().get(APP_STATE_LOCALE));
  services.getAppState().subscribeProperty(APP_STATE_LOCALE, ({value}) => {
    services.getI18n().setLocale(value).catch(() => {});
  });
  return services;
}

export function initializeRealtimeServices(services) {
  services.getTransport().connect();
  services.getNotifications().bindTransport();
  return services;
}

export function createServicesContainer({
  createI18nService,
  createClientConfigService,
  createTransportService,
  createBackendService,
  createRemotesService,
  createPubSubService,
  createNotificationService,
  createStateStoreService,
  createPersistStoreService,
  createAppStateService,
}) {
  const container = {
    getI18n: createLazy(() => createI18nService(container)),
    getClientConfig: createLazy(() => createClientConfigService(container)),
    getConfigView: () => new ConfigView(container.getClientConfig().getConfig()),
    getTransport: createLazy(() => createTransportService(container)),
    getBackend: createLazy(() => createBackendService(container)),
    getRemotes: createLazy(() => createRemotesService(container)),
    getPubSub: createLazy(() => createPubSubService(container)),
    getNotifications: createLazy(() => createNotificationService(container)),
    getStateStore: createLazy(() => createStateStoreService(container)),
    getPersistStore: createLazy(() => createPersistStoreService(container)),
    getAppState: createLazy(() => createAppStateService(container)),
  };

  return container;
}

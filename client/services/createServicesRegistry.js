import {createServicesContainer} from './createServicesContainer.js';
import {createI18nService} from './i18n/createI18nService.js';
import {createClientConfigService} from './config/createClientConfigService.js';
import {createSocketIoTransportService} from './transport/createSocketIoTransportService.js';
import {createBackendService} from './backend/createBackendService.js';
import {createRemotesService} from './remotes/createRemotesService.js';
import {createPubSubService} from './pubsub/createPubSubService.js';
import {createNotificationService} from './notifications/createNotificationService.js';
import {createAppStateService} from './app-state/createAppStateService.js';
import {createStateStoreService} from './app-state/createStateStoreService.js';
import {createPersistStoreService} from './app-state/createPersistStoreService.js';

export function createServicesRegistry() {
  return createServicesContainer({
    createI18nService,
    createClientConfigService,
    createTransportService: createSocketIoTransportService,
    createBackendService,
    createRemotesService,
    createPubSubService,
    createNotificationService,
    createStateStoreService,
    createPersistStoreService,
    createAppStateService,
  });
}

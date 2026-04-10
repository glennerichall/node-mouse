import {createServicesContainer} from './createServicesContainer.js';
import {createI18nService} from './i18n/createI18nService.js';
import {createPreferencesService} from './preferences/createPreferencesService.js';
import {createClientConfigService} from './config/createClientConfigService.js';
import {createSocketIoTransportService} from './transport/createSocketIoTransportService.js';
import {createBackendService} from './backend/createBackendService.js';
import {createRemotesService} from './remotes/createRemotesService.js';
import {createPubSubService} from './pubsub/createPubSubService.js';
import {createNotificationService} from './notifications/createNotificationService.js';

export function createServicesRegistry() {
  return createServicesContainer({
    createI18nService,
    createPreferencesService,
    createClientConfigService,
    createTransportService: createSocketIoTransportService,
    createBackendService,
    createRemotesService,
    createPubSubService,
    createNotificationService,
  });
}

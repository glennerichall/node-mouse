import {applyPageTranslations} from '../../i18n/apply-page-translations.js';
import {interpolate} from '../../i18n/core.js';
import {en} from '../../i18n/locales/en.js';
import {createServicesRegistry} from '../../services/createServicesRegistry.js';
import {initializeCoreServices} from '../../services/createServicesContainer.js';
import {createDeviceSessionsPanel} from '../config/device-sessions-panel.js';

const services = createServicesRegistry();
await initializeCoreServices(services);

function t(key, params) {
  const localized = services.getI18n().t(key, params);
  return localized === key ? interpolate(en[key] ?? key, params) : localized;
}

applyPageTranslations(document, t);

const i18n = services.getI18n();
const panel = createDeviceSessionsPanel({
  listNode: document.getElementById('device-sessions-list'),
  statusNode: document.getElementById('device-sessions-status'),
  reloadButton: document.getElementById('reload-device-sessions'),
  revokeAllButton: document.getElementById('revoke-all-device-sessions'),
  locale: i18n.getLocale(),
  t,
});

i18n.onChange(() => panel.refreshTranslations(i18n.getLocale()));
panel.load();

import {createOpenQrBrowserAction} from '../admin/createOpenQrBrowserAction.js';
import {createRotateEntryTokenAction} from '../admin/createRotateEntryTokenAction.js';
import {createToggleQrOverlayAction} from '../admin/createToggleQrOverlayAction.js';
import {
  NOTIFIER_TARGET_CLIENT,
  NOTIFIER_TARGET_SERVER,
} from '../../services/notifier/createNotifierComposite.js';
import {createBrowser} from '../browser/index.js';

export function createQrActions(services) {
  const browser = createBrowser(services.getOs());
  return {
    openQrBrowserServer: createOpenQrBrowserAction(services, {browser, target: NOTIFIER_TARGET_SERVER}),
    openQrBrowserClient: createOpenQrBrowserAction(services, {browser, target: NOTIFIER_TARGET_CLIENT}),
    rotateEntryToken: createRotateEntryTokenAction(services),
    toggleQrOverlay: createToggleQrOverlayAction(services),
  };
}

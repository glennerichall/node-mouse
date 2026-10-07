import {createControlEventSubscriber} from '../../remotes/input/subscriber.js';
import {createAdminEventSubscriber} from '../../remotes/admin/subscriber.js';
import {createPreviewEventSubscriber} from '../../remotes/preview/subscriber.js';
import {createConnectionSubscriber} from './createConnectionSubscriber.js';
import {createBrowserSubscriber} from '../../remotes/browser/subscriber.js';
import {createSamsungSubscriber} from '../../remotes/samsung/subscriber.js';
import {createVlcSubscriber} from '../../remotes/vlc/subscriber.js';
import {createWindowSubscriber} from '../../remotes/window/subscriber.js';
import {createQrEventSubscriber} from '../../remotes/qr/subscriber.js';

/**
 * Construit les souscriptions métier pour un canal client.
 * Les registrars restent dans leur domaine; cette fonction ne fait que les
 * composer au niveau de l'adaptation Socket.IO.
 */
export function createEventSubscriptions(services) {
  const {mouse, keyboard, updateConfig} = services.getInputController();
  const {browser, adminActions, qrActions, preview, samsung, vlc, windowActions} = services.getRemotes();
  updateConfig();

  return {
    subscribeInput: createControlEventSubscriber({mouse, keyboard}),
    subscribeBrowser: createBrowserSubscriber({browser, getConfig: services.getConfig}),
    subscribeQr: createQrEventSubscriber({qrActions}),
    subscribeAdmin: createAdminEventSubscriber({adminActions, legacyQrActions: qrActions}),
    subscribePreview: createPreviewEventSubscriber({preview, getConfig: services.getConfig}),
    subscribeSamsung: createSamsungSubscriber({samsung}),
    subscribeVlc: createVlcSubscriber({vlc, keyboard, getConfig: services.getConfig}),
    subscribeWindow: createWindowSubscriber({windowActions}),
    subscribeConnection: createConnectionSubscriber({events: services.getEvents()}),
  };
}

import {createControlEventSubscriber} from '../../remotes/input/subscriber.js';
import {createAdminEventSubscriber} from '../../remotes/admin/subscriber.js';
import {createPreviewEventSubscriber} from '../../remotes/preview/subscriber.js';
import {createConnectionSubscriber} from '../../connection/socket/createConnectionSubscriber.js';
import {createBrowserSubscriber} from '../../remotes/browser/subscriber.js';
import {createSamsungSubscriber} from '../../remotes/samsung/subscriber.js';
import {createVlcSubscriber} from '../../remotes/vlc/subscriber.js';
import {createWindowSubscriber} from '../../remotes/window/subscriber.js';
import {createQrEventSubscriber} from '../../remotes/qr/subscriber.js';

/**
 * Construit une fois les subscribers métier et expose leur orchestration.
 * Les subscribers peuvent ensuite être appliqués à plusieurs channels.
 */
export function createEventSubscriptions(services) {
  const {mouse, keyboard, updateConfig} = services.getInputController();
  const {browser, adminActions, qrActions, preview, samsung, vlc, windowActions} = services.getRemotes();
  updateConfig();

  const subscribers = {
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

  return {
    subscribe(channel) {
      for (const subscribe of Object.values(subscribers)) {
        subscribe(channel);
      }
    },
  };
}

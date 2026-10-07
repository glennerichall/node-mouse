import {createControlEventSubscriber} from '../../remotes/input/subscriber.js';
import {createAdminEventSubscriber} from '../../remotes/admin/subscriber.js';
import {createPreviewEventSubscriber} from '../../remotes/preview/subscriber.js';
import {createConnectionSubscriber} from '../../connection/socket/createConnectionSubscriber.js';
import {createBrowserSubscriber} from '../../remotes/browser/subscriber.js';
import {createSamsungSubscriber} from '../../remotes/samsung/subscriber.js';
import {createVlcSubscriber} from '../../remotes/vlc/subscriber.js';
import {createWindowSubscriber} from '../../remotes/window/subscriber.js';
import {createQrEventSubscriber} from '../../remotes/qr/subscriber.js';

export function createEventSubscriptionService(services) {
  const {mouse, keyboard, updateConfig} = services.getInputController();
  const {browser, adminActions, qrActions, preview, samsung, vlc, windowActions} = services.getRemotes();
  updateConfig();

  const subscribers = [
    createControlEventSubscriber({mouse, keyboard}),
    createBrowserSubscriber({browser, getConfig: services.getConfig}),
    createQrEventSubscriber({qrActions}),
    createAdminEventSubscriber({adminActions, legacyQrActions: qrActions}),
    createPreviewEventSubscriber({preview, getConfig: services.getConfig}),
    createSamsungSubscriber({samsung}),
    createVlcSubscriber({vlc, keyboard, getConfig: services.getConfig}),
    createWindowSubscriber({windowActions}),
    createConnectionSubscriber({events: services.getEvents()}),
  ];

  return {
    subscribe(channel) {
      subscribers.forEach(subscriber => subscriber(channel));
    },
  };
}

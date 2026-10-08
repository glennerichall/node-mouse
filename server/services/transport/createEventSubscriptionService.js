import {createControlEventSubscriber} from '../../connection/subscribers/input.subscriber.js';
import {createAdminEventSubscriber} from '../../connection/subscribers/admin.subscriber.js';
import {createPreviewEventSubscriber} from '../../connection/subscribers/preview.subscriber.js';
import {createConnectionSubscriber} from '../../connection/subscribers/connection.subscriber.js';
import {createBrowserSubscriber} from '../../connection/subscribers/browser.subscriber.js';
import {createSamsungSubscriber} from '../../connection/subscribers/samsung.subscriber.js';
import {createVlcSubscriber} from '../../connection/subscribers/vlc.subscriber.js';
import {createWindowSubscriber} from '../../connection/subscribers/window.subscriber.js';
import {createQrEventSubscriber} from '../../connection/subscribers/qr.subscriber.js';
import {assertEventChannel} from './event-channel.js';

export function createEventSubscriptionService(services) {
  const {mouse, keyboard, updateConfig} = services.getInputController();
  const {browser, adminActions, qrActions, preview, samsung, vlc, windowActions} = services.getRemotes();
  updateConfig();

  const subscribers = [
    createControlEventSubscriber({mouse, keyboard}),
    createBrowserSubscriber({browser, getConfig: services.getConfig}),
    createQrEventSubscriber({qrActions}),
    createAdminEventSubscriber({
      adminActions,
      qrActions,
      getSystemConfig: services.getSystemConfig,
      getAuthorization: services.getAuthorization,
    }),
    createPreviewEventSubscriber({preview, getConfig: services.getConfig}),
    createSamsungSubscriber({samsung}),
    createVlcSubscriber({vlc, keyboard, getConfig: services.getConfig}),
    createWindowSubscriber({windowActions}),
    createConnectionSubscriber({events: services.getEvents()}),
  ];

    return {
      subscribe(channel) {
        assertEventChannel(channel);
        subscribers.forEach(subscriber => subscriber(channel));
      },
  };
}

import {handleSocketEvent} from "./mapper/handleSocketEvent.js";
import {handleUpdateManagerEvent} from "./mapper/handleUpdateManagerEvent.js";
import {handleForceUpdateCheckEvent} from "./mapper/handleForceUpdateCheckEvent.js";
import {handleInstallUpdateEvent} from "./mapper/handleInstallUpdateEvent.js";
import {handleOpenQrBrowserEvent} from "./handleOpenQrBrowserEvent.js";
import {handleOpenServerInfoBrowserEvent} from "./handleOpenServerInfoBrowserEvent.js";
import {handleRestartServiceEvent} from "./handleRestartServiceEvent.js";
import {handleToggleQrOverlayEvent} from "./handleToggleQrOverlayEvent.js";
import {handleRotateEntryTokenEvent} from "./handleRotateEntryTokenEvent.js";
import {
  PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK,
  PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE,
  PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER,
  PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER,
  PUBSUB_SERVICE_ADMIN_RESTART_SERVICE,
  PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN,
  PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY,
  PUBSUB_SERVICE_SOCKET,
  PUBSUB_SERVICE_UPDATE_MANAGER,
} from "../pubsub/serviceEventConstants.js";

export function startNotificationObserver(services) {
  if (typeof services.getPubSub !== 'function' || typeof services.getNotifier !== 'function') {
    return () => {};
  }

  const bus = services.getPubSub();
  const notifier = services.getNotifier();

  return bus.subscribe((event) => {
    if (event.service === PUBSUB_SERVICE_SOCKET) {
      handleSocketEvent(notifier, event);
    } else if (event.service === PUBSUB_SERVICE_UPDATE_MANAGER) {
      handleUpdateManagerEvent(notifier, event);
    } else if (event.service === PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK) {
      handleForceUpdateCheckEvent(notifier, event);
    } else if (event.service === PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE) {
      handleInstallUpdateEvent(notifier, event);
    } else if (event.service === PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER) {
      handleOpenQrBrowserEvent(notifier, event);
    } else if (event.service === PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER) {
      handleOpenServerInfoBrowserEvent(notifier, event);
    } else if (event.service === PUBSUB_SERVICE_ADMIN_RESTART_SERVICE) {
      handleRestartServiceEvent(notifier, event);
    } else if (event.service === PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY) {
      handleToggleQrOverlayEvent(notifier, event);
    } else if (event.service === PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN) {
      handleRotateEntryTokenEvent(notifier, event);
    }
  }, (event) => Boolean(event?.service && event?.type));
}

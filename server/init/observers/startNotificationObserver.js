import {handleSocketEvent} from "../../services/notifier/mapper/handleSocketEvent.js";
import {handleUpdateManagerEvent} from "../../services/notifier/mapper/handleUpdateManagerEvent.js";
import {handleForceUpdateCheckEvent} from "../../services/notifier/mapper/handleForceUpdateCheckEvent.js";
import {handleInstallUpdateEvent} from "../../services/notifier/mapper/handleInstallUpdateEvent.js";
import {handleOpenQrBrowserEvent} from "../../services/notifier/handleOpenQrBrowserEvent.js";
import {handleOpenServerInfoBrowserEvent} from "../../services/notifier/handleOpenServerInfoBrowserEvent.js";
import {handleRestartServiceEvent} from "../../services/notifier/handleRestartServiceEvent.js";
import {handleToggleQrOverlayEvent} from "../../services/notifier/handleToggleQrOverlayEvent.js";
import {handleRotateEntryTokenEvent} from "../../services/notifier/handleRotateEntryTokenEvent.js";
import {handleSessionEvent} from "../../services/notifier/handleSessionEvent.js";
import {
  PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK,
  PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE,
  PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER,
  PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER,
  PUBSUB_SERVICE_ADMIN_RESTART_SERVICE,
  PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN,
  PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY,
  PUBSUB_SERVICE_SESSION,
  PUBSUB_SERVICE_SOCKET,
  PUBSUB_SERVICE_UPDATE_MANAGER,
} from "../../services/pubsub/serviceEventConstants.js";

const NOTIFICATION_HANDLERS = {
  [PUBSUB_SERVICE_SOCKET]: handleSocketEvent,
  [PUBSUB_SERVICE_UPDATE_MANAGER]: handleUpdateManagerEvent,
  [PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK]: handleForceUpdateCheckEvent,
  [PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE]: handleInstallUpdateEvent,
  [PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER]: handleOpenQrBrowserEvent,
  [PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER]: handleOpenServerInfoBrowserEvent,
  [PUBSUB_SERVICE_ADMIN_RESTART_SERVICE]: handleRestartServiceEvent,
  [PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY]: handleToggleQrOverlayEvent,
  [PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN]: handleRotateEntryTokenEvent,
  [PUBSUB_SERVICE_SESSION]: handleSessionEvent,
};

export function startNotificationObserver(services) {
  const bus = services.getPubSub();
  const notifier = services.getNotifier();

  return bus.subscribe((event) => {
    const handleEvent = NOTIFICATION_HANDLERS[event.service];
    if (!handleEvent) {
      return;
    }

    handleEvent(notifier, event);
  }, (event) => Boolean(event?.service && event?.type));
}

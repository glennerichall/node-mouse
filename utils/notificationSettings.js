export const NOTIFICATION_TARGET_CLIENT = 'client';
export const NOTIFICATION_TARGET_HOST = 'host';

export const NOTIFICATION_ID_CLIENT_CONNECTED = 'clientConnected';
export const NOTIFICATION_ID_CLIENT_DISCONNECTED = 'clientDisconnected';
export const NOTIFICATION_ID_SESSION_CREATED = 'sessionCreated';
export const NOTIFICATION_ID_UPDATE_AVAILABLE = 'updateAvailable';
export const NOTIFICATION_ID_FORCE_UPDATE_CHECK = 'forceUpdateCheck';
export const NOTIFICATION_ID_UPDATE_INSTALL = 'updateInstall';
export const NOTIFICATION_ID_QR = 'qr';
export const NOTIFICATION_ID_SERVER_INFO = 'serverInfo';
export const NOTIFICATION_ID_SERVICE_RESTARTING = 'serviceRestarting';
export const NOTIFICATION_ID_SERVICE_RESTARTED = 'serviceRestarted';
export const NOTIFICATION_ID_QR_OVERLAY = 'qrOverlay';
export const NOTIFICATION_ID_ENTRY_TOKEN = 'entryToken';

export const NOTIFICATION_EVENT_DEFINITIONS = [
  { id: NOTIFICATION_ID_CLIENT_CONNECTED, labelKey: 'adminConfig.notification.clientConnected' },
  { id: NOTIFICATION_ID_CLIENT_DISCONNECTED, labelKey: 'adminConfig.notification.clientDisconnected' },
  { id: NOTIFICATION_ID_SESSION_CREATED, labelKey: 'adminConfig.notification.sessionCreated' },
  { id: NOTIFICATION_ID_UPDATE_AVAILABLE, labelKey: 'adminConfig.notification.updateAvailable' },
  { id: NOTIFICATION_ID_FORCE_UPDATE_CHECK, labelKey: 'adminConfig.notification.forceUpdateCheck' },
  { id: NOTIFICATION_ID_UPDATE_INSTALL, labelKey: 'adminConfig.notification.updateInstall' },
  { id: NOTIFICATION_ID_QR, labelKey: 'adminConfig.notification.qr' },
  { id: NOTIFICATION_ID_SERVER_INFO, labelKey: 'adminConfig.notification.serverInfo' },
  { id: NOTIFICATION_ID_SERVICE_RESTARTING, labelKey: 'adminConfig.notification.serviceRestarting' },
  { id: NOTIFICATION_ID_SERVICE_RESTARTED, labelKey: 'adminConfig.notification.serviceRestarted' },
  { id: NOTIFICATION_ID_QR_OVERLAY, labelKey: 'adminConfig.notification.qrOverlay' },
  { id: NOTIFICATION_ID_ENTRY_TOKEN, labelKey: 'adminConfig.notification.entryToken' },
];

export function getNotificationTargetPath(notificationId, target) {
  return `notifications.${notificationId}.${target}`;
}

export function getNotificationPaths() {
  return NOTIFICATION_EVENT_DEFINITIONS.flatMap(({ id }) => [
    getNotificationTargetPath(id, NOTIFICATION_TARGET_HOST),
    getNotificationTargetPath(id, NOTIFICATION_TARGET_CLIENT),
  ]);
}

export function createDefaultNotificationSettings(defaultValue = true) {
  return Object.fromEntries(
    NOTIFICATION_EVENT_DEFINITIONS.map(({ id }) => [
      id,
      {
        [NOTIFICATION_TARGET_HOST]: defaultValue,
        [NOTIFICATION_TARGET_CLIENT]: defaultValue,
      },
    ]),
  );
}

export function isNotificationTargetEnabled(notificationsConfig, notificationId, target) {
  if (!notificationId || !target) {
    return true;
  }

  return Boolean(notificationsConfig?.[notificationId]?.[target]);
}

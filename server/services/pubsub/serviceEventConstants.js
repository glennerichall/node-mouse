export const PUBSUB_SERVICE_SOCKET = 'socket';
export const PUBSUB_SERVICE_TASK_MANAGER = 'task-manager';
export const PUBSUB_SERVICE_TOKEN_MANAGER = 'token-manager';
export const PUBSUB_SERVICE_UPDATE_MANAGER = 'update-manager';
export const PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK = 'admin:force-update-check';
export const PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE = 'admin:install-update';
export const PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER = 'admin:open-qr-browser';
export const PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER = 'admin:open-server-info-browser';
export const PUBSUB_SERVICE_ADMIN_RESTART_SERVICE = 'admin:restart-service';
export const PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY = 'admin:toggle-qr-overlay';
export const PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN = 'admin:rotate-entry-token';

export const PUBSUB_EVENT_STATE_CHANGED = 'state.changed';

export const PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED = 'client.connected';
export const PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED = 'client.disconnected';

export const PUBSUB_EVENT_UPDATE_CHECK = 'update.check';
export const PUBSUB_EVENT_UPDATE_AVAILABLE = 'update.available';
export const PUBSUB_EVENT_UPDATE_ERROR = 'update.error';
export const PUBSUB_EVENT_TOKEN_CHANGED = 'token.changed';

export const PUBSUB_EVENT_ADMIN_COMPLETED = 'completed';
export const PUBSUB_EVENT_ADMIN_STARTED = 'started';
export const PUBSUB_EVENT_ADMIN_FAILED = 'failed';
export const PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND = 'rejected.no-command';
export const PUBSUB_EVENT_ADMIN_REJECTED_DISABLED = 'rejected.disabled';
export const PUBSUB_EVENT_ADMIN_UNCHANGED = 'unchanged';
export const PUBSUB_EVENT_ADMIN_ROTATED = 'rotated';
export const PUBSUB_EVENT_ADMIN_TOGGLED = 'toggled';
export const PUBSUB_EVENT_ADMIN_CLIENT_OPENED = 'client.opened';
export const PUBSUB_EVENT_ADMIN_SERVER_OPEN_FAILED = 'server.open.failed';
export const PUBSUB_EVENT_ADMIN_SERVER_OPENED = 'server.opened';
export const PUBSUB_EVENT_ADMIN_RESTART_DETECTED = 'restart.detected';

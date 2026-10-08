import {CLIENT_CONFIG_PATHS} from '../../../services/config/configPaths.js';
import {PUBSUB_SERVICE_CLIENT_CONFIG} from '../../../services/pubsub/serviceEventConstants.js';
import {getManagedConfigSnapshot} from '../configs.js';
import {isAdminPasswordConfigured} from '../../../services/security/adminPasswordPolicy.js';

const DEFAULT_SOCKET_TRANSPORT_CONFIG = {
  reconnectAttempts: 10,
  reconnectDelayMs: 250,
  reconnectDelayMaxMs: 2000,
  pingIntervalMs: 25000,
  pingTimeoutMs: 20000,
};

function getSocketTransportConfig(systemConfig = {}) {
  const session = systemConfig.session || {};
  return {
    reconnectAttempts: session.socketReconnectAttempts ?? DEFAULT_SOCKET_TRANSPORT_CONFIG.reconnectAttempts,
    reconnectDelayMs: session.socketReconnectDelayMs ?? DEFAULT_SOCKET_TRANSPORT_CONFIG.reconnectDelayMs,
    reconnectDelayMaxMs: session.socketReconnectDelayMaxMs ?? DEFAULT_SOCKET_TRANSPORT_CONFIG.reconnectDelayMaxMs,
    pingIntervalMs: session.socketPingIntervalMs ?? DEFAULT_SOCKET_TRANSPORT_CONFIG.pingIntervalMs,
    pingTimeoutMs: session.socketPingTimeoutMs ?? DEFAULT_SOCKET_TRANSPORT_CONFIG.pingTimeoutMs,
  };
}

export async function getClientConfig(req, res) {
  const config = getManagedConfigSnapshot(req.services.getConfig(), CLIENT_CONFIG_PATHS);
  const vlcAvailable = await req.services.getRemotes().vlc.isAvailable();
  const previewAvailable = req.services.getRemotes().preview.isAvailable();
  const systemConfig = req.services.getSystemConfig();
  config.vlc.enabled = vlcAvailable && config.vlc.enabled !== false;
  config.preview.enabled = previewAvailable && config.preview.enabled !== false;

  res.json({
    config,
    systemConfig: {
      adminActionsConfigured: Boolean(req.services.getSystemConfig().adminActionsEnabled),
      adminActionsEnabled: req.securityContext?.role === 'admin'
        && Boolean(req.services.getSystemConfig().adminActionsEnabled),
      adminUnlocked: req.securityContext?.role === 'admin',
      adminRelockAvailable: req.securityContext?.role === 'admin'
        && req.securityContext?.authenticationMethod === 'session',
      adminUnlockAvailable: isAdminPasswordConfigured(systemConfig.admin),
      transport: {
        socket: getSocketTransportConfig(systemConfig),
      },
    },
  });
}

export function createClientConfigSubscription(req, res) {
  const id = req.services.getSseService().createSubscription({
    filters: {service: PUBSUB_SERVICE_CLIENT_CONFIG},
  });
  res.json({ok: true, id, eventsUrl: `/api/client/subs/${id}`});
}

export function connectClientSubscription(req, res) {
  const connected = req.services.getSseService().connect(String(req.params.id || '').trim(), req, res);
  if (!connected) res.status(404).json({ok: false, message: 'Subscription not found.'});
}

export function deleteClientSubscription(req, res) {
  const removed = req.services.getSseService().deleteSubscription(String(req.params.id || '').trim());
  if (!removed) {
    res.status(404).json({ok: false, message: 'Subscription not found.'});
    return;
  }
  res.json({ok: true});
}

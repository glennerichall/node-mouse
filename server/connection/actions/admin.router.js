import {createLogger} from '../../application/logger.js';
import {createAdminEventGuard} from './admin.guard.js';
import {
    getClientId,
    getClientLabel
} from '../client-channel.js';
import Router from 'router';
import {
    REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT,
    REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER,
    REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT,
    REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER,
    REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN,
    REMOTE_EVENT_ADMIN_SERVICE_RESTART,
    REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY,
    REMOTE_EVENT_ADMIN_UPDATE_CHECK,
    REMOTE_EVENT_ADMIN_UPDATE_INSTALL,
} from '../../../utils/remoteCommands.js';

let log;

function getModuleLog() {
    log ??= createLogger('events:admin');
    return log;
}

const eventLog = getModuleLog();
const adminGuard = createAdminEventGuard({
    getSystemConfig: (request) => request.services.getSystemConfig(),
    getAuthorization: (request) => request.services.getAuthorization(),
    log: eventLog,
});
const handleAdminAction = (eventName, action) => async (request, response, next) => {
    const client = getClientLabel(request.socket);
    eventLog.info({client}, `Demande ${eventName}`);
    const remotes = request.services.getRemotes();
    const result = await action({
        adminActions: remotes.adminActions,
        qrActions: remotes.qrActions,
        clientId: getClientId(request.socket),
    });
    response.response?.({ok: Boolean(result.ok), message: result.message});
    next();
};

export const adminRouter = Router()
  .post(`/${REMOTE_EVENT_ADMIN_UPDATE_CHECK}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_UPDATE_CHECK, ({adminActions, clientId}) => adminActions.forceUpdateCheck({clientId})))
  .post(`/${REMOTE_EVENT_ADMIN_UPDATE_INSTALL}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_UPDATE_INSTALL, ({adminActions, clientId}) => adminActions.installUpdate({clientId})))
  .post(`/${REMOTE_EVENT_ADMIN_SERVICE_RESTART}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_SERVICE_RESTART, ({adminActions, clientId}) => adminActions.restartService({clientId})))
  .post(`/${REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER, ({qrActions, clientId}) => qrActions.openQrBrowserServer({clientId})))
  .post(`/${REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT, ({qrActions, clientId}) => qrActions.openQrBrowserClient({clientId})))
  .post(`/${REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER, ({adminActions, clientId}) => adminActions.openServerInfoBrowserServer({clientId})))
  .post(`/${REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT, ({adminActions, clientId}) => adminActions.openServerInfoBrowserClient({clientId})))
  .post(`/${REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN, ({qrActions, clientId}) => qrActions.rotateEntryToken({clientId})))
  .post(`/${REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY}`, adminGuard, handleAdminAction(REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY, ({qrActions, clientId}) => qrActions.toggleQrOverlay({clientId})));

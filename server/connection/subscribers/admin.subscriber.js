import {createLogger} from '../../application/logger.js';
import {createAdminEventGuard} from './admin.guard.js';
import {
    getClientId,
    getClientLabel
} from '../client-channel.js';
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

export function createAdminEventSubscriber({
                                               adminActions,
                                               qrActions,
                                               getSystemConfig = () => ({adminActionsEnabled: true}),
                                               getAuthorization = () => ({authorize: () => ({allowed: true})}),
                                           }) {
    const log = getModuleLog();

    return function subscribeAdmin(channel) {
        const clientId = getClientId(channel);
        const client = getClientLabel(channel);

        const authorization = getAuthorization().authorize(channel.securityContext, 'admin:manage');

        const guard = () => createAdminEventGuard({
            isAdminActionsEnabled: getSystemConfig().adminActionsEnabled,
            isAdmin: authorization.allowed,
            client,
            log,
        });

        channel
            .on(REMOTE_EVENT_ADMIN_UPDATE_CHECK,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_UPDATE_CHECK}`);
                    const result = await adminActions.forceUpdateCheck({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                })

            .on(REMOTE_EVENT_ADMIN_UPDATE_INSTALL,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_UPDATE_INSTALL}`);
                    const result = await adminActions.installUpdate({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                })

            .on(REMOTE_EVENT_ADMIN_SERVICE_RESTART,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_SERVICE_RESTART}`);
                    const result = await adminActions.restartService({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                })

            .on(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER}`);
                    const result = await qrActions.openQrBrowserServer({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                })

            .on(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT}`);
                    const result = await qrActions.openQrBrowserClient({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                })

            .on(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER}`);
                    const result = await adminActions.openServerInfoBrowserServer({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                })

            .on(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT}`);
                    const result = await adminActions.openServerInfoBrowserClient({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                })

            .on(REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN}`);
                    const result = await qrActions.rotateEntryToken({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                })

            .on(REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY,
                guard(),
                async (_payload, response) => {
                    log.info({client}, `Demande ${REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY}`);
                    const result = await qrActions.toggleQrOverlay({clientId});
                    response?.({
                        ok: Boolean(result.ok),
                        message: result.message,
                    });
                });
    };
}

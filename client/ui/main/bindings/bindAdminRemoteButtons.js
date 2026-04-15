import {emitWithTimestamp} from '../../../core/socket-emit.js';
import {
    REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT,
    REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER,
    REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT,
    REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER,
    REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN,
    REMOTE_EVENT_ADMIN_SERVICE_RESTART,
    REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY,
    REMOTE_EVENT_ADMIN_UPDATE_CHECK,
    REMOTE_EVENT_ADMIN_UPDATE_INSTALL
} from '../../../../utils/remoteCommands.js';

export function bindAdminRemoteButtons(services, dom) {
    const socket = services.getTransport();
    const clientConfig = services.getClientConfig();
    const getConfigView = services.getConfigView;
    const {
        btnForceUpdateCheck,
        btnInstallUpdate,
        btnRestartService,
        btnOpenQrBrowserServer,
        btnOpenQrBrowserClient,
        btnToggleQrOverlay,
        btnOpenServerInfoBrowserServer,
        btnOpenServerInfoBrowserClient,
        btnOpenConfigPage,
        btnOpenPreferencesPage,
        btnRotateEntryToken,
        adminActionsDisabledMessage,
    } = dom.remotes.admin;
    const adminButtons = [
        btnForceUpdateCheck,
        btnInstallUpdate,
        btnRestartService,
        btnOpenQrBrowserServer,
        btnOpenQrBrowserClient,
        btnToggleQrOverlay,
        btnOpenServerInfoBrowserServer,
        btnOpenServerInfoBrowserClient,
        btnOpenConfigPage,
        btnRotateEntryToken,
    ];
    const emit = (eventName) => () => emitWithTimestamp(socket, eventName);

    const syncAdminButtonsState = () => {
        const {adminActionsEnabled = true} = getConfigView().getSystemConfig();
        for (const button of adminButtons) {
            if (!button) {
                continue;
            }
            button.disabled = !adminActionsEnabled;
            button.setAttribute('aria-disabled', adminActionsEnabled ? 'false' : 'true');
        }

        adminActionsDisabledMessage?.classList.toggle('hidden', adminActionsEnabled);
    };

    btnForceUpdateCheck.addEventListener('click', emit(REMOTE_EVENT_ADMIN_UPDATE_CHECK));
    btnInstallUpdate.addEventListener('click', emit(REMOTE_EVENT_ADMIN_UPDATE_INSTALL));
    btnRestartService.addEventListener('click', emit(REMOTE_EVENT_ADMIN_SERVICE_RESTART));
    btnOpenQrBrowserServer.addEventListener('click', emit(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER));
    btnOpenQrBrowserClient.addEventListener('click', emit(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT));
    btnToggleQrOverlay.addEventListener('click', emit(REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY));
    btnOpenServerInfoBrowserServer.addEventListener('click', emit(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER));
    btnOpenServerInfoBrowserClient.addEventListener('click', emit(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT));
    btnOpenConfigPage.addEventListener('click', () => {
        window.location.href = '/ui/admin/config';
    });
    btnOpenPreferencesPage?.addEventListener('click', () => {
        window.location.href = '/ui/admin/preferences';
    });
    btnRotateEntryToken.addEventListener('click', emit(REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN));

    syncAdminButtonsState();
    clientConfig.onChange(syncAdminButtonsState);
}

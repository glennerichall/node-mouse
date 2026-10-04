import {emitWithTimestamp} from '../../../core/socket-emit.js';
import {
    REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT,
    REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER,
    REMOTE_EVENT_ADMIN_SERVICE_RESTART,
    REMOTE_EVENT_ADMIN_UPDATE_CHECK,
    REMOTE_EVENT_ADMIN_UPDATE_INSTALL,
    REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT,
    REMOTE_EVENT_QR_OPEN_BROWSER_SERVER,
    REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN,
    REMOTE_EVENT_QR_TOGGLE_OVERLAY,
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
        adminUnlockForm,
        adminPassword,
        btnAdminPasswordVisibility,
        btnAdminUnlock,
        adminUnlockStatus,
    } = dom.remotes.admin;
    const i18n = services.getI18n();
    const adminButtons = [
        btnForceUpdateCheck,
        btnInstallUpdate,
        btnRestartService,
        btnOpenServerInfoBrowserServer,
        btnOpenServerInfoBrowserClient,
        btnOpenConfigPage,
    ];
    let relockAvailable = false;
    const emit = (eventName) => () => emitWithTimestamp(socket, eventName);

    const syncAdminButtonsState = () => {
        const {
            adminActionsConfigured = true,
            adminActionsEnabled = true,
            adminUnlocked = false,
            adminRelockAvailable = false,
            adminUnlockAvailable = false,
        } = getConfigView().getSystemConfig();
        for (const button of adminButtons) {
            if (!button) {
                continue;
            }
            button.disabled = !adminActionsEnabled;
            button.setAttribute('aria-disabled', adminActionsEnabled ? 'false' : 'true');
            button.classList.toggle('admin-elevation-active', adminUnlocked);
        }

        if (adminActionsDisabledMessage) {
            const messageKey = adminActionsConfigured
                ? 'main.adminActionsLockedMessage'
                : 'main.adminActionsDisabledMessage';
            adminActionsDisabledMessage.textContent = i18n.t(messageKey);
            adminActionsDisabledMessage.classList.toggle('hidden', adminActionsConfigured && adminUnlocked);
        }
        relockAvailable = adminRelockAvailable;
        adminUnlockForm?.classList.toggle('hidden', !adminUnlockAvailable && !adminRelockAvailable);
        adminPassword?.parentElement?.classList.toggle('hidden', adminUnlocked);
        if (btnAdminUnlock) {
            btnAdminUnlock.textContent = i18n.t(adminRelockAvailable ? 'main.adminLock' : 'main.adminUnlock');
        }
    };

    const syncPasswordVisibility = (visible) => {
        if (!adminPassword || !btnAdminPasswordVisibility) return;
        const key = visible ? 'main.adminPasswordHide' : 'main.adminPasswordShow';
        const label = i18n.t(key);
        adminPassword.type = visible ? 'text' : 'password';
        btnAdminPasswordVisibility.setAttribute('aria-label', label);
        btnAdminPasswordVisibility.setAttribute('aria-pressed', visible ? 'true' : 'false');
    };

    btnAdminPasswordVisibility?.addEventListener('click', () => {
        syncPasswordVisibility(adminPassword?.type === 'password');
    });

    i18n.onChange?.(() => {
        syncPasswordVisibility(adminPassword?.type === 'text');
        syncAdminButtonsState();
    });

    adminUnlockForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (relockAvailable) {
            if (adminUnlockStatus) adminUnlockStatus.textContent = i18n.t('main.adminLocking');
            try {
                const response = await fetch('/api/admin-auth/elevation', {method: 'DELETE'});
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.message || i18n.t('main.adminLockRefused'));
                if (adminPassword) adminPassword.value = '';
                syncPasswordVisibility(false);
                window.location.reload();
            } catch (error) {
                if (adminUnlockStatus) adminUnlockStatus.textContent = error.message;
            }
            return;
        }
        const password = adminPassword?.value || '';
        if (adminUnlockStatus) adminUnlockStatus.textContent = 'Déverrouillage…';
        try {
            const response = await fetch('/api/admin-auth/elevation', {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({password}),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.message || 'Déverrouillage refusé.');
            if (adminPassword) adminPassword.value = '';
            window.location.reload();
        } catch (error) {
            if (adminPassword) adminPassword.value = '';
            if (adminUnlockStatus) adminUnlockStatus.textContent = error.message;
        }
    });

    btnForceUpdateCheck.addEventListener('click', emit(REMOTE_EVENT_ADMIN_UPDATE_CHECK));
    btnInstallUpdate.addEventListener('click', emit(REMOTE_EVENT_ADMIN_UPDATE_INSTALL));
    btnRestartService.addEventListener('click', emit(REMOTE_EVENT_ADMIN_SERVICE_RESTART));
    btnOpenQrBrowserServer.addEventListener('click', emit(REMOTE_EVENT_QR_OPEN_BROWSER_SERVER));
    btnOpenQrBrowserClient.addEventListener('click', emit(REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT));
    btnToggleQrOverlay.addEventListener('click', emit(REMOTE_EVENT_QR_TOGGLE_OVERLAY));
    btnOpenServerInfoBrowserServer.addEventListener('click', emit(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER));
    btnOpenServerInfoBrowserClient.addEventListener('click', emit(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT));
    btnOpenConfigPage.addEventListener('click', () => {
        window.location.href = '/ui/admin/config';
    });
    btnOpenPreferencesPage?.addEventListener('click', () => {
        window.location.href = '/ui/admin/preferences';
    });
    btnRotateEntryToken.addEventListener('click', emit(REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN));

    syncAdminButtonsState();
    syncPasswordVisibility(false);
    clientConfig.onChange(syncAdminButtonsState);
}

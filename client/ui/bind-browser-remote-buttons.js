import {emitWithTimestamp} from "../core/socket-emit.js";
import { bindTouchPassthrough } from '../touch/bind-touch-passthrough.js';
import { getClientBrowserConfig, onClientConfigChange } from '../config/client-config.js';
import { getClientBrowserVisibility, onClientBrowserVisibilityChange } from '../i18n/index.js';
import {
    REMOTE_EVENT_BROWSER_OPEN,
    REMOTE_EVENT_KEYBOARD_KEY
} from "../../utils/shared/remoteCommands.js";

export function bindBrowserRemoteButtons(
    socket,
    {
        browserLaunchers,
        btnBrowserBack,
        btnBrowserForward,
        btnPrevTab,
        btnNextTab,
        btnNewTab,
        btnCloseTab,
        btnAddressBar,
        btnHardReload,
        btnFullscreen,
        btnVideoPlayPause,
        btnVideoMute,
        btnVideoFullscreen,
        touchpad,
    },
) {
    let launcherButtons = [];
    const staticButtons = [
        btnBrowserBack,
        btnBrowserForward,
        btnPrevTab,
        btnNextTab,
        btnNewTab,
        btnCloseTab,
        btnAddressBar,
        btnHardReload,
        btnFullscreen,
        btnVideoPlayPause,
        btnVideoMute,
        btnVideoFullscreen,
    ];

    bindTouchPassthrough(staticButtons, touchpad);

    function isBrowserRemoteEnabled() {
        return getClientBrowserConfig().enabled !== false;
    }

    function isBrowserLauncherEnabled(browserId) {
        return getClientBrowserConfig().enabled !== false
            && getClientBrowserConfig()?.[browserId] !== false
            && getClientBrowserVisibility(browserId, true);
    }

    async function loadBrowserLaunchers() {
        if (!browserLaunchers) {
            return;
        }

        browserLaunchers.textContent = '';
        launcherButtons = [];

        if (!isBrowserRemoteEnabled()) {
            return;
        }

        try {
            const response = await fetch('/api/admin/remotes/browsers', {
                credentials: 'same-origin',
            });
            if (!response.ok) {
                return;
            }

            const payload = await response.json();
            const browsers = Array.isArray(payload?.browsers) ? payload.browsers : [];

            for (const browser of browsers) {
                if (!browser?.id || browser.enabled === false || !isBrowserLauncherEnabled(browser.id)) {
                    continue;
                }

                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = String(browser.shortLabel || browser.name || browser.id);
                button.title = String(browser.name || browser.id);
                button.setAttribute('aria-label', String(browser.name || browser.id));
                button.dataset.browserId = browser.id;
                button.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_BROWSER_OPEN, {
                    browserId: browser.id,
                }));
                browserLaunchers.appendChild(button);
                launcherButtons.push(button);
            }

            if (launcherButtons.length > 0) {
                bindTouchPassthrough(launcherButtons, touchpad);
            }
        } catch (_error) {
            browserLaunchers.textContent = '';
            launcherButtons = [];
        }
    }

    void loadBrowserLaunchers();
    onClientConfigChange(() => {
        void loadBrowserLaunchers();
    });
    onClientBrowserVisibilityChange(() => {
        void loadBrowserLaunchers();
    });
    
    btnBrowserBack.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'left', modifiers: ['alt']}),
    );
    btnBrowserForward.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'right', modifiers: ['alt']}),
    );
    btnPrevTab.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'tab', modifiers: ['control', 'shift']}),
    );
    btnNextTab.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'tab', modifiers: ['control']}),
    );
    btnNewTab.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 't', modifiers: ['control']}),
    );
    btnCloseTab.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'w', modifiers: ['control']}),
    );
    btnAddressBar.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'l', modifiers: ['control']}),
    );
    btnHardReload.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'f5', modifiers: ['control']}),
    );
    btnFullscreen.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'f11'}));
    btnVideoPlayPause.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'space'}),
    );
    btnVideoMute.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'm'}),
    );
    btnVideoFullscreen.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'f'}),
    );
}

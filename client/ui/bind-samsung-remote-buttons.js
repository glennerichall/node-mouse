import {
    getClientSamsungConfig,
    onClientConfigChange
} from "../config/client-config.js";
import {
    getClientRemoteVisibility,
    onClientRemoteVisibilityChange
} from "../i18n/index.js";
import {emitWithTimestamp} from "../core/socket-emit.js";
import {
    REMOTE_EVENT_SAMSUNG_ENTER,
    REMOTE_EVENT_SAMSUNG_INPUT,
    REMOTE_EVENT_SAMSUNG_OFF,
    REMOTE_EVENT_SAMSUNG_ON,
    REMOTE_EVENT_SAMSUNG_PC_INPUT,
    REMOTE_EVENT_SAMSUNG_VOL_DOWN,
    REMOTE_EVENT_SAMSUNG_VOL_UP
} from "../../utils/shared/remoteCommands.js";

export function bindSamsungRemoteButtons(
    socket,
    {
        tvControls,
        btnSamsungOn,
        btnSamsungOff,
        btnSamsungVolUp,
        btnSamsungVolDown,
        btnSamsungInput,
        btnSamsungEnter,
        btnSamsungPcInput,
    },
) {
    const requiresOnButtons = Array.from(tvControls?.querySelectorAll('[data-samsung-requires-on="true"]') || []);
    let samsungStatusInterval = null;
    let currentSamsungPowerState = 'unknown';
    let expeditedPollTimers = [];

    const clearExpeditedSamsungPolling = () => {
        for (const timer of expeditedPollTimers) {
            clearTimeout(timer);
        }
        expeditedPollTimers = [];
    };

    const applySamsungPowerState = (powerState) => {
        currentSamsungPowerState = powerState || 'unknown';
        const isOn = powerState === 'on' || powerState === 'unknown';
        for (const button of requiresOnButtons) {
            button.hidden = !isOn;
        }
    };

    const refreshSamsungPowerState = async () => {
        const samsungConfig = getClientSamsungConfig();
        const locallyVisible = getClientRemoteVisibility('samsung', true);
        if (!tvControls || !samsungConfig.enabled || !locallyVisible) {
            applySamsungPowerState('off');
            return;
        }

        try {
            const response = await fetch('/api/remotes/samsung/status', {cache: 'no-store'});
            if (!response.ok) {
                applySamsungPowerState('unknown');
                return;
            }
            const payload = await response.json();
            applySamsungPowerState(payload?.power || 'unknown');
        } catch (_error) {
            applySamsungPowerState('unknown');
        }
    };

    const startExpeditedSamsungPolling = (targetPowerState) => {
        clearExpeditedSamsungPolling();
        const delaysMs = [0, 350, 900, 1800, 3200, 5200];

        expeditedPollTimers = delaysMs.map((delayMs) => window.setTimeout(async () => {
            await refreshSamsungPowerState();
            if (currentSamsungPowerState === targetPowerState) {
                clearExpeditedSamsungPolling();
            }
        }, delayMs));
    };

    const ensureSamsungStatusPolling = () => {
        if (samsungStatusInterval) {
            return;
        }
        samsungStatusInterval = window.setInterval(() => {
            void refreshSamsungPowerState();
        }, 4000);
    };

    const syncSamsungVisibility = () => {
        if (!tvControls) {
            return;
        }
        const samsungConfig = getClientSamsungConfig();
        const locallyVisible = getClientRemoteVisibility('samsung', true);
        tvControls.hidden = !samsungConfig.enabled || !locallyVisible;
        if (tvControls.hidden) {
            clearExpeditedSamsungPolling();
            applySamsungPowerState('off');
        } else {
            void refreshSamsungPowerState();
        }
    };

    btnSamsungOn.addEventListener('click', () => {
        emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_ON);
        startExpeditedSamsungPolling('on');
    });
    btnSamsungOff.addEventListener('click', () => {
        emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_OFF);
        startExpeditedSamsungPolling('off');
    });
    btnSamsungVolUp.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_VOL_UP));
    btnSamsungVolDown.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_VOL_DOWN));
    btnSamsungInput.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_INPUT));
    btnSamsungEnter.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_ENTER));
    btnSamsungPcInput.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_PC_INPUT));
    syncSamsungVisibility();
    ensureSamsungStatusPolling();
    onClientConfigChange(syncSamsungVisibility);
    onClientRemoteVisibilityChange(syncSamsungVisibility);
}

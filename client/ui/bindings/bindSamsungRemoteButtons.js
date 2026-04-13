import {emitWithTimestamp} from '../../core/socket-emit.js';
import {
    REMOTE_EVENT_SAMSUNG_ENTER,
    REMOTE_EVENT_SAMSUNG_INPUT,
    REMOTE_EVENT_SAMSUNG_MUTE,
    REMOTE_EVENT_SAMSUNG_OFF,
    REMOTE_EVENT_SAMSUNG_ON,
    REMOTE_EVENT_SAMSUNG_PC_INPUT,
    REMOTE_EVENT_SAMSUNG_VOL_DOWN,
    REMOTE_EVENT_SAMSUNG_VOL_UP
} from '../../../utils/remoteCommands.js';
import { bindTouchPassthrough } from '../../touch/bindTouchPassthrough.js';

export function bindSamsungRemoteButtons(
    socket,
    {
        root,
        btnSamsungOn,
        btnSamsungOff,
        btnSamsungVolUp,
        btnSamsungVolDown,
        btnSamsungMute,
        btnSamsungInput,
        btnSamsungEnter,
        btnSamsungPcInput,
        touchpad,
    },
    services,
) {
    const clientConfig = services.getClientConfig();
    const getConfigView = services.getConfigView;
    const preferenceView = services.getPreferenceView();
    const backend = services.getBackend();
    bindTouchPassthrough([
        btnSamsungOn,
        btnSamsungOff,
        btnSamsungVolUp,
        btnSamsungVolDown,
        btnSamsungMute,
        btnSamsungInput,
        btnSamsungEnter,
        btnSamsungPcInput,
    ], touchpad);

    const requiresOnButtons = Array.from(root?.querySelectorAll('[data-samsung-requires-on="true"]') || []);
    let samsungStatusInterval = null;
    let currentSamsungPowerState = 'unknown';
    let expeditedPollTimers = [];
    const emit = (eventName) => () => emitWithTimestamp(socket, eventName);
    const emitSamsungOn = emit(REMOTE_EVENT_SAMSUNG_ON);
    const emitSamsungOff = emit(REMOTE_EVENT_SAMSUNG_OFF);

    const clearExpeditedSamsungPolling = () => {
        for (const timer of expeditedPollTimers) {
            clearTimeout(timer);
        }
        expeditedPollTimers = [];
    };

    const applySamsungPowerState = (powerState) => {
        currentSamsungPowerState = powerState || 'unknown';
        console.debug('[samsung-remote] apply power state', {
            powerState: currentSamsungPowerState,
        });
        const isOn = powerState === 'on' || powerState === 'unknown';
        for (const button of requiresOnButtons) {
            button.hidden = !isOn;
        }
    };

    const refreshSamsungPowerState = async () => {
        const samsungConfig = getConfigView().getSamsungConfig();
        const locallyVisible = preferenceView.getRemoteVisibility('samsung', true);
        if (!root || !samsungConfig.enabled || !locallyVisible) {
            applySamsungPowerState('off');
            return;
        }

        try {
            console.debug('[samsung-remote] refresh power state');
            const payload = await backend.getSamsungStatus();
            console.debug('[samsung-remote] status payload', payload);
            applySamsungPowerState(payload?.power || 'unknown');
        } catch (_error) {
            console.debug('[samsung-remote] status fetch failed');
            applySamsungPowerState('unknown');
        }
    };

    const startExpeditedSamsungPolling = (targetPowerState) => {
        console.debug('[samsung-remote] start expedited polling', {targetPowerState});
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
        if (!root) {
            return;
        }
        const samsungConfig = getConfigView().getSamsungConfig();
        const locallyVisible = preferenceView.getRemoteVisibility('samsung', true);
        root.hidden = !samsungConfig.enabled || !locallyVisible;
        if (root.hidden) {
            clearExpeditedSamsungPolling();
            applySamsungPowerState('off');
        } else {
            void refreshSamsungPowerState();
        }
    };

    btnSamsungOn.addEventListener('click', () => {
        console.debug('[samsung-remote] click on');
        emitSamsungOn();
        startExpeditedSamsungPolling('on');
    });
    btnSamsungOff.addEventListener('click', () => {
        console.debug('[samsung-remote] click off');
        emitSamsungOff();
        startExpeditedSamsungPolling('off');
    });
    btnSamsungVolUp.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_VOL_UP));
    btnSamsungVolDown.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_VOL_DOWN));
    btnSamsungMute.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_MUTE));
    btnSamsungInput.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_INPUT));
    btnSamsungEnter.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_ENTER));
    btnSamsungPcInput.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_PC_INPUT));
    syncSamsungVisibility();
    ensureSamsungStatusPolling();
    clientConfig.onChange(syncSamsungVisibility);
    preferenceView.onRemoteVisibilityChange(syncSamsungVisibility);
}

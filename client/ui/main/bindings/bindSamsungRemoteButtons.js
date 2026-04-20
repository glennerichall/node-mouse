import {emitWithTimestamp} from '../../../core/socket-emit.js';
import {
    REMOTE_EVENT_SAMSUNG_ENTER,
    REMOTE_EVENT_SAMSUNG_INPUT,
    REMOTE_EVENT_SAMSUNG_MUTE,
    REMOTE_EVENT_SAMSUNG_OFF,
    REMOTE_EVENT_SAMSUNG_ON,
    REMOTE_EVENT_SAMSUNG_PC_INPUT,
    REMOTE_EVENT_SAMSUNG_VOL_DOWN,
    REMOTE_EVENT_SAMSUNG_VOL_UP
} from '../../../../utils/remoteCommands.js';
import { bindTouchPassthrough } from '../../../touch/bindTouchPassthrough.js';

const VOLUME_REPEAT_HOLD_DELAY_MS = 1000;
const VOLUME_REPEAT_INTERVAL_MS = 170;
const VOLUME_REPEAT_MOVE_CANCEL_THRESHOLD_PX = 10;

function getPointerDistance(startPoint, event) {
    if (!startPoint) {
        return 0;
    }

    const dx = Number(event.clientX || 0) - startPoint.clientX;
    const dy = Number(event.clientY || 0) - startPoint.clientY;
    return Math.hypot(dx, dy);
}

function getTouchDistance(startPoint, touch) {
    if (!startPoint || !touch) {
        return 0;
    }

    const dx = Number(touch.clientX || 0) - startPoint.clientX;
    const dy = Number(touch.clientY || 0) - startPoint.clientY;
    return Math.hypot(dx, dy);
}

export function bindRepeatingButton(button, emitAction, {
    holdDelayMs = VOLUME_REPEAT_HOLD_DELAY_MS,
    repeatIntervalMs = VOLUME_REPEAT_INTERVAL_MS,
    moveCancelThresholdPx = VOLUME_REPEAT_MOVE_CANCEL_THRESHOLD_PX,
} = {}) {
    if (!button || typeof emitAction !== 'function') {
        return;
    }

    let isPressed = false;
    let pointerPressHandled = false;
    let activePointerId = null;
    let activeTouchId = null;
    let startPoint = null;
    let holdTimer = null;
    let repeatTimer = null;
    let suppressClickTimer = null;

    const clearTimers = () => {
        if (holdTimer) {
            window.clearTimeout(holdTimer);
            holdTimer = null;
        }
        if (repeatTimer) {
            window.clearInterval(repeatTimer);
            repeatTimer = null;
        }
        if (suppressClickTimer) {
            window.clearTimeout(suppressClickTimer);
            suppressClickTimer = null;
        }
    };

    const startPress = () => {
        if (isPressed || button.disabled || button.hidden) {
            return;
        }

        isPressed = true;
        emitAction();
        holdTimer = window.setTimeout(() => {
            emitAction();
            repeatTimer = window.setInterval(emitAction, repeatIntervalMs);
        }, holdDelayMs);
    };

    const stopPress = () => {
        if (!isPressed) {
            return;
        }

        isPressed = false;
        activePointerId = null;
        activeTouchId = null;
        startPoint = null;
        if (holdTimer) {
            window.clearTimeout(holdTimer);
            holdTimer = null;
        }
        if (repeatTimer) {
            window.clearInterval(repeatTimer);
            repeatTimer = null;
        }
        suppressClickTimer = window.setTimeout(() => {
            pointerPressHandled = false;
            suppressClickTimer = null;
        }, 500);
    };

    button.addEventListener('pointerdown', (event) => {
        if (event.button !== undefined && event.button !== 0) {
            return;
        }

        pointerPressHandled = true;
        activePointerId = event.pointerId;
        startPoint = {
            clientX: Number(event.clientX || 0),
            clientY: Number(event.clientY || 0),
        };
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        startPress();
    });

    button.addEventListener('touchstart', (event) => {
        if (event.changedTouches?.length !== 1) {
            return;
        }

        const touch = event.changedTouches[0];
        activeTouchId = touch.identifier;
        startPoint = {
            clientX: Number(touch.clientX || 0),
            clientY: Number(touch.clientY || 0),
        };
    }, {passive: true});

    button.addEventListener('pointermove', (event) => {
        if (!isPressed || event.pointerId !== activePointerId) {
            return;
        }

        if (getPointerDistance(startPoint, event) >= moveCancelThresholdPx) {
            stopPress();
        }
    });

    button.addEventListener('touchmove', (event) => {
        if (!isPressed || activeTouchId === null) {
            return;
        }

        const touch = Array.from(event.changedTouches || [])
            .find((entry) => entry.identifier === activeTouchId);
        if (getTouchDistance(startPoint, touch) >= moveCancelThresholdPx) {
            stopPress();
        }
    }, {passive: true});

    button.addEventListener('pointerup', (event) => {
        event.preventDefault();
        button.releasePointerCapture?.(event.pointerId);
        stopPress();
    });

    button.addEventListener('pointercancel', stopPress);
    button.addEventListener('lostpointercapture', stopPress);
    button.addEventListener('mouseleave', stopPress);
    window.addEventListener('blur', stopPress);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopPress();
        }
    });

    button.addEventListener('click', (event) => {
        if (pointerPressHandled) {
            pointerPressHandled = false;
            if (suppressClickTimer) {
                window.clearTimeout(suppressClickTimer);
                suppressClickTimer = null;
            }
            event.preventDefault();
            return;
        }

        emitAction();
    });
}

export function bindSamsungRemoteButtons(services, dom) {
    const socket = services.getTransport();
    const clientConfig = services.getClientConfig();
    const getConfigView = services.getConfigView;
    const appState = services.getAppState();
    const backend = services.getBackend();
    const touchpad = dom.remotes.mouse.touchpad;
    const {
        root,
        btnSamsungOn,
        btnSamsungOff,
        btnSamsungVolUp,
        btnSamsungVolDown,
        btnSamsungMute,
        btnSamsungInput,
        btnSamsungEnter,
        btnSamsungPcInput,
    } = dom.remotes.samsung;
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
        const locallyVisible = appState.get('effective.remote.samsung.visible');
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
        const locallyVisible = appState.get('effective.remote.samsung.visible');
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
    bindRepeatingButton(btnSamsungVolUp, emit(REMOTE_EVENT_SAMSUNG_VOL_UP));
    bindRepeatingButton(btnSamsungVolDown, emit(REMOTE_EVENT_SAMSUNG_VOL_DOWN));
    btnSamsungMute.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_MUTE));
    btnSamsungInput.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_INPUT));
    btnSamsungEnter.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_ENTER));
    btnSamsungPcInput.addEventListener('click', emit(REMOTE_EVENT_SAMSUNG_PC_INPUT));
    syncSamsungVisibility();
    ensureSamsungStatusPolling();
    clientConfig.onChange(syncSamsungVisibility);
    appState.subscribeProperty('effective.remote.samsung.visible', syncSamsungVisibility);
}

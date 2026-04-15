import {createAccumulatedThrottle} from './throttle.js';
import {emitWithTimestamp} from '../core/socket-emit.js';
import {
    REMOTE_EVENT_MOUSE_BUTTON,
    REMOTE_EVENT_MOUSE_CLICK,
    REMOTE_EVENT_MOUSE_MOVE,
    REMOTE_EVENT_MOUSE_SCROLL,
} from '../../utils/remoteCommands.js';
import {
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
} from './touch-handlers.js';
import {APP_STATE_PREVIEW_ACTIVITY_AT} from '../services/app-state/createAppStateService.js';

const REMOTE_HIDE_DELAY_MS = 300;
const SHOW_REMOTE_DELAY_MS = 500;

function createNoopTouchHandler() {
    return {
        buttonState: () => {
        },
        interactionStart: () => {
        },
        interactionEnd: () => {
        },
        move: () => {
        },
        scroll: () => {
        },
        click: () => {
        },
        flush: () => {
        },
    };
}

function createInitialTouchState() {
    return {
        oneFinger: null,
        oneFingerStart: null,
        oneFingerMode: 'move',
        twoFinger: null,
        movementStarted: false,
        moved: false,
        dragActive: false,
        dragEligible: false,
        interactionActive: false,
        touchStartedAt: 0,
        lastMoveAt: 0,
    };
}

function createTouchpadEventHandlers({touchpad, state, handler}) {
    return {
        onTouchStart: (event) => handleTouchStart(event, {touchpad, state, handler}),
        onTouchMove: (event) => handleTouchMove(event, {state, handler}),
        onTouchEnd: (event) => handleTouchEnd(event, {state, handler}),
    };
}

export function createSocketTouchHandler(socket, options = {}) {
    const onMouseMove = typeof options.onMouseMove === 'function'
        ? options.onMouseMove
        : () => {
        };
    const onMovementStart = typeof options.onMovementStart === 'function'
        ? options.onMovementStart
        : () => {
        };
    const onInteractionEnd = typeof options.onInteractionEnd === 'function'
        ? options.onInteractionEnd
        : () => {
        };
    const getInputConfig = typeof options.getInputConfig === 'function'
        ? options.getInputConfig
        : () => ({});
    const getHandedness = typeof options.getHandedness === 'function'
        ? options.getHandedness
        : () => 'right';

    const moveEmitter = createAccumulatedThrottle(
        (payload) => {
            onMouseMove(payload);
            emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_MOVE, payload);
        },
        16,
    );
    const scrollEmitter = createAccumulatedThrottle(
        (payload) => {
            onMouseMove(payload);
            emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_SCROLL, {dy: payload.dy});
        },
        12,
    );
    return {
        buttonState: (button, state) => {
            emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_BUTTON, {button, state});
        },
        interactionStart: (kind = 'move') => {
            onMovementStart(kind);
        },
        interactionEnd: () => {
            onInteractionEnd();
        },
        move: (dx, dy) => {
            moveEmitter.addDelta(dx, dy);
        },
        scroll: (dy) => {
            scrollEmitter.addDelta(0, dy);
        },
        click: (button) => {
            emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_CLICK, {button});
        },
        getInputConfig,
        getHandedness,
        flush: () => {
            moveEmitter.flushNow();
            scrollEmitter.flushNow();
        },
    };
}

export function bindTouchpadEvents(touchpad, touchHandler) {
    const handler = touchHandler || createNoopTouchHandler();
    const state = createInitialTouchState();
    const {onTouchStart, onTouchMove, onTouchEnd} = createTouchpadEventHandlers({
        touchpad,
        state,
        handler,
    });

    touchpad.addEventListener('touchstart', onTouchStart, {passive: false});
    touchpad.addEventListener('touchmove', onTouchMove, {passive: false});
    touchpad.addEventListener('touchend', onTouchEnd, {passive: false});
    touchpad.addEventListener('touchcancel', onTouchEnd, {passive: false});
}

export function bindSocketTouchpad(socket, touchpad, options = {}) {
    const touchHandler = createSocketTouchHandler(socket, options);
    bindTouchpadEvents(touchpad, touchHandler);
}

export function bindTouchpad(services, dom) {
    const socket = services.getTransport();
    const appState = services.getAppState();
    const preferenceView = services.getPreferenceView();
    const touchpad = dom.remotes.mouse.touchpad;
    let hideRemoteTimer = null;
    let showRemoteTimer = null;

    const clearHideTimer = () => {
        if (hideRemoteTimer) {
            clearTimeout(hideRemoteTimer);
            hideRemoteTimer = null;
        }
    };

    const clearShowTimer = () => {
        if (showRemoteTimer) {
            clearTimeout(showRemoteTimer);
            showRemoteTimer = null;
        }
    };

    const showRemotesImmediately = () => {
        dom.remoteStack?.classList.remove('is-hidden');
        dom.scrollZoneIndicator?.classList.remove('is-hidden');
    };

    const hideRemotes = (interactionKind = 'move') => {
        if (!dom.remoteStack || interactionKind !== 'move') {
            return;
        }
        if (!preferenceView.getRemoteAutoHide()) {
            showRemotesImmediately();
            return;
        }
        if (hideRemoteTimer) {
            return;
        }
        clearShowTimer();
        hideRemoteTimer = window.setTimeout(() => {
            dom.remoteStack.classList.add('is-hidden');
            dom.scrollZoneIndicator?.classList.add('is-hidden');
            hideRemoteTimer = null;
        }, REMOTE_HIDE_DELAY_MS);
    };

    const showRemotes = () => {
        if (!dom.remoteStack) {
            return;
        }
        clearHideTimer();
        clearShowTimer();
        showRemoteTimer = window.setTimeout(() => {
            showRemotesImmediately();
            showRemoteTimer = null;
        }, SHOW_REMOTE_DELAY_MS);
    };

    const applyRemoteAutoHideState = () => {
        if (preferenceView.getRemoteAutoHide()) {
            return;
        }
        clearHideTimer();
        clearShowTimer();
        showRemotesImmediately();
    };

    bindSocketTouchpad(socket, touchpad, {
        onMouseMove: () => {
            appState.set(
                APP_STATE_PREVIEW_ACTIVITY_AT,
                typeof performance !== 'undefined' && typeof performance.now === 'function'
                    ? performance.now()
                    : Date.now(),
            );
        },
        onMovementStart: hideRemotes,
        onInteractionEnd: showRemotes,
        getInputConfig: () => services.getConfigView().getInputConfig(),
        getHandedness: () => preferenceView.getHandedness(),
    });

    preferenceView.onRemoteAutoHideChange(applyRemoteAutoHideState);
    applyRemoteAutoHideState();
}

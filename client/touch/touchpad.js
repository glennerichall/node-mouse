import {createAccumulatedThrottle} from './throttle.js';
import {triggerHapticFeedback} from './haptic-feedback.js';
import {emitWithTimestamp} from '../core/socket-emit.js';
import {
    REMOTE_EVENT_MOUSE_BUTTON,
    REMOTE_EVENT_MOUSE_CALIBRATION,
    REMOTE_EVENT_MOUSE_CLICK,
    REMOTE_EVENT_MOUSE_MOVE,
    REMOTE_EVENT_MOUSE_SCROLL,
} from '../../utils/remoteCommands.js';
import {
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
} from './touch-handlers.js';
import {
    APP_STATE_HANDEDNESS,
    APP_STATE_PREVIEW_ACTIVITY_AT,
    APP_STATE_REMOTE_AUTO_HIDE,
    APP_STATE_POINTER_SLOW_SPEED,
    APP_STATE_POINTER_FAST_SPEED,
    APP_STATE_POINTER_ACCELERATION,
    APP_STATE_POINTER_TRANSFER,
} from '../services/app-state/createAppStateService.js';

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
        calibrationMove: () => {},
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
    const getPointerPreferences = typeof options.getPointerPreferences === 'function'
        ? options.getPointerPreferences : () => ({speed: 1.3, acceleration: true, accelerationStrength: 1});
    const onHapticFeedback = typeof options.onHapticFeedback === 'function'
        ? options.onHapticFeedback
        : triggerHapticFeedback;
    const getCalibrationSession = typeof options.getCalibrationSession === 'function'
        ? options.getCalibrationSession : () => null;

    const moveEmitter = createAccumulatedThrottle(
        (payload) => {
            onMouseMove(payload);
            emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_MOVE, {...payload, adjusted: true});
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
        calibrationMove: (movement) => {
            const session = getCalibrationSession();
            if (!session?.sessionId) return;
            emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_CALIBRATION, {
                sessionId: session.sessionId,
                ...movement,
            });
        },
        scroll: (dy) => {
            scrollEmitter.addDelta(0, dy);
        },
        click: (button) => {
            onHapticFeedback();
            emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_CLICK, {button});
        },
        getInputConfig,
        getHandedness,
        getPointerPreferences,
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
    const touchpad = dom.remotes.mouse.touchpad;
  let calibrationSession = null;
  const refreshCalibrationSession = () => fetch('/api/client/mouse-tuning/session', {cache: 'no-store'})
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
          calibrationSession = result?.active ? result : null;
          if (calibrationSession?.transferFunction?.length >= 2) {
              const currentTransfer = appState.get(APP_STATE_POINTER_TRANSFER);
              if (JSON.stringify(currentTransfer) !== JSON.stringify(calibrationSession.transferFunction)) {
                  appState.set(APP_STATE_POINTER_TRANSFER, calibrationSession.transferFunction);
              }
          }
      })
      .catch(() => {});
  void refreshCalibrationSession();
  window.setInterval(refreshCalibrationSession, 750);
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
        dom.remotes.keyboard?.keyboardShortcutsBar?.classList.remove('is-hidden');
        dom.scrollZoneIndicator?.classList.remove('is-hidden');
    };

    const hideRemotes = (interactionKind = 'move') => {
        if (interactionKind !== 'move') {
            return;
        }
        if (!appState.get(APP_STATE_REMOTE_AUTO_HIDE)) {
            showRemotesImmediately();
            return;
        }
        if (hideRemoteTimer) {
            return;
        }
        clearShowTimer();
        hideRemoteTimer = window.setTimeout(() => {
            dom.remoteStack?.classList.add('is-hidden');
            dom.remotes.keyboard?.keyboardShortcutsBar?.classList.add('is-hidden');
            dom.scrollZoneIndicator?.classList.add('is-hidden');
            hideRemoteTimer = null;
        }, REMOTE_HIDE_DELAY_MS);
    };

    const showRemotes = () => {
        clearHideTimer();
        clearShowTimer();
        showRemoteTimer = window.setTimeout(() => {
            showRemotesImmediately();
            showRemoteTimer = null;
        }, SHOW_REMOTE_DELAY_MS);
    };

    const applyRemoteAutoHideState = () => {
        if (appState.get(APP_STATE_REMOTE_AUTO_HIDE)) {
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
        getHandedness: () => appState.get(APP_STATE_HANDEDNESS),
        getPointerPreferences: () => ({
            slowSpeed: appState.get(APP_STATE_POINTER_SLOW_SPEED),
            fastSpeed: appState.get(APP_STATE_POINTER_FAST_SPEED),
            acceleration: appState.get(APP_STATE_POINTER_ACCELERATION),
            transferFunction: appState.get(APP_STATE_POINTER_TRANSFER),
        }),
        getCalibrationSession: () => calibrationSession,
    });

    appState.subscribeProperty(APP_STATE_REMOTE_AUTO_HIDE, applyRemoteAutoHideState);
    applyRemoteAutoHideState();
}

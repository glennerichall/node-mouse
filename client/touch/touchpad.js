import {createAccumulatedThrottle} from './throttle.js';
import {emitWithTimestamp} from '../core/socket-emit.js';
import {
    REMOTE_EVENT_MOUSE_BUTTON,
    REMOTE_EVENT_MOUSE_CLICK,
    REMOTE_EVENT_MOUSE_MOVE,
    REMOTE_EVENT_MOUSE_SCROLL,
} from '../../utils/shared/remoteCommands.js';
import {
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
} from './touch-handlers.js';

function createNoopTouchHandler() {
    return {
        buttonState: () => {
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
        moved: false,
        dragActive: false,
        dragEligible: false,
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
    const getInputConfig = typeof options.getInputConfig === 'function'
        ? options.getInputConfig
        : () => ({});

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

export function bindTouchpad(socket, touchpad, options = {}) {
    const touchHandler = createSocketTouchHandler(socket, options);
    bindTouchpadEvents(touchpad, touchHandler);
}

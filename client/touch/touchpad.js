import {createAccumulatedThrottle} from './throttle.js';
import {
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
} from './touch-handlers.js';

function createNoopTouchHandler() {
    return {
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
        oneFingerMode: 'move',
        twoFinger: null,
        moved: false,
        touchStartedAt: 0,
        lastMoveAt: 0,
    };
}

function createTouchpadEventHandlers({touchpad, state, handler}) {
    return {
        onTouchStart: (event) => handleTouchStart(event, {touchpad, state}),
        onTouchMove: (event) => handleTouchMove(event, {state, handler}),
        onTouchEnd: (event) => handleTouchEnd(event, {state, handler}),
    };
}

export function createSocketTouchHandler(socket, options = {}) {
    const onMouseMove = typeof options.onMouseMove === 'function'
        ? options.onMouseMove
        : () => {
        };

    const moveEmitter = createAccumulatedThrottle(
        (payload) => {
            onMouseMove(payload);
            socket.emit('mouse:move', payload)
        },
        16,
    );
    const scrollEmitter = createAccumulatedThrottle(
        (payload) => {
            onMouseMove(payload);
            socket.emit('mouse:scroll', {dy: payload.dy})
        },
        12,
    );

    return {
        move: (dx, dy) => {
            moveEmitter.addDelta(dx, dy);
        },
        scroll: (dy) => {
            scrollEmitter.addDelta(0, dy);
        },
        click: (button) => {
            socket.emit('mouse:click', {button})
        },
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

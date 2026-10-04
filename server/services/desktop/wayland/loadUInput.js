import {loadUInputBridge} from '../../../os/linux/wayland/loadUInputBridge.js';
import {loadXWaylandPointerPosition} from '../../../os/linux/wayland/loadXWaylandPointerPosition.js';
import {createWaylandDesktopController} from './createWaylandDesktopController.js';

function statusFromOpenError(error) {
    return {
        status: error?.code === 'UINPUT_PERMISSION_DENIED' ? 'permission-denied' : 'uinput-unavailable',
        detail: `${error?.message || 'Unable to open /dev/uinput'}. Install the udev rule and reconnect your session.`,
    };
}

export async function loadUInput({
    bridgeLoader = loadUInputBridge,
    pointerPositionLoader = loadXWaylandPointerPosition,
} = {}) {
    const bridge = bridgeLoader();
    let status = {status: 'ready'};
    try {
        bridge.open();
    } catch (error) {
        status = statusFromOpenError(error);
    }

    const backend = {
        authorize() {
            try {
                bridge.open();
                status = {status: 'ready'};
            } catch (error) {
                status = statusFromOpenError(error);
            }
        },
        getStatus: () => ({...status}),
        moveRelative: (x, y) => status.status === 'ready' && bridge.moveRelative(x, y),
        button: (code, pressed) => status.status === 'ready' && bridge.button(code, pressed ? 1 : 0),
        scroll: (x, y) => status.status === 'ready' && bridge.scroll(x, y),
        key: (code, pressed) => status.status === 'ready' && bridge.key(code, pressed ? 1 : 0),
        close() {
            bridge.close();
            status = {status: 'stopped'};
        },
    };
    return createWaylandDesktopController(backend, {
        adapter: 'wayland-uinput',
        getPointerPosition: pointerPositionLoader(),
    });
}

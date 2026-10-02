const KEY_CODES = Object.freeze({
    escape: 1,
    backspace: 14,
    tab: 15,
    enter: 28,
    control: 29,
    shift: 42,
    alt: 56,
    space: 57,
    f5: 63,
    f11: 87,
    up: 103,
    left: 105,
    right: 106,
    down: 108,
    command: 125,
});

const CHARACTER_CODES = Object.freeze({
    '1': 2, '2': 3, '3': 4, '4': 5, '5': 6,
    '6': 7, '7': 8, '8': 9, '9': 10, '0': 11,
    '-': 12,
    q: 16, w: 17, e: 18, r: 19, t: 20, y: 21, u: 22, i: 23, o: 24, p: 25,
    a: 30, s: 31, d: 32, f: 33, g: 34, h: 35, j: 36, k: 37, l: 38,
    z: 44, x: 45, c: 46, v: 47, b: 48, n: 49, m: 50,
    ' ': 57,
});

const MODIFIER_CODES = Object.freeze({
    control: KEY_CODES.control,
    shift: KEY_CODES.shift,
    alt: KEY_CODES.alt,
    command: KEY_CODES.command,
});

export function createWaylandDesktopController(backend, {adapter = 'wayland'} = {}) {
    const pointer = {x: 0, y: 0};

    function key(code, pressed) {
        if (Number.isInteger(code)) {
            backend.key(code, pressed);
        }
    }

    function tapCode(code, modifiers = []) {
        const modifierCodes = modifiers.map((modifier) => MODIFIER_CODES[modifier]).filter(Number.isInteger);
        modifierCodes.forEach((modifierCode) => key(modifierCode, true));
        key(code, true);
        key(code, false);
        modifierCodes.reverse().forEach((modifierCode) => key(modifierCode, false));
    }

    function typeString(text) {
        for (const character of Array.from(String(text))) {
            const lower = character.toLowerCase();
            const code = CHARACTER_CODES[lower];
            if (!Number.isInteger(code)) {
                continue;
            }
            tapCode(code, character !== lower ? ['shift'] : []);
        }
    }

    function keyTap(keyName, modifiers = []) {
        const normalized = String(keyName).toLowerCase();
        const code = KEY_CODES[normalized] || CHARACTER_CODES[normalized];
        tapCode(code, Array.isArray(modifiers) ? modifiers : []);
    }

    function moveMouseRelative(dx, dy) {
        const x = Number(dx) || 0;
        const y = Number(dy) || 0;
        pointer.x += x;
        pointer.y += y;
        backend.moveRelative(x, y);
    }

    function buttonCode(button) {
        return button === 'right' ? 273 : 272;
    }

    function mouseToggle(state, button = 'left') {
        backend.button(buttonCode(button), state === 'down');
    }

    return {
        authorize: () => backend.authorize(),
        getCapabilities() {
            const helperStatus = backend.getStatus();
            return {
                adapter,
                status: helperStatus.status,
                pointer: helperStatus.status === 'ready',
                keyboard: helperStatus.status === 'ready',
                preview: false,
                reason: helperStatus.detail || null,
            };
        },
        getMousePos: () => ({...pointer}),
        moveMouseRelative,
        moveMouse(x, y) {
            moveMouseRelative(Number(x) - pointer.x, Number(y) - pointer.y);
        },
        dragMouse(x, y) {
            moveMouseRelative(Number(x) - pointer.x, Number(y) - pointer.y);
        },
        scrollMouse(x, y) {
            backend.scroll(Number(x) || 0, Number(y) || 0);
        },
        mouseClick(button = 'left') {
            mouseToggle('down', button);
            mouseToggle('up', button);
        },
        mouseToggle,
        setKeyboardDelay() {},
        typeString,
        keyTap,
        getScreenSize: () => ({width: 1, height: 1}),
        screen: {
            capture() {
                const error = new Error('Wayland preview requires the PipeWire adapter');
                error.code = 'WAYLAND_PREVIEW_UNAVAILABLE';
                throw error;
            },
        },
        close: () => backend.close(),
    };
}

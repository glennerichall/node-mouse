const ALLOWED_KEYS = new Set([
    ...'abcdefghijklmnopqrstuvwxyz0123456789',
    'enter',
    'backspace',
    'tab',
    'space',
    'escape',
    'up',
    'down',
    'left',
    'right',
    'f5',
    'f11',
    'command',
]);
const ALLOWED_MODIFIERS = new Set(['control', 'shift', 'alt', 'command']);
const DEFAULT_KEYBOARD_DELAY_MS = 20;

function isDirectTypeSafe(character) {
    return /^[a-zA-Z0-9 -]$/.test(character);
}

function typeUnicodeCharacter(desktopController, character) {
    const codePoint = character.codePointAt(0);
    if (!codePoint) {
        return;
    }

    if (process.platform !== 'linux') {
        desktopController.typeString(character);
        return;
    }

    desktopController.keyTap('u', ['control', 'shift']);
    desktopController.typeString(codePoint.toString(16));
    desktopController.keyTap('enter');
}

export function createKeyboardController(servicesOrDesktopController) {
    const getDesktopController = servicesOrDesktopController?.getDesktopController
        ? () => servicesOrDesktopController.getDesktopController()
        : () => servicesOrDesktopController;
    let keyboardConfigured = false;

    function configureKeyboard(desktopController) {
        if (keyboardConfigured) {
            return;
        }

        if (typeof desktopController?.setKeyboardDelay === 'function') {
            desktopController.setKeyboardDelay(DEFAULT_KEYBOARD_DELAY_MS);
        }
        keyboardConfigured = true;
    }

    function enqueue(task) {
        const desktopController = getDesktopController();
        configureKeyboard(desktopController);
        return task(desktopController);
    }

    function typeText(text) {
        if (!text || typeof text !== 'string') {
            return;
        }

        return enqueue((desktopController) => {
            let directBuffer = '';
            for (const character of Array.from(text)) {
                if (character === '\n') {
                    if (directBuffer) {
                        desktopController.typeString(directBuffer);
                        directBuffer = '';
                    }
                    desktopController.keyTap('enter');
                    continue;
                }

                if (character === '\t') {
                    if (directBuffer) {
                        desktopController.typeString(directBuffer);
                        directBuffer = '';
                    }
                    desktopController.keyTap('tab');
                    continue;
                }

                if (isDirectTypeSafe(character)) {
                    directBuffer += character;
                    continue;
                }

                if (directBuffer) {
                    desktopController.typeString(directBuffer);
                    directBuffer = '';
                }
                typeUnicodeCharacter(desktopController, character);
            }

            if (directBuffer) {
                desktopController.typeString(directBuffer);
            }
        });
    }

    function pressSpecialKey(key, modifiers = []) {
        if (!ALLOWED_KEYS.has(key)) {
            return;
        }

        return enqueue((desktopController) => {
            if (!Array.isArray(modifiers) || modifiers.length === 0) {
                desktopController.keyTap(key);
                return;
            }

            const sanitizedModifiers = modifiers
                .filter((value) => typeof value === 'string')
                .filter((value) => ALLOWED_MODIFIERS.has(value));

            if (sanitizedModifiers.length > 0) {
                desktopController.keyTap(key, sanitizedModifiers);
            } else {
                desktopController.keyTap(key);
            }
        });
    }

    return {
        typeText,
        pressSpecialKey,
        updateConfig() {
            // noOp
        }
    };
}

const ALLOWED_KEYS = new Set([
    'enter',
    'backspace',
    'tab',
    'space',
    'escape',
    'up',
    'down',
    'left',
    'right',
    'a',
    'd',
    'f',
    'i',
    't',
    'w',
    'l',
    'f5',
    'f11',
    'command',
]);
const ALLOWED_MODIFIERS = new Set(['control', 'shift', 'alt', 'command']);
const DEFAULT_KEYBOARD_DELAY_MS = 20;

function isDirectTypeSafe(character) {
    return /^[a-zA-Z0-9 ]$/.test(character);
}

function typeUnicodeCharacter(robot, character) {
    const codePoint = character.codePointAt(0);
    if (!codePoint) {
        return;
    }

    if (process.platform !== 'linux') {
        robot.typeString(character);
        return;
    }

    robot.keyTap('u', ['control', 'shift']);
    robot.typeString(codePoint.toString(16));
    robot.keyTap('enter');
}

export function createKeyboardController(servicesOrRobot) {
    const getRobot = servicesOrRobot?.getRobot
        ? () => servicesOrRobot.getRobot()
        : () => servicesOrRobot;
    let inputQueue = Promise.resolve();
    let keyboardConfigured = false;

    function configureKeyboard(robot) {
        if (keyboardConfigured) {
            return;
        }

        if (typeof robot?.setKeyboardDelay === 'function') {
            robot.setKeyboardDelay(DEFAULT_KEYBOARD_DELAY_MS);
        }
        keyboardConfigured = true;
    }

    function enqueue(task) {
        inputQueue = inputQueue
            .catch(() => {
                // Keep the queue alive after a failed keyboard task.
            })
            .then(() => {
                const robot = getRobot();
                configureKeyboard(robot);
                return task(robot);
            });

        return inputQueue;
    }

    function typeText(text) {
        if (!text || typeof text !== 'string') {
            return Promise.resolve();
        }

        return enqueue((robot) => {
            let directBuffer = '';
            for (const character of Array.from(text)) {
                if (character === '\n') {
                    if (directBuffer) {
                        robot.typeString(directBuffer);
                        directBuffer = '';
                    }
                    robot.keyTap('enter');
                    continue;
                }

                if (character === '\t') {
                    if (directBuffer) {
                        robot.typeString(directBuffer);
                        directBuffer = '';
                    }
                    robot.keyTap('tab');
                    continue;
                }

                if (isDirectTypeSafe(character)) {
                    directBuffer += character;
                    continue;
                }

                if (directBuffer) {
                    robot.typeString(directBuffer);
                    directBuffer = '';
                }
                typeUnicodeCharacter(robot, character);
            }

            if (directBuffer) {
                robot.typeString(directBuffer);
            }
        });
    }

    function pressSpecialKey(key, modifiers = []) {
        if (!ALLOWED_KEYS.has(key)) {
            return Promise.resolve();
        }

        return enqueue((robot) => {
            if (!Array.isArray(modifiers) || modifiers.length === 0) {
                robot.keyTap(key);
                return;
            }

            const sanitizedModifiers = modifiers
                .filter((value) => typeof value === 'string')
                .filter((value) => ALLOWED_MODIFIERS.has(value));

            if (sanitizedModifiers.length > 0) {
                robot.keyTap(key, sanitizedModifiers);
            } else {
                robot.keyTap(key);
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

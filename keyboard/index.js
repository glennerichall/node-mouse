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
  't',
  'w',
  'l',
  'f5',
  'f11',
]);
const ALLOWED_MODIFIERS = new Set(['control', 'shift', 'alt', 'command']);

export function createKeyboardController(robot) {
  function typeText(text) {
    if (!text || typeof text !== 'string') {
      return;
    }
    robot.typeString(text);
  }

  function pressSpecialKey(key, modifiers = []) {
    if (ALLOWED_KEYS.has(key)) {
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
    }
  }

  return { typeText, pressSpecialKey };
}

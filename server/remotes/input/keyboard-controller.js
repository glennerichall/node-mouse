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

export function createKeyboardController(robot) {
  function typeText(text) {
    if (!text || typeof text !== 'string') {
      return;
    }

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

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function loadRobotOrExit() {
  try {
    return require('@hurdlegroup/robotjs');
  } catch (error) {
    console.error('RobotJS n\'est pas disponible. Installez les dépendances natives puis relancez.');
    console.error(error.message);
    process.exit(1);
  }
}

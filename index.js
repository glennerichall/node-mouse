import { startServer } from './server/index.js';
import { createLogger } from './server/application/logger.js';

const log = createLogger('bootstrap');

startServer().catch((error) => {
  log.error({ err: error }, 'Erreur au démarrage');
  process.exit(1);
});

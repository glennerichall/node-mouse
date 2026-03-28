import { startServer } from './server/index.js';
import { createLogger } from './server/log/logger.js';

const log = createLogger('bootstrap');

startServer().catch((error) => {
  log.error({ err: error }, 'Erreur au démarrage');
  process.exit(1);
});

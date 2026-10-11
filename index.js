import {assertSupportedNodeRuntime} from './server/services/persistence/assertSupportedNodeRuntime.js';

try {
  assertSupportedNodeRuntime();
  const [{startServer}, {createLogger}] = await Promise.all([
    import('./server/index.js'),
    import('./server/application/logger.js'),
  ]);
  const log = createLogger('bootstrap');
  await startServer().catch((error) => {
    log.error({err: error}, 'Server startup failed');
    process.exitCode = 1;
  });
} catch (error) {
  console.error(`Server startup failed: ${error.message}`);
  process.exitCode = 1;
}

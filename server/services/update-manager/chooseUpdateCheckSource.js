import { NpmUpdateSource } from './NpmUpdateSource.js';
import { CommandUpdateSource } from './CommandUpdateSource.js';
import {createLogger} from '../../application/logger.js';

export function chooseUpdateCheckSource({getSystemConfig}) {
  const updateConfig = getSystemConfig().updateCheck || {};
  const checkCommand = String(updateConfig.checkCommand || '').trim();
  const logger = createLogger('update-check');
  const commandSource = new CommandUpdateSource({
    checkCommand,
    timeoutSec: updateConfig.checkTimeoutSec,
    logger,
  });
  const npmSource = new NpmUpdateSource({
    packageName: updateConfig.packageName,
    currentVersion: updateConfig.currentVersion,
  });
  const checkSource = checkCommand ? commandSource : npmSource;
  logger.debug({
    source: checkCommand ? 'command' : 'npm',
    hasCheckCommand: Boolean(checkCommand),
    packageName: updateConfig.packageName || '',
    currentVersion: updateConfig.currentVersion || '',
  }, 'Update check: source selected');

  return () => checkSource.check();
}

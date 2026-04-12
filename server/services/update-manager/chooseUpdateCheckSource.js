import { NpmUpdateSource } from './NpmUpdateSource.js';
import { CommandUpdateSource } from './CommandUpdateSource.js';
import {createLogger} from '../../application/logger.js';

export function chooseUpdateCheckSource({getSystemConfig}) {
  const updateConfig = getSystemConfig().updateCheck || {};
  const checkCommand = String(updateConfig.checkCommand || '').trim();
  const commandSource = new CommandUpdateSource({
    checkCommand,
    timeoutSec: updateConfig.checkTimeoutSec,
    logger: createLogger('update-check'),
  });
  const npmSource = new NpmUpdateSource({
    packageName: updateConfig.packageName,
    currentVersion: updateConfig.currentVersion,
  });
  const checkSource = checkCommand ? commandSource : npmSource;

  return () => checkSource.check();
}

import { NpmUpdateSource } from './NpmUpdateSource.js';
import { CommandUpdateSource } from './CommandUpdateSource.js';

export function chooseUpdateCheckSource({getSystemConfig, getLogger}) {
  const updateConfig = getSystemConfig().updateCheck || {};
  const checkCommand = String(updateConfig.checkCommand || '').trim();
  const commandSource = new CommandUpdateSource({
    checkCommand,
    timeoutSec: updateConfig.checkTimeoutSec,
    logger: getLogger('update-check'),
  });
  const npmSource = new NpmUpdateSource({
    packageName: updateConfig.packageName,
    currentVersion: updateConfig.currentVersion,
  });
  const checkSource = checkCommand ? commandSource : npmSource;

  return () => checkSource.check();
}

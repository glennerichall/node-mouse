import { NpmUpdateSource } from './NpmUpdateSource.js';
import { CommandUpdateSource } from './CommandUpdateSource.js';

export function chooseUpdateSource({getSystemConfig}) {
  const config = getSystemConfig();
  const checkCommand = String(config.updateCheck.checkCommand || '').trim();
  const commandSource = new CommandUpdateSource({
    checkCommand,
    timeoutSec: config.updateCheck.checkTimeoutSec,
  });
  const npmSource = new NpmUpdateSource({
    packageName: config.updateCheck.packageName,
    currentVersion: config.updateCheck.currentVersion,
  });

  if (checkCommand) {
    return commandSource;
  }
  return npmSource;
}

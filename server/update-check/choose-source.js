import {getConfig} from '../init/config/index.js';
import { NpmUpdateSource } from './sources/npm-update-source.js';
import { CommandUpdateSource } from './sources/command-update-source.js';

export async function chooseUpdateSource() {
  const config = getConfig();
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

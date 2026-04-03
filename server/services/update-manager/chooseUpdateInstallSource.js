import {resolveInstallUpdateCommand} from './resolveInstallUpdateCommand.js';

export function chooseUpdateInstallSource({getSystemConfig}) {
  return resolveInstallUpdateCommand({getSystemConfig});
}

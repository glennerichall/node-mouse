import {getStartupConfigSnapshot} from '../init/config.js';
import { chooseUpdateSource } from './choose-source.js';
import { UpdateChecker } from './checker.js';

const config = getStartupConfigSnapshot();

export async function startUpdateChecker(notifier) {
  const source = await chooseUpdateSource();
  if (!config.updateCheck.enabled) {
    return {
      stop: () => {},
      runNow: async () => ({ checked: false, hasUpdate: false, disabled: true }),
      getInstallCommand: () => (
        source && typeof source.getInstallCommand === 'function'
          ? source.getInstallCommand()
          : ''
      ),
    };
  }

  const checker = new UpdateChecker({
    notifier,
    source,
    intervalMin: config.updateCheck.intervalMin,
  });
  return checker.start();
}

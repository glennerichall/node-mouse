import {getConfig} from '../init/config/index.js';
import { chooseUpdateSource } from './choose-source.js';
import { UpdateChecker } from './checker.js';
import {createLogger} from '../log/logger.js';

const log = createLogger('update-check:start');

export async function startUpdateChecker(notifier) {
  const config = getConfig();
  const source = await chooseUpdateSource();
  const checker = new UpdateChecker({
    notifier,
    source,
    intervalMin: config.updateCheck.intervalMin,
  });

  if (!config.updateCheck.enabled) {
    log.info('Auto update-check disabled (manual runNow remains enabled)');
    return {
      stop: () => {},
      runNow: () => checker.checkOnce(),
      getInstallCommand: () => checker.getInstallCommand(),
    };
  }

  return checker.start();
}

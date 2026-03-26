import {
  UPDATE_CHECK_ENABLED,
  UPDATE_CHECK_INTERVAL_MIN,
} from '../config.js';
import { chooseUpdateSource } from './choose-source.js';
import { UpdateChecker } from './checker.js';

export async function startUpdateChecker(notifier) {
  const source = await chooseUpdateSource();
  if (!UPDATE_CHECK_ENABLED) {
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
    intervalMin: UPDATE_CHECK_INTERVAL_MIN,
  });
  return checker.start();
}

import { getConfig } from '../../init/config/index.js';
import { createLogger } from '../../log/logger.js';

import {createSamsungCommandService} from './command-service.js';
import {createSamsungDeviceConfigResolver} from './device-config.js';
import {createSamsungRemoteGetter} from './remote-client.js';
import {createDisabledSamsungRemote} from './utils.js';

const log = createLogger('samsung:remote');

export function createSamsungRemote() {
  const config = getConfig().samsungTv;
  if (!config.enabled) {
    return createDisabledSamsungRemote('Controle Samsung desactive. Activez SAMSUNG_TV_ENABLED.');
  }

  const resolveDeviceConfig = createSamsungDeviceConfigResolver({config, log});
  const getRemote = createSamsungRemoteGetter({config, resolveDeviceConfig});
  return createSamsungCommandService({config, getRemote, log});
}

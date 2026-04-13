import {createSamsungCommandService} from './createSamsungCommandService.js';
import {createSamsungDeviceConfigResolver, discoverSamsungDevices} from './device-config.js';
import {createSamsungTvGetter} from './createSamsungTvGetter.js';
import {createDisabledSamsungRemote} from './utils.js';
import {createLogger} from '../../application/logger.js';

let log;
function getModuleLog() {
    log ??= createLogger('samsung:remote');
    return log;
}

export function createSamsungRemote(services) {
    const getLogger = () => getModuleLog();
    const getConfig = ()=> services.getConfig().samsungTv;
    const resolveDeviceConfig = createSamsungDeviceConfigResolver({getConfig, getLogger});
    const discoverDevices = discoverSamsungDevices({getConfig});
    const getSamsungTv = createSamsungTvGetter({getConfig, resolveDeviceConfig});
    return createSamsungCommandService({
        getConfig,
        discoverDevices,
        getSamsungTv,
        getLogger,
        createDisabledRemote: () => createDisabledSamsungRemote('Controle Samsung desactive. Activez SAMSUNG_TV_ENABLED.'),
    });
}

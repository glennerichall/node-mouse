import {createSamsungCommandService} from './createSamsungCommandService.js';
import {createSamsungDeviceConfigResolver, discoverSamsungDevices} from './device-config.js';
import {createSamsungTvGetter} from './createSamsungTvGetter.js';
import {createDisabledSamsungRemote} from './utils.js';

export function createSamsungRemote(services) {
    const getLogger = ()=> services.getLogger('samsung:remote');
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

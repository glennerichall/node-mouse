import {createSamsungCommandService} from './createSamsungCommandService.js';
import {createSamsungDeviceConfigResolver, discoverSamsungDevices} from './device-config.js';
import {createSamsungRemoteGetter} from './createSamsungRemoteGetter.js';
import {createDisabledSamsungRemote} from './utils.js';

export function createSamsungRemote(services) {
    const getLogger = ()=> services.getLogger('samsung:remote');
    const getConfig = ()=> services.getConfig().samsungTv;
    const resolveDeviceConfig = createSamsungDeviceConfigResolver({getConfig, getLogger});
    const discoverDevices = discoverSamsungDevices({getConfig});
    const getRemote = createSamsungRemoteGetter({getConfig, resolveDeviceConfig});
    return createSamsungCommandService({
        getConfig,
        discoverDevices,
        getRemote,
        getLogger,
        createDisabledRemote: () => createDisabledSamsungRemote('Controle Samsung desactive. Activez SAMSUNG_TV_ENABLED.'),
    });
}

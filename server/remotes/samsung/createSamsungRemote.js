import {createSamsungCommandService} from './createSamsungCommandService.js';
import {createSamsungDeviceConfigResolver} from './device-config.js';
import {createSamsungRemoteGetter} from './createSamsungRemoteGetter.js';
import {createDisabledSamsungRemote} from './utils.js';

export function createSamsungRemote(services) {
    const getLogger = ()=> services.getLogger('samsung:remote');
    const getConfig = ()=> services.getConfig().samsungTv;
    const resolveDeviceConfig = createSamsungDeviceConfigResolver({getConfig, getLogger});
    const getRemote = createSamsungRemoteGetter({getConfig, resolveDeviceConfig});
    return createSamsungCommandService({
        getConfig,
        getRemote,
        getLogger,
        createDisabledRemote: () => createDisabledSamsungRemote('Controle Samsung desactive. Activez SAMSUNG_TV_ENABLED.'),
    });
}

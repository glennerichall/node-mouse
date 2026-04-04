import {createHostNotifierByPlatform} from './host-notifier/index.js';

export function createHostNotifier(services) {
    let platformNotifier = null;

    function getPlatformNotifier() {
        if (!platformNotifier) {
            platformNotifier = createHostNotifierByPlatform();
        }
        return platformNotifier;
    }

    return {
        notify(payload) {
            getPlatformNotifier().notify(payload);
        },
    };
}

import {createHostNotifierByPlatform} from './host-notifier/index.js';

export function createHostNotifier(services) {
    const getNotificationsConfig = () => services.getConfig().notifications;
    let platformNotifier = null;

    function getPlatformNotifier() {
        if (!platformNotifier) {
            platformNotifier = createHostNotifierByPlatform();
        }
        return platformNotifier;
    }

    return {
        notify(payload) {
            const notifications = getNotificationsConfig();
            if (!notifications.desktop) {
                return;
            }
            getPlatformNotifier().notify(payload);
        },
    };
}

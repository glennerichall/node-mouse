import {createHostNotifierByPlatform} from './host-notifier/index.js';
import {en} from '../../../client/i18n/locales/en.js';
import {fr} from '../../../client/i18n/locales/fr.js';

function interpolate(template, params = {}) {
    return String(template || '').replace(/\{(\w+)\}/g, (_match, key) => String(params[key] ?? ''));
}

function getHostNotificationDictionary() {
    return String(process.env.LANG || '').toLowerCase().startsWith('fr') ? fr : en;
}

function translateNotificationPayload(payload = {}) {
    const dictionary = getHostNotificationDictionary();
    const params = payload.params && typeof payload.params === 'object' ? payload.params : {};
    const titleTemplate = payload.titleKey ? dictionary[payload.titleKey] : '';
    const messageTemplate = payload.messageKey ? dictionary[payload.messageKey] : '';

    return {
        ...payload,
        title: titleTemplate ? interpolate(titleTemplate, params) : payload.title,
        message: messageTemplate ? interpolate(messageTemplate, params) : payload.message,
    };
}

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
            getPlatformNotifier().notify(translateNotificationPayload(payload));
        },
    };
}

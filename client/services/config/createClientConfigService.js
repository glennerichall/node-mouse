import {setNestedValue} from '../../../utils/shared/objet.utils.js';
import {DEFAULT_CLIENT_CONFIG} from './defaultClientConfig.js';

function getConfigObjectFromEntries(entries) {
    const config = {};

    for (const entry of entries || []) {
        if (!entry?.id) {
            continue;
        }

        setNestedValue(config, entry.id, entry.value);
    }

    return config;
}

export function createClientConfigService(services) {
    let configState = structuredClone(DEFAULT_CLIENT_CONFIG);
    let subscriptionId = '';
    let configStream = null;
    let unloadBound = false;
    const listeners = new Set();

    function notifyListeners() {
        for (const listener of listeners) {
            listener(configState);
        }
    }

    function applyConfigEntries(entries = []) {
        for (const entry of entries) {
            if (!entry?.path) {
                continue;
            }

            setNestedValue(configState, entry.path, entry.value);
        }

        notifyListeners();
    }

    async function loadClientConfig() {
        const payload = await services.getBackend().getClientConfig();
        const loadedConfig = payload?.config || getConfigObjectFromEntries(payload?.configs);
        configState = {
            ...structuredClone(DEFAULT_CLIENT_CONFIG),
            ...loadedConfig,
            system: {
                ...DEFAULT_CLIENT_CONFIG.system,
                ...payload?.systemConfig,
            },
        };
        notifyListeners();
    }

    async function subscribeToConfigEvents() {
        if (typeof window.EventSource !== 'function') {
            return;
        }

        const payload = await services.getBackend().createConfigSubscription('config');
        subscriptionId = String(payload.id || '');
        if (!subscriptionId || !payload.eventsUrl) {
            return;
        }

        configStream?.close();
        configStream = services.getBackend().createEventSource(payload.eventsUrl);
        configStream.addEventListener('config.changed', (event) => {
            try {
                const data = JSON.parse(event.data || '{}');
                applyConfigEntries(data.entries);
            } catch (_error) {
            }
        });
    }

    function unsubscribeFromConfigEvents() {
        if (!subscriptionId) {
            return;
        }

        services.getBackend().deleteSubscription(subscriptionId).catch(() => {
        });
        configStream?.close();
        configStream = null;
        subscriptionId = '';
    }

    return {
        async init() {
            try {
                await loadClientConfig();
            } catch (_error) {
                configState = structuredClone(DEFAULT_CLIENT_CONFIG);
            }

            await subscribeToConfigEvents();
            if (!unloadBound) {
                window.addEventListener('beforeunload', unsubscribeFromConfigEvents, {once: true});
                unloadBound = true;
            }

            return this;
        },
        getConfig() {
            return configState;
        },
        onChange(listener) {
            if (typeof listener !== 'function') {
                return () => {
                };
            }

            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}

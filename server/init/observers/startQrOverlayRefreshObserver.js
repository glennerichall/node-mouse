import {
    PUBSUB_EVENT_CONFIG_DELETED,
    PUBSUB_EVENT_CONFIG_UPDATED,
    PUBSUB_EVENT_TOKEN_CHANGED,
    PUBSUB_SERVICE_CONFIG,
    PUBSUB_SERVICE_TOKEN_MANAGER
} from "../../services/pubsub/serviceEventConstants.js";

function isQrOverlayConfigEvent(event) {
    if (event?.type !== PUBSUB_EVENT_CONFIG_UPDATED && event?.type !== PUBSUB_EVENT_CONFIG_DELETED) {
        return false;
    }

    const changedKeys = Array.isArray(event?.payload?.changedKeys) ? event.payload.changedKeys : [];
    return changedKeys.some((key) => String(key || '').startsWith('qrOverlay.'));
}

function isQrOverlayRefreshEvent(event) {
    if (event?.service === PUBSUB_SERVICE_TOKEN_MANAGER && event?.type === PUBSUB_EVENT_TOKEN_CHANGED) {
        return true;
    }

    return event?.service === PUBSUB_SERVICE_CONFIG && isQrOverlayConfigEvent(event);
}

export function startQrOverlayRefreshObserver(services) {
    const bus = services.getPubSub();
    const qrOverlay = services.getQrOverlay();

    return bus.subscribe((event) => {
        if (event.service === PUBSUB_SERVICE_TOKEN_MANAGER) {
            void qrOverlay.update();
            return;
        }

        if (!isQrOverlayConfigEvent(event)) {
            return;
        }

        const changedKeys = Array.isArray(event?.payload?.changedKeys) ? event.payload.changedKeys : [];
        if (changedKeys.includes('qrOverlay.enabled')) {
            if (services.getConfig().qrOverlay?.enabled) {
                void qrOverlay.show?.();
                return;
            }

            qrOverlay.hide?.();
            return;
        }

        void qrOverlay.update();
    }, isQrOverlayRefreshEvent);
}

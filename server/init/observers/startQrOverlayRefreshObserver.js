import {
    PUBSUB_EVENT_TOKEN_CHANGED,
    PUBSUB_SERVICE_TOKEN_MANAGER
} from "../../services/pubsub/serviceEventConstants.js";

export function startQrOverlayRefreshObserver(services) {
    if (typeof services.getPubSub !== 'function') {
        return () => {
        };
    }

    const bus = services.getPubSub();
    const qrOverlay = services.getQrOverlay();

    return bus.subscribe(() => void qrOverlay.refresh(), {
        service: PUBSUB_SERVICE_TOKEN_MANAGER,
        type: PUBSUB_EVENT_TOKEN_CHANGED,
    });
}
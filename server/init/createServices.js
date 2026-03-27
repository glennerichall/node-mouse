import {startQrOverlay} from "../overlay/qr-overlay.js";

export async function createServices(instances) {
    const {getEntryUrl: getUrl, robot, tokenManager} = instances;
    const qrOverlay = await startQrOverlay({getUrl, robot});

    let lastToken = tokenManager.getToken();
    const stopTokenOverlaySync = tokenManager.onTokenChanged((nextToken) => {
        if (!nextToken || nextToken === lastToken) {
            return;
        }
        lastToken = nextToken;
        qrOverlay.refresh();
    });

    return {
        ...instances,
        qrOverlay,
        stopTokenOverlaySync,
    };
}

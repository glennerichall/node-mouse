import {startQrOverlay} from "../overlay/qr-overlay.js";

export async function createServices(instances) {
    const {getEntryUrl: getUrl, robot} = instances;
    const qrOverlay = await startQrOverlay({getUrl, robot});

    return {
        ...instances,
        qrOverlay
    };
}
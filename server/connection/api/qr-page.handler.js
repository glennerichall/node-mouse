import QRCode from "qrcode";
import {renderQrPage} from "../../services/overlay/renderQrPage.js";

export function createQrPageHandler(services) {
    return async (_req, res) => {
        try {
            const publicUrl = String(services.getUrls().entryUrl || '');
            const qrDataUrl = await QRCode.toDataURL(publicUrl);
            res.type('html').send(renderQrPage({
                qrDataUrl,
                publicUrl,
            }));
        } catch (_error) {
            res.status(500).type('text/plain').send('QR generation failed');
        }
    }
}

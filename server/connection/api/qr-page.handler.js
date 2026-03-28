import QRCode from "qrcode";
import {renderQrPage} from "../../overlay/renderQrPage.js";

function createQrPageHandler(publicUrl) {
    return async (_req, res) => {
        try {
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
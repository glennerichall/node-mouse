import QRCode from "qrcode";
import {renderQrPage} from "../../services/overlay/renderQrPage.js";

export async function qrPageHandler(req, res) {
    try {
        const publicUrl = String(req.services.getUrls().entryUrl || '');
        const qrDataUrl = await QRCode.toDataURL(publicUrl);
        res.type('html').send(renderQrPage({
            qrDataUrl,
            publicUrl,
        }));
    } catch (_error) {
        res.status(500).type('text/plain').send('QR generation failed');
    }
}

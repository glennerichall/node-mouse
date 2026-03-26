import {parsePreviewFrame} from "./parse-preview-frame.js";
import {drawPreviewFrame} from "./draw.js";

export function createPreviewFrameReceiver({ctx, previewCanvas, previewLabel}) {
    return (meta, payload) => {
        const frame = parsePreviewFrame(meta, payload);
        if (!frame) {
            return;
        }

        drawPreviewFrame({ctx, previewCanvas, previewLabel, frame});
    };
}
export function parsePreviewFrame(meta, payload) {
    if (!meta || !payload) {
        return null;
    }

    const width = Number(meta.width) || 0;
    const height = Number(meta.height) || 0;
    if (width <= 0 || height <= 0) {
        return null;
    }

    const arrayBuffer = payload instanceof ArrayBuffer ? payload : payload.buffer;
    if (!arrayBuffer) {
        return null;
    }

    const rgba = new Uint8ClampedArray(arrayBuffer);
    if (rgba.length < width * height * 4) {
        return null;
    }

    return {
        width,
        height,
        rgba,
        x: Number(meta.x) || 0,
        y: Number(meta.y) || 0,
    };
}
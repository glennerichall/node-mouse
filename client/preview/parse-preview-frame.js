export function parsePreviewFrame(meta, payload) {
    if (!meta || !payload) {
        return null;
    }

    const width = Number(meta.width) || 0;
    const height = Number(meta.height) || 0;
    if (width <= 0 || height <= 0) {
        return null;
    }

    const arrayBuffer = typeof payload.byteLength === 'number' && !payload.buffer
        ? payload
        : payload.buffer;
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
        cursorX: Number(meta.cursorX) || 0,
        cursorY: Number(meta.cursorY) || 0,
        cursorFrameX: Number.isFinite(Number(meta.cursorFrameX))
            ? Number(meta.cursorFrameX)
            : Math.round(width / 2),
        cursorFrameY: Number.isFinite(Number(meta.cursorFrameY))
            ? Number(meta.cursorFrameY)
            : Math.round(height / 2),
    };
}

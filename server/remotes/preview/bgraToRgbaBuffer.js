export function bgraToRgbaBuffer(capture, width, height) {
    const rgba = Buffer.allocUnsafe(width * height * 4);
    const source = capture.image;
    const byteWidth = capture.byteWidth;

    let out = 0;
    for (let row = 0; row < height; row += 1) {
        const rowStart = row * byteWidth;
        for (let col = 0; col < width; col += 1) {
            const i = rowStart + col * 4;
            rgba[out] = source[i + 2];
            rgba[out + 1] = source[i + 1];
            rgba[out + 2] = source[i];
            rgba[out + 3] = 255;
            out += 4;
        }
    }

    return rgba;
}
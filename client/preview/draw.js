function drawCursorOverlay(ctx, width, height, cursorFrameX, cursorFrameY) {
    const cx = Math.round(Number.isFinite(cursorFrameX) ? cursorFrameX : width / 2);
    const cy = Math.round(Number.isFinite(cursorFrameY) ? cursorFrameY : height / 2);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.5;

    // Pointe de curseur simplifiee.
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 11);
    ctx.lineTo(cx - 2, cy + 9);
    ctx.lineTo(cx + 4, cy + 4);
    ctx.lineTo(cx + 7, cy + 10);
    ctx.lineTo(cx + 10, cy + 8);
    ctx.lineTo(cx + 6, cy + 2);
    ctx.lineTo(cx + 12, cy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function readCssPx(name, fallback = 0) {
    const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
}

function getPreviewViewportSize(width, height) {
    const outerEdgePx = 6;
    const previewGapPx = readCssPx('--preview-gap-from-scroll', 8);
    const scrollZoneWidthPx = readCssPx('--scroll-zone-width', 36);
    const scrollZoneEdgeGapPx = readCssPx('--scroll-zone-edge-gap', 10);
    const menuHeightPx = readCssPx('--menu-h', 58);
    const reservedSidePx = scrollZoneWidthPx + scrollZoneEdgeGapPx + previewGapPx + 12;
    const availableWidth = Math.max(48, window.innerWidth - outerEdgePx - reservedSidePx);
    const availableHeight = Math.max(48, window.innerHeight - menuHeightPx - scrollZoneEdgeGapPx - 20);

    return {
        width: Math.min(width, availableWidth),
        height: Math.min(height, availableHeight),
    };
}

export function drawPreviewFrame({ctx, previewCanvas, previewLabel, frame}) {
    const {width, height, rgba, x, y, cursorX, cursorY, cursorFrameX, cursorFrameY} = frame;
    if (previewCanvas.width !== width || previewCanvas.height !== height) {
        previewCanvas.width = width;
        previewCanvas.height = height;
    }

    const viewportSize = getPreviewViewportSize(width, height);
    const offsetX = Math.max(0, Math.round((width - viewportSize.width) / 2));
    const offsetY = Math.max(0, Math.round((height - viewportSize.height) / 2));

    previewCanvas.style.width = `${width}px`;
    previewCanvas.style.height = `${height}px`;
    previewCanvas.style.marginLeft = `${-offsetX}px`;
    previewCanvas.style.marginTop = `${-offsetY}px`;

    const previewRoot = previewCanvas.closest('#cursor-preview');
    if (previewRoot) {
        previewRoot.style.width = `${viewportSize.width}px`;
        previewRoot.style.height = `${viewportSize.height}px`;
    }

    const imageData = new ImageData(rgba, width, height);
    ctx.putImageData(imageData, 0, 0);
    drawCursorOverlay(ctx, width, height, cursorFrameX, cursorFrameY);

    if (previewLabel) {
        const labelX = Number.isFinite(cursorX) ? cursorX : x;
        const labelY = Number.isFinite(cursorY) ? cursorY : y;
        previewLabel.textContent = `(${labelX}, ${labelY})`;
    }
}

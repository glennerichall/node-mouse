export function bindPreviewStream(socket, { previewCanvas, previewLabel }) {
  const ctx = previewCanvas.getContext('2d');

  function drawCursorOverlay(width, height) {
    const cx = Math.round(width / 2);
    const cy = Math.round(height / 2);

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

    // Point de precision.
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(75, 212, 255, 0.95)';
    ctx.fill();
    ctx.restore();
  }

  socket.on('preview:frame', (meta, payload) => {
    if (!meta || !payload) {
      return;
    }

    const width = Number(meta.width) || 0;
    const height = Number(meta.height) || 0;
    if (width <= 0 || height <= 0) {
      return;
    }

    const arrayBuffer = payload instanceof ArrayBuffer ? payload : payload.buffer;
    if (!arrayBuffer) {
      return;
    }

    const rgba = new Uint8ClampedArray(arrayBuffer);
    if (rgba.length < width * height * 4) {
      return;
    }

    if (previewCanvas.width !== width || previewCanvas.height !== height) {
      previewCanvas.width = width;
      previewCanvas.height = height;
    }

    const imageData = new ImageData(rgba, width, height);
    ctx.putImageData(imageData, 0, 0);
    drawCursorOverlay(width, height);

    if (previewLabel) {
      previewLabel.textContent = `(${meta.x}, ${meta.y})`;
    }
  });
}

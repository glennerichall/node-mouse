function drawCursorOverlay(ctx, width, height) {
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
  ctx.restore();
}

function parsePreviewFrame(meta, payload) {
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

export function drawPreviewFrame({ ctx, previewCanvas, previewLabel, frame }) {
  const { width, height, rgba, x, y } = frame;
  if (previewCanvas.width !== width || previewCanvas.height !== height) {
    previewCanvas.width = width;
    previewCanvas.height = height;
  }

  const imageData = new ImageData(rgba, width, height);
  ctx.putImageData(imageData, 0, 0);
  drawCursorOverlay(ctx, width, height);

  if (previewLabel) {
    previewLabel.textContent = `(${x}, ${y})`;
  }
}

export function createPreviewFrameReceiver({ ctx, previewCanvas, previewLabel }) {
  return (meta, payload) => {
    const frame = parsePreviewFrame(meta, payload);
    if (!frame) {
      return;
    }

    drawPreviewFrame({ ctx, previewCanvas, previewLabel, frame });
  };
}

export function bindPreviewStream(socket, { previewCanvas, previewLabel }) {
  if (!previewCanvas) {
    return;
  }

  const ctx = previewCanvas.getContext('2d');
  const onPreviewFrame = createPreviewFrameReceiver({ ctx, previewCanvas, previewLabel });
  socket.on('preview:frame', onPreviewFrame);
}

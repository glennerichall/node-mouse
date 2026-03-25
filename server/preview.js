function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function captureAroundCursor(robot, width, height) {
  const screen = robot.getScreenSize();
  const cursor = robot.getMousePos();

  const x = clamp(Math.round(cursor.x - width / 2), 0, Math.max(0, screen.width - width));
  const y = clamp(Math.round(cursor.y - height / 2), 0, Math.max(0, screen.height - height));

  const capture = robot.screen.capture(x, y, width, height);
  return { capture, x, y };
}

function bgraToRgbaBuffer(capture, width, height) {
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

export function createPreviewStreamer(robot, options = {}) {
  const frameWidth = Number(options.width) || 120;
  const frameHeight = Number(options.height) || 80;
  const fps = Number(options.fps) || 6;
  const intervalMs = Math.max(50, Math.round(1000 / fps));

  function startForSocket(socket) {
    let active = true;

    const timer = setInterval(() => {
      if (!active) {
        return;
      }

      try {
        const { capture, x, y } = captureAroundCursor(robot, frameWidth, frameHeight);
        const frame = bgraToRgbaBuffer(capture, frameWidth, frameHeight);
        socket.emit(
          'preview:frame',
          {
            width: frameWidth,
            height: frameHeight,
            x,
            y,
          },
          frame,
        );
      } catch (_error) {
        // Best effort: ignore frame errors to avoid breaking remote control.
      }
    }, intervalMs);

    const stop = () => {
      if (!active) {
        return;
      }
      active = false;
      clearInterval(timer);
    };

    return { stop };
  }

  return { startForSocket };
}


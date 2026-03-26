import {captureAroundCursor} from "./captureAroundCursor.js";
import {bgraToRgbaBuffer} from "./bgraToRgbaBuffer.js";

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


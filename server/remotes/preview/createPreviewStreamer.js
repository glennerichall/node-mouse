import {captureAroundCursor} from "./captureAroundCursor.js";
import {bgraToRgbaBuffer} from "./bgraToRgbaBuffer.js";
import {DEFAULT_PERSISTED_CONFIG} from '../../services/config/defaultConfig.js';

export function createPreviewStreamer(services) {
  function getPreviewConfig() {
    return {
      ...DEFAULT_PERSISTED_CONFIG.preview,
      ...services.getConfig().preview,
    };
  }

  function startForSocket(socket) {
    let active = true;
    let timer = null;

    function scheduleNextFrame() {
      const previewConfig = getPreviewConfig();
      const fps = Number(previewConfig.fps) || DEFAULT_PERSISTED_CONFIG.preview.fps;
      const intervalMs = Math.max(50, Math.round(1000 / fps));

      timer = setTimeout(async () => {
        if (!active) {
          return;
        }

        try {
          const robot = services.getRobot();
          const currentPreviewConfig = getPreviewConfig();
          const frameWidth = Number(currentPreviewConfig.width) || DEFAULT_PERSISTED_CONFIG.preview.width;
          const frameHeight = Number(currentPreviewConfig.height) || DEFAULT_PERSISTED_CONFIG.preview.height;
          const screen = await services.getSystem().getScreenInfo();
          if (!screen) {
            throw new Error('Screen size unavailable');
          }
          const {
            capture,
            x,
            y,
            cursorX,
            cursorY,
            cursorFrameX,
            cursorFrameY,
          } = captureAroundCursor(robot, frameWidth, frameHeight, screen);
          const frame = bgraToRgbaBuffer(capture, frameWidth, frameHeight);
          socket.emit(
            'preview:frame',
            {
              width: frameWidth,
              height: frameHeight,
              x,
              y,
              cursorX,
              cursorY,
              cursorFrameX,
              cursorFrameY,
            },
            frame,
          );
        } catch (_error) {
          // Best effort: ignore frame errors to avoid breaking remote control.
        }

        scheduleNextFrame();
      }, intervalMs);
    }

    scheduleNextFrame();

    const stop = () => {
      if (!active) {
        return;
      }
      active = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    return { stop };
  }

  return { startForSocket };
}

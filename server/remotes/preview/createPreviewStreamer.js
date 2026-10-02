import {captureAroundCursor} from "./captureAroundCursor.js";
import {bgraToRgbaBuffer} from "./bgraToRgbaBuffer.js";
import {DEFAULT_PERSISTED_CONFIG} from '../../services/config/defaultConfig.js';
import {isScreenCaptureAvailable} from './isScreenCaptureAvailable.js';

export function createPreviewStreamer(services, runtime = {}) {
  function isAvailable() {
    return isScreenCaptureAvailable(runtime);
  }

  function getPreviewConfig() {
    return {
      ...DEFAULT_PERSISTED_CONFIG.preview,
      ...services.getConfig().preview,
    };
  }

  function startForSocket(socket) {
    if (!isAvailable()) {
      return {stop() {}};
    }

    let active = true;
    let timer = null;

    function scheduleNextFrame() {
      if (!active || !socket.connected) {
        return;
      }

      const previewConfig = getPreviewConfig();
      const fps = Number(previewConfig.fps) || DEFAULT_PERSISTED_CONFIG.preview.fps;
      const intervalMs = Math.max(50, Math.round(1000 / fps));

      timer = setTimeout(async () => {
        timer = null;
        if (!active || !socket.connected) {
          return;
        }

        if (!socket.conn.transport.writable) {
          scheduleNextFrame();
          return;
        }

        try {
          const desktopController = services.getDesktopController();
          const currentPreviewConfig = getPreviewConfig();
          const frameWidth = Number(currentPreviewConfig.width) || DEFAULT_PERSISTED_CONFIG.preview.width;
          const frameHeight = Number(currentPreviewConfig.height) || DEFAULT_PERSISTED_CONFIG.preview.height;
          const screen = await services.getSystem().getScreenInfo();
          if (!active || !socket.connected) {
            return;
          }
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
          } = captureAroundCursor(desktopController, frameWidth, frameHeight, screen);
          const frame = bgraToRgbaBuffer(capture, frameWidth, frameHeight);
          socket.volatile.emit(
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

  return {isAvailable, startForSocket};
}

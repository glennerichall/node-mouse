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
      const maxFps = Math.max(
        1,
        Number(previewConfig.maxFps) || DEFAULT_PERSISTED_CONFIG.preview.maxFps,
      );
      const fps = Math.min(
        maxFps,
        Math.max(1, Number(previewConfig.fps) || DEFAULT_PERSISTED_CONFIG.preview.fps),
      );
      const intervalMs = Math.max(1, Math.round(1000 / fps));

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
          const screen = await services.getSystem().getScreenInfo();
          if (!active || !socket.connected) {
            return;
          }
          if (!screen) {
            throw new Error('Screen size unavailable');
          }
          const frameWidth = Math.min(
            Math.max(1, Number(currentPreviewConfig.width) || DEFAULT_PERSISTED_CONFIG.preview.width),
            Math.max(1, Number(screen.width) || 1),
          );
          const frameHeight = Math.min(
            Math.max(1, Number(currentPreviewConfig.height) || DEFAULT_PERSISTED_CONFIG.preview.height),
            Math.max(1, Number(screen.height) || 1),
          );
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
            'preview/frame',
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

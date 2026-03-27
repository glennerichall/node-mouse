import {createPreviewFrameReceiver} from "./create-preview-frame-receiver.js";
import {emitWithTimestamp} from "../core/socket-emit.js";

export function bindPreviewStream(socket, { previewCanvas, previewLabel }) {
  if (!previewCanvas) {
    return {
      onMouseMoveActivity: () => {},
    };
  }

  const ctx = previewCanvas.getContext('2d');
  const onPreviewFrame = createPreviewFrameReceiver({ ctx, previewCanvas, previewLabel });
  const previewRoot = previewCanvas.closest('#cursor-preview');
  const inactivityDelayMs = 10_000;
  let isPreviewActive = false;
  let stopTimer = null;

  const showPreview = () => {
    if (previewRoot) {
      previewRoot.classList.add('is-visible');
    }
  };

  const hidePreview = () => {
    if (previewRoot) {
      previewRoot.classList.remove('is-visible');
    }
  };

  const clearStopTimer = () => {
    if (stopTimer) {
      clearTimeout(stopTimer);
      stopTimer = null;
    }
  };

  const stopPreview = () => {
    clearStopTimer();
    if (isPreviewActive) {
      emitWithTimestamp(socket, 'preview:stop');
      isPreviewActive = false;
    }
    hidePreview();
  };

  const armInactivityStop = () => {
    clearStopTimer();
    stopTimer = setTimeout(() => {
      stopPreview();
    }, inactivityDelayMs);
  };

  const startPreview = () => {
    if (!socket.connected) {
      return;
    }
    if (!isPreviewActive) {
      emitWithTimestamp(socket, 'preview:start');
      isPreviewActive = true;
      showPreview();
    }
    armInactivityStop();
  };

  const onMouseMoveActivity = () => {
    startPreview();
  };

  socket.on('preview:frame', onPreviewFrame);
  socket.on('disconnect', stopPreview);
  window.addEventListener('beforeunload', stopPreview);

  hidePreview();

  return {
    onMouseMoveActivity,
  };
}

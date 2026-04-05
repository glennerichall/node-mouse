import {createPreviewFrameReceiver} from "./create-preview-frame-receiver.js";
import {emitWithTimestamp} from "../core/socket-emit.js";
import { getClientPreviewConfig, onClientConfigChange } from '../config/client-config.js';
import {
  REMOTE_EVENT_PREVIEW_START,
  REMOTE_EVENT_PREVIEW_STOP,
} from '../../utils/shared/remoteCommands.js';

export function bindPreviewStream(socket, { previewCanvas, previewLabel }) {
  if (!previewCanvas) {
    return {
      onMouseMoveActivity: () => {},
    };
  }

  const ctx = previewCanvas.getContext('2d');
  const onPreviewFrame = createPreviewFrameReceiver({ ctx, previewCanvas, previewLabel });
  const previewRoot = previewCanvas.closest('#cursor-preview');
  let isPreviewActive = false;
  let stopTimer = null;

  const getInactivityDelayMs = () => {
    const configuredDelay = Number(getClientPreviewConfig()?.hideDelayMs);
    if (Number.isFinite(configuredDelay) && configuredDelay >= 200) {
      return configuredDelay;
    }
    return 10_000;
  };

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
      emitWithTimestamp(socket, REMOTE_EVENT_PREVIEW_STOP);
      isPreviewActive = false;
    }
    hidePreview();
  };

  const armInactivityStop = () => {
    clearStopTimer();
    stopTimer = setTimeout(() => {
      stopPreview();
    }, getInactivityDelayMs());
  };

  const startPreview = () => {
    if (!socket.connected) {
      return;
    }
    if (!isPreviewActive) {
      emitWithTimestamp(socket, REMOTE_EVENT_PREVIEW_START);
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
  onClientConfigChange(() => {
    if (isPreviewActive) {
      armInactivityStop();
    }
  });

  hidePreview();

  return {
    onMouseMoveActivity,
  };
}

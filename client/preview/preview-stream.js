import {createPreviewFrameReceiver} from "./create-preview-frame-receiver.js";
import {emitWithTimestamp} from "../core/socket-emit.js";
import {
  REMOTE_EVENT_PREVIEW_START,
  REMOTE_EVENT_PREVIEW_STOP,
} from '../../utils/shared/remoteCommands.js';

export function bindPreviewStream(socket, { previewCanvas, previewLabel }, {clientConfig, getConfigView, preferenceView}) {
  if (!previewCanvas) {
    return {
      onMouseMoveActivity: () => {},
      setKeyboardPreviewActive: () => {},
    };
  }

  const ctx = previewCanvas.getContext('2d');
  const onPreviewFrame = createPreviewFrameReceiver({ ctx, previewCanvas, previewLabel });
  const previewRoot = previewCanvas.closest('#cursor-preview');
  let isPreviewActive = false;
  let stopTimer = null;
  let keyboardPreviewActive = false;

  const isPreviewEnabled = () =>
    getConfigView().getPreviewConfig().enabled !== false && preferenceView.getRemoteVisibility('preview', true);

  const getInactivityDelayMs = () => {
    const configuredDelay = Number(getConfigView().getPreviewConfig()?.hideDelayMs);
    if (Number.isFinite(configuredDelay) && configuredDelay >= 200) {
      return configuredDelay;
    }
    return 10_000;
  };

  const showPreview = () => {
    if (!isPreviewEnabled()) {
      return;
    }
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
    if (keyboardPreviewActive) {
      return;
    }
    if (isPreviewActive) {
      emitWithTimestamp(socket, REMOTE_EVENT_PREVIEW_STOP);
      isPreviewActive = false;
    }
    hidePreview();
  };

  const armInactivityStop = () => {
    if (keyboardPreviewActive) {
      return;
    }
    clearStopTimer();
    stopTimer = setTimeout(() => {
      stopPreview();
    }, getInactivityDelayMs());
  };

  const startPreview = () => {
    if (!isPreviewEnabled()) {
      stopPreview();
      return;
    }
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

  const setKeyboardPreviewActive = (active) => {
    keyboardPreviewActive = active;

    if (active) {
      startPreview();
      clearStopTimer();
      return;
    }

    armInactivityStop();
  };

  socket.on('preview:frame', onPreviewFrame);
  socket.on('disconnect', stopPreview);
  window.addEventListener('beforeunload', stopPreview);
  clientConfig.onChange(() => {
    if (!isPreviewEnabled()) {
      stopPreview();
      return;
    }

    if (isPreviewActive) {
      armInactivityStop();
    }
  });
  preferenceView.onRemoteVisibilityChange(() => {
    if (!isPreviewEnabled()) {
      stopPreview();
      return;
    }

    if (keyboardPreviewActive || isPreviewActive) {
      showPreview();
      armInactivityStop();
    }
  });

  hidePreview();

  return {
    onMouseMoveActivity,
    setKeyboardPreviewActive,
  };
}

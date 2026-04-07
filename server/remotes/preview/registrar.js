import {
  REMOTE_EVENT_PREVIEW_START,
  REMOTE_EVENT_PREVIEW_STOP,
} from '../../../utils/shared/remoteCommands.js';

export function createPreviewEventRegistrar({ preview, getConfig = () => ({}) }) {
  return function registerPreviewEvents(socket) {
    let previewSession = null;

    function startPreview() {
      if (getConfig()?.preview?.enabled === false) {
        stopPreview();
        return;
      }

      if (previewSession) {
        return;
      }
      previewSession = preview.startForSocket(socket);
    }

    function stopPreview() {
      if (!previewSession) {
        return;
      }
      previewSession.stop();
      previewSession = null;
    }

    socket.on(REMOTE_EVENT_PREVIEW_START, startPreview);
    socket.on(REMOTE_EVENT_PREVIEW_STOP, stopPreview);
    socket.on('disconnect', stopPreview);
  };
}

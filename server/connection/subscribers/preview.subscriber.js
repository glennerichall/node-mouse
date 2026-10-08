import {
  REMOTE_EVENT_PREVIEW_START,
  REMOTE_EVENT_PREVIEW_STOP,
} from '../../../utils/remoteCommands.js';

export function createPreviewEventSubscriber({ preview, getConfig = () => ({}) }) {
  return function subscribePreview(channel) {
    let previewSession = null;

    function startPreview() {
      if (getConfig()?.preview?.enabled === false || preview.isAvailable?.() === false) {
        stopPreview();
        return;
      }

      if (previewSession) {
        return;
      }
      previewSession = preview.startForSocket(channel);
    }

    function stopPreview() {
      if (!previewSession) {
        return;
      }
      previewSession.stop();
      previewSession = null;
    }

    channel.on(REMOTE_EVENT_PREVIEW_START, startPreview);
    channel.on(REMOTE_EVENT_PREVIEW_STOP, stopPreview);
    channel.on('disconnect', stopPreview);
  };
}

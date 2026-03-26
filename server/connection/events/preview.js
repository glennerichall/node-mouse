export function createPreviewEventRegister({ preview }) {
  return function registerPreviewEvents(socket) {
    let previewSession = null;

    function startPreview() {
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

    socket.on('preview:start', startPreview);
    socket.on('preview:stop', stopPreview);
    socket.on('disconnect', stopPreview);
  };
}

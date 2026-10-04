import {access} from 'node:fs/promises';
import {
  createXWaylandOverlayClient,
  getXWaylandOverlayHelperPath,
} from './createXWaylandOverlayClient.js';

export function createLinuxQrOverlayAdapter(dependencies = {}) {
  const helperPath = dependencies.helperPath || getXWaylandOverlayHelperPath();
  const createClient = dependencies.createClient || createXWaylandOverlayClient;
  const accessFile = dependencies.access || access;

  return {
    managesHover: true,
    async isAvailable() {
      try {
        await accessFile(helperPath);
        return true;
      } catch {
        return false;
      }
    },
    getBounds({screen, size, config}) {
      return {
        x: Math.max(0, screen.width - size - config.margin),
        y: Math.max(0, config.margin + config.topOffsetPx),
        width: size,
        height: size,
      };
    },
    refresh(handle, context) {
      if (!handle || handle.getState() === 'closed') {
        const client = createClient(context, {helperPath});
        client.process?.once?.('error', context.onError);
        return client;
      }
      handle.update(context);
      return handle;
    },
    show: (handle) => handle?.show(),
    hide: (handle) => handle?.hide(),
    close: (handle) => handle?.close(),
    isSuppressed: (handle) => handle?.getState() === 'hover-hidden',
    unavailableMessage: 'Overlay QR natif indisponible; exécutez npm run build:xwayland-overlay',
  };
}

import {access} from 'node:fs/promises';
import {
  createXWaylandOverlayClient,
  getXWaylandOverlayHelperPath,
} from './createXWaylandOverlayClient.js';

export function createLinuxQrOverlayAdapter(dependencies = {}) {
  const helperPath = dependencies.helperPath || getXWaylandOverlayHelperPath();
  const createClient = dependencies.createClient || createXWaylandOverlayClient;
  const accessFile = dependencies.access || access;

  function startClient(context) {
    const client = createClient(context, {helperPath});
    client.process?.once?.('error', context.onError);
    return client;
  }

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
    async refresh(handle, context) {
      if (!handle || handle.getState() === 'closed') {
        return startClient(context);
      }
      if (await handle.update(context) === false) {
        handle.close?.();
        return startClient(context);
      }
      return handle;
    },
    show: async (handle) => handle?.show(),
    hide: async (handle) => handle?.hide(),
    close: (handle) => handle?.close(),
    isSuppressed: (handle) => handle?.getState() === 'hover-hidden',
    unavailableMessage: 'Native QR overlay unavailable; run npm run build:xwayland-overlay',
  };
}

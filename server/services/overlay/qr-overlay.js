import os from 'node:os';
import {createLogger} from '../log/logger.js';
import {createQrOverlayYad} from './qr-overlay-yad.js';
import {createQrOverlayWin32} from './qr-overlay-win32.js';

const getLogger = () => createLogger('qr-overlay');

function createNoopOverlay() {
  return {
    close: () => {},
    show: async () => false,
    hide: () => false,
    update: async () => {},
    setSuppressed: () => false,
    toggle: async () => false,
    isVisible: () => false,
    isSuppressed: () => false,
    getBounds: () => null,
  };
}

export async function createQrOverlay(services) {
  const platform = os.platform();

  if (platform === 'linux') {
    return createQrOverlayYad(services);
  }

  if (platform === 'win32') {
    return createQrOverlayWin32(services);
  }

  getLogger().info({ platform }, 'QR overlay non supporté sur cette plateforme');
  return createNoopOverlay();
}

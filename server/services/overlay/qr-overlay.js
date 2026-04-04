import os from 'node:os';
import {createLogger} from '../log/logger.js';
import {createQrOverlayYad} from './qr-overlay-yad.js';
import {createQrOverlayWin32} from './qr-overlay-win32.js';

const log = createLogger('qr-overlay');

function createNoopOverlay() {
  return {
    close: () => {},
    show: async () => false,
    hide: () => false,
    update: async () => {},
    toggle: async () => false,
    isVisible: () => false,
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

  log.info({ platform }, 'QR overlay non supporté sur cette plateforme');
  return createNoopOverlay();
}

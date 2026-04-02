import os from 'node:os';
import {createLogger} from '../log/logger.js';
import {startQrOverlayYad} from './qr-overlay-yad.js';
import {startQrOverlayWin32} from './qr-overlay-win32.js';

const log = createLogger('qr-overlay');

function createNoopOverlay() {
  return {
    close: () => {},
    refresh: async () => {},
    show: async () => false,
    hide: () => false,
    toggle: async () => false,
    isVisible: () => false,
  };
}

export async function startQrOverlay(params) {
  const platform = os.platform();

  if (platform === 'linux') {
    return startQrOverlayYad(params);
  }

  if (platform === 'win32') {
    return startQrOverlayWin32(params);
  }

  log.info({ platform }, 'QR overlay non supporté sur cette plateforme');
  return createNoopOverlay();
}

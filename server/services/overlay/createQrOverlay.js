import os from 'node:os';
import {createLogger} from '../log/logger.js';
import {createNoopOverlay} from './createNoopOverlay.js';
import {createQrOverlayYad} from './createQrOverlayYad.js';
import {createQrOverlayWin32} from './createQrOverlayWin32.js';

const getLogger = () => createLogger('qr-overlay');

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

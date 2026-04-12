import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';
import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';
import {createLogger} from '../../application/logger.js';
import {createNoopOverlay} from './createNoopOverlay.js';
import {
  buildQrOverlayPowerShellScript,
  spawnPowerShellFile,
} from '../os/platforms/win32/overlay.js';

export async function createQrOverlayWin32(services) {
  const getUrl = () => services.getUrls().entryUrl;
  const getConfig = () => services.getConfig();
  const getLogger = ()=> createLogger('qr-overlay:win32');
  
  const robot = services.getRobot();

  function getOverlayContext() {
    const config = getConfig?.() || {};
    const qrOverlayConfig = {
      ...DEFAULT_PERSISTED_CONFIG.qrOverlay,
      ...config.qrOverlay,
    };
    return {
      qrOverlayConfig,
      startsVisible: Boolean(qrOverlayConfig.enabled),
      isSupported: os.platform() === 'win32',
    };
  }

  if (!getOverlayContext().isSupported) {
    return createNoopOverlay();
  }

  const qrPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.png');
  const scriptPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.ps1');
  let child = null;
  let refreshChain = Promise.resolve();
  let visible = getOverlayContext().startsVisible;
  let suppressed = false;
  let overlayBounds = null;

  const close = () => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
    child = null;
  };

  async function spawnOverlay() {
    const {qrOverlayConfig, isSupported} = getOverlayContext();
    if (!isSupported) {
      return;
    }

    const size = qrOverlayConfig.size;
    const margin = qrOverlayConfig.margin;
    await QRCode.toFile(qrPath, getUrl(), { width: size, margin: 1 });

    const screen = robot.getScreenSize();
    const posX = Math.max(0, screen.width - size - margin);
    const posY = Math.max(0, margin);
    overlayBounds = {
      x: posX,
      y: posY,
      width: size,
      height: size,
    };

    fs.writeFileSync(
      scriptPath,
      buildQrOverlayPowerShellScript({qrPath, size, posX, posY}),
      'utf8',
    );

    child = spawnPowerShellFile(scriptPath);
    child.once('error', (error) => {
      getLogger().warn({ err: error }, 'Impossible de lancer PowerShell pour QR overlay');
    });
    getLogger().debug({ url: getUrl() }, 'QR overlay Windows rafraîchi');
  }

  const update = async () => {
    if (!visible || suppressed || !getOverlayContext().isSupported) {
      return;
    }

    refreshChain = refreshChain
      .then(async () => {
        close();
        await spawnOverlay();
      })
      .catch((_error) => {});

    await refreshChain;
  };

  const hide = () => {
    visible = false;
    close();
    return visible;
  };

  const show = async () => {
    if (!getOverlayContext().isSupported) {
      visible = false;
      return visible;
    }
    visible = true;
    await update();
    return visible;
  };

  const setSuppressed = (nextSuppressed) => {
    const normalized = Boolean(nextSuppressed);
    if (suppressed === normalized) {
      return suppressed;
    }

    suppressed = normalized;
    if (suppressed) {
      close();
      return suppressed;
    }

    void update();
    return suppressed;
  };

  const toggle = async () => {
    if (visible) {
      hide();
      return visible;
    }
    await show();
    return visible;
  };

  return {
    close,
    show,
    hide,
    update,
    setSuppressed,
    toggle,
    isVisible: () => visible,
    isSuppressed: () => suppressed,
    getBounds: () => overlayBounds,
  };
}

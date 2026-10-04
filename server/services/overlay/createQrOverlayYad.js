import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {readFile, unlink} from 'node:fs/promises';
import QRCode from 'qrcode';
import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';
import {createLogger} from '../../application/logger.js';
import {createNoopOverlay} from './createNoopOverlay.js';
import {commandExists} from '../../os/linux/process.js';
import {loadXWaylandWindowController} from '../../os/linux/wayland/loadXWaylandWindowController.js';

let log;
function getModuleLog() {
  log ??= createLogger('qr-overlay:yad');
  return log;
}

export function isWaylandSession(env = process.env) {
  return String(env.XDG_SESSION_TYPE || '').toLowerCase() === 'wayland'
    || Boolean(env.WAYLAND_DISPLAY);
}

export function buildQrOverlayYadArgs({qrPath, size, posX, posY, xidPath = ''}) {
  return [
    '--picture',
    '--class=remote-mouse-qr-overlay',
    '--undecorated',
    '--skip-taskbar',
    '--sticky',
    '--on-top',
    '--no-buttons',
    '--fixed',
    '--borders=0',
    `--width=${size}`,
    `--height=${size}`,
    `--posx=${posX}`,
    `--posy=${posY}`,
    '--size=fit',
    `--filename=${qrPath}`,
    ...(xidPath ? [`--print-xid=${xidPath}`] : []),
  ];
}

export function buildQrOverlayYadSpawnOptions(env = process.env) {
  const isWayland = isWaylandSession(env);

  return {
    stdio: 'ignore',
    env: isWayland
      ? {...env, GDK_BACKEND: 'x11'}
      : env,
  };
}

export function parseYadWindowId(output) {
  const match = String(output || '').match(/(?:0x)?([0-9a-f]+)/i);
  if (!match) {
    return '';
  }
  const base = /^0x/i.test(match[0]) ? 16 : 10;
  const numericId = Number.parseInt(match[1], base);
  return Number.isSafeInteger(numericId) && numericId > 0
    ? `0x${numericId.toString(16)}`
    : '';
}

export function shouldKeepQrOverlayProcessOnSuppression(env = process.env) {
  return isWaylandSession(env);
}

async function waitForYadWindowId(xidPath, attempts = 20) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const windowId = parseYadWindowId(await readFile(xidPath, 'utf8'));
      if (windowId) {
        return windowId;
      }
    } catch (_error) {}
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return '';
}

export async function createQrOverlayYad(services) {
  const log = getModuleLog();
  const getUrl = () => services.getUrls().entryUrl;
  const getConfig = () => services.getConfig();
  const getSystemConfig = () => services.getSystemConfig();

  function getOverlayContext() {
    const config = getConfig?.() || {};
    const systemConfig = getSystemConfig?.() || {};
    const qrOverlayConfig = {
      ...DEFAULT_PERSISTED_CONFIG.qrOverlay,
      ...config.qrOverlay,
    };

    return {
      qrOverlayConfig,
      startsVisible: Boolean(qrOverlayConfig.enabled),
      isSupported: os.platform() === 'linux'
        && Boolean(systemConfig.graphicalDisplay),
    };
  }

  if (!getOverlayContext().isSupported) {
    return createNoopOverlay();
  }

  const hasYad = await commandExists('yad');
  if (!hasYad) {
    log.warn('Overlay QR non lancé: "yad" est introuvable.');
    return createNoopOverlay();
  }

  const qrPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.png');
  const xidPath = path.join(os.tmpdir(), `remote-mouse-qr-overlay-${process.pid}.xid`);
  let child = null;
  let refreshChain = Promise.resolve();
  let visible = getOverlayContext().startsVisible;
  let suppressed = false;
  let overlayBounds = null;
  let childWindowId = '';
  const useXWaylandWindowState = shouldKeepQrOverlayProcessOnSuppression();
  const xWaylandWindow = useXWaylandWindowState
    ? loadXWaylandWindowController()
    : null;

  const close = () => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
    child = null;
    childWindowId = '';
    void unlink(xidPath).catch(() => {});
  };

  const setChildSuppressed = (nextSuppressed) => {
    if (!childWindowId || !xWaylandWindow) {
      return false;
    }
    const changed = xWaylandWindow.setVisible(
      Number.parseInt(childWindowId, 16),
      !nextSuppressed,
    );
    if (!changed) {
      log.warn({windowId: childWindowId}, 'Impossible de changer la visibilité de l’overlay QR');
    }
    return changed;
  };

  async function spawnOverlay() {
    const {qrOverlayConfig, isSupported} = getOverlayContext();
    if (!isSupported) {
      return;
    }

    const size = qrOverlayConfig.size;
    const margin = qrOverlayConfig.margin;
    const topBarOffset = qrOverlayConfig.topOffsetPx;
    await QRCode.toFile(qrPath, getUrl(), { width: size, margin: 1 });

    const screen = await services.getSystem().getScreenInfo() || {width: size + margin, height: size + margin};
    const posX = Math.max(0, screen.width - size - margin);
    const posY = Math.max(0, margin + topBarOffset);
    overlayBounds = {
      x: posX,
      y: posY,
      width: size,
      height: size,
    };

    if (useXWaylandWindowState) {
      await unlink(xidPath).catch(() => {});
    }
    const args = buildQrOverlayYadArgs({
      qrPath,
      size,
      posX,
      posY,
      xidPath: useXWaylandWindowState ? xidPath : '',
    });

    child = spawn('yad', args, buildQrOverlayYadSpawnOptions());
    const spawnedChild = child;
    if (useXWaylandWindowState) {
      void waitForYadWindowId(xidPath).then((windowId) => {
        if (child !== spawnedChild) {
          return;
        }
        childWindowId = windowId;
        if (childWindowId && suppressed) {
          setChildSuppressed(true);
        }
      });
    }
    child.once('error', (error) => {
      log.warn({err: error}, 'Impossible de lancer YAD pour l’overlay QR');
      child = null;
    });
    log.debug({ url: getUrl() }, 'QR overlay rafraîchi');
  }

  const update = async () => {
    if (!visible || suppressed || !getOverlayContext().isSupported) {
      return;
    }

    const previousRefresh = refreshChain;
    refreshChain = (async () => {
      try {
        await previousRefresh;
        close();
        await spawnOverlay();
      } catch (_error) {}
    })();

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
      if (useXWaylandWindowState) {
        setChildSuppressed(true);
      } else {
        close();
      }
      return suppressed;
    }

    if (useXWaylandWindowState && child) {
      setChildSuppressed(false);
    } else {
      void update();
    }
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

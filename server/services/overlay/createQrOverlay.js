import os from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';
import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';
import {createLogger} from '../../application/logger.js';
import {createNoopOverlay} from './createNoopOverlay.js';

export async function createQrOverlay(services, dependencies = {}) {
  const adapter = dependencies.adapter || services.getOs()?.overlay;
  const log = dependencies.log || createLogger('qr-overlay');
  if (!adapter || !await adapter.isAvailable()) {
    if (adapter?.unavailableMessage) log.warn(adapter.unavailableMessage);
    return createNoopOverlay();
  }

  const qrPath = dependencies.qrPath
    || path.join(os.tmpdir(), `remote-mouse-qr-overlay-${process.pid}.png`);
  const writeQr = dependencies.writeQr || QRCode.toFile;
  let handle = null;
  let visible = Boolean(services.getConfig()?.qrOverlay?.enabled);
  let suppressed = false;
  let bounds = null;
  let operation = Promise.resolve();

  function getConfig() {
    return {
      ...DEFAULT_PERSISTED_CONFIG.qrOverlay,
      ...services.getConfig()?.qrOverlay,
    };
  }

  async function prepareContext() {
    const config = getConfig();
    const size = config.size;
    const screen = await services.getSystem().getScreenInfo()
      || {width: size + config.margin, height: size + config.margin};
    bounds = adapter.getBounds({screen, size, config});
    await writeQr(qrPath, services.getUrls().entryUrl, {width: size, margin: 1});
    return {
      qrPath,
      x: bounds.x,
      y: bounds.y,
      size,
      showDelayMs: config.hoverShowDelayMs,
      autoHide: config.autoHideOnHover,
      onError: (error) => log.warn({err: error}, 'Failed to start QR overlay'),
    };
  }

  async function updateNow() {
    if (!visible || suppressed) return;
    handle = await adapter.refresh(handle, await prepareContext());
  }

  function queue(action) {
    operation = operation.then(action, action);
    return operation;
  }

  function close() {
    adapter.close(handle);
    handle = null;
  }

  function hideNow() {
    visible = false;
    adapter.hide(handle);
    return false;
  }

  async function showNow() {
    visible = true;
    await updateNow();
    adapter.show(handle);
    return true;
  }

  function hide() {
    return queue(hideNow);
  }

  function show() {
    return queue(showNow);
  }

  function setSuppressed(nextSuppressed) {
    if (adapter.managesHover) return adapter.isSuppressed(handle);
    const normalized = Boolean(nextSuppressed);
    if (suppressed === normalized) return suppressed;
    suppressed = normalized;
    if (suppressed) adapter.hide(handle);
    else void queue(updateNow);
    return suppressed;
  }

  async function toggle() {
    return queue(() => {
      const hiddenByHover = adapter.managesHover && adapter.isSuppressed(handle);
      if (visible && !hiddenByHover) return hideNow();
      return showNow();
    });
  }

  return {
    close,
    show,
    hide,
    update: () => queue(updateNow),
    setSuppressed,
    toggle,
    isVisible: () => visible,
    isSuppressed: () => adapter.managesHover ? adapter.isSuppressed(handle) : suppressed,
    getBounds: () => bounds,
    managesHover: adapter.managesHover,
  };
}

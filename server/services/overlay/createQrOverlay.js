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
  let closed = false;
  let suppressed = false;
  let bounds = null;
  let operation = Promise.resolve();
  let toggleOperation = null;
  let pendingToggleCount = 0;

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
    if (closed || !visible || suppressed) return;
    const context = await prepareContext();
    if (closed) return;
    handle = await adapter.refresh(handle, context);
    if (closed) {
      adapter.close(handle);
      handle = null;
    }
  }

  function queue(action) {
    operation = operation.then(action, action);
    return operation;
  }

  function close() {
    closed = true;
    adapter.close(handle);
    handle = null;
  }

  async function hideNow() {
    if (closed) return false;
    visible = false;
    await adapter.hide(handle);
    return false;
  }

  async function showNow() {
    if (closed) return false;
    visible = true;
    if (!suppressed) {
      const context = await prepareContext();
      if (closed) return false;
      handle = await adapter.refresh(handle, context);
      if (closed) {
        adapter.close(handle);
        handle = null;
        return false;
      }
      const shown = await adapter.show(handle);
      if (closed) return false;
      if (shown === false) {
        adapter.close(handle);
        handle = await adapter.refresh(null, context);
        if (closed) {
          adapter.close(handle);
          handle = null;
          return false;
        }
        const retriedShow = await adapter.show(handle);
        if (closed) return false;
        if (retriedShow === false) {
          adapter.close(handle);
          handle = null;
          visible = false;
          log.warn('QR overlay helper rejected the show command twice');
          return false;
        }
      }
    }
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

  function scheduleToggleDrain() {
    if (!toggleOperation) {
      toggleOperation = queue(async () => {
        while (pendingToggleCount > 0 && !closed) {
          const count = pendingToggleCount;
          pendingToggleCount = 0;
          const hiddenByHover = adapter.managesHover && adapter.isSuppressed(handle);
          const currentlyVisible = visible && !hiddenByHover;
          const shouldBeVisible = count % 2 === 0
            ? currentlyVisible
            : !currentlyVisible;
          if (shouldBeVisible) await showNow();
          else await hideNow();
        }
        return visible;
      }).finally(() => {
        toggleOperation = null;
        if (pendingToggleCount > 0 && !closed) scheduleToggleDrain();
      });
    }
    return toggleOperation;
  }

  function toggle() {
    if (closed) return false;
    pendingToggleCount += 1;
    return scheduleToggleDrain();
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

function expandBounds(bounds, marginPx) {
  return {
    x: bounds.x - marginPx,
    y: bounds.y - marginPx,
    width: bounds.width + (marginPx * 2),
    height: bounds.height + (marginPx * 2),
  };
}

function shrinkBounds(bounds, marginPx) {
  const width = Math.max(1, bounds.width - (marginPx * 2));
  const height = Math.max(1, bounds.height - (marginPx * 2));
  return {
    x: bounds.x + marginPx,
    y: bounds.y + marginPx,
    width,
    height,
  };
}

function isPointInsideBounds(point, bounds) {
  if (!point || !bounds) {
    return false;
  }

  return point.x >= bounds.x
    && point.x <= (bounds.x + bounds.width)
    && point.y >= bounds.y
    && point.y <= (bounds.y + bounds.height);
}

export function startQrOverlayHoverObserver(services) {
  const robot = services.getRobot();
  const qrOverlay = services.getQrOverlay();
  let suppressedAt = 0;

  if (!robot?.getMousePos || !qrOverlay?.getBounds || !qrOverlay?.setSuppressed) {
    return () => {};
  }

  const timer = setInterval(() => {
    const overlayConfig = services.getConfig()?.qrOverlay || {};
    if (!overlayConfig.autoHideOnHover) {
      qrOverlay.setSuppressed(false);
      return;
    }

    if (!qrOverlay.isVisible?.()) {
      qrOverlay.setSuppressed(false);
      return;
    }

    const bounds = qrOverlay.getBounds();
    if (!bounds) {
      qrOverlay.setSuppressed(false);
      return;
    }

    const cursor = robot.getMousePos();
    const entryMarginPx = Math.max(0, Number(overlayConfig.hoverEntryMarginPx) || 10);
    const exitMarginPx = Math.max(0, Number(overlayConfig.hoverExitMarginPx) || 18);
    const showDelayMs = Math.max(0, Number(overlayConfig.hoverShowDelayMs) || 1200);
    const isSuppressed = qrOverlay.isSuppressed?.();

    let nextSuppressed = false;
    if (isSuppressed) {
      const stillInsideExitZone = isPointInsideBounds(cursor, expandBounds(bounds, exitMarginPx));
      const delayElapsed = (Date.now() - suppressedAt) >= showDelayMs;
      nextSuppressed = stillInsideExitZone || !delayElapsed;
    } else {
      nextSuppressed = isPointInsideBounds(cursor, shrinkBounds(bounds, entryMarginPx));
    }

    if (nextSuppressed && !isSuppressed) {
      suppressedAt = Date.now();
    }

    if (!nextSuppressed) {
      suppressedAt = 0;
    }

    qrOverlay.setSuppressed(nextSuppressed);
  }, 80);

  return () => {
    clearInterval(timer);
    qrOverlay.setSuppressed(false);
  };
}

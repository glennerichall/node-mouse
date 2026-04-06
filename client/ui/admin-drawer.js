const EDGE_START_PX = 46;
const PANEL_CLOSE_EDGE_PX = 46;
const SWIPE_OPEN_PX = 64;
const SWIPE_CLOSE_PX = 54;
const MAX_VERTICAL_DRIFT_PX = 44;

export function bindAdminDrawer({ app, touchpad, scrim, adminPanel }) {
  if (!app || !touchpad) {
    return;
  }

  let gesture = null;

  function openDrawer() {
    app.classList.add('admin-drawer-open');
  }

  function closeDrawer() {
    app.classList.remove('admin-drawer-open');
  }

  function onTouchStart(event) {
    if (event.touches.length !== 1) {
      gesture = null;
      return;
    }

    const t = event.touches[0];
    const rect = touchpad.getBoundingClientRect();
    const localX = t.clientX - rect.left;
    const isOpen = app.classList.contains('admin-drawer-open');
    const fromLeftEdge = localX >= 0 && localX <= EDGE_START_PX;
    const panelRect = adminPanel?.getBoundingClientRect?.();
    const fromPanelCloseEdge = isOpen
      && panelRect
      && t.clientX >= panelRect.right - PANEL_CLOSE_EDGE_PX
      && t.clientX <= panelRect.right;

    if (!isOpen && !fromLeftEdge) {
      gesture = null;
      return;
    }

    if (isOpen && !fromPanelCloseEdge) {
      gesture = null;
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    gesture = {
      startX: t.clientX,
      startY: t.clientY,
      mode: isOpen ? 'close' : 'open',
      cancelled: false,
    };
  }

  function onTouchMove(event) {
    if (!gesture || gesture.cancelled || event.touches.length !== 1) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const t = event.touches[0];
    const dx = t.clientX - gesture.startX;
    const dy = t.clientY - gesture.startY;
    if (Math.abs(dy) > MAX_VERTICAL_DRIFT_PX) {
      gesture.cancelled = true;
      return;
    }

    if (gesture.mode === 'open' && dx >= SWIPE_OPEN_PX) {
      openDrawer();
      gesture.cancelled = true;
      return;
    }

    if (gesture.mode === 'close' && dx <= -SWIPE_CLOSE_PX) {
      closeDrawer();
      gesture.cancelled = true;
    }
  }

  function onTouchEnd(event) {
    if (gesture) {
      event?.preventDefault?.();
      event?.stopImmediatePropagation?.();
    }
    gesture = null;
  }

  function onScrimClick() {
    closeDrawer();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      closeDrawer();
    }
  }

  touchpad.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
  touchpad.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  touchpad.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
  touchpad.addEventListener('touchcancel', onTouchEnd, { passive: false, capture: true });

  if (adminPanel) {
    adminPanel.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
    adminPanel.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    adminPanel.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
    adminPanel.addEventListener('touchcancel', onTouchEnd, { passive: false, capture: true });
  }

  if (scrim) {
    scrim.addEventListener('click', onScrimClick);
    scrim.addEventListener('touchstart', onScrimClick, { passive: true });
  }
  window.addEventListener('keydown', onKeyDown);
}

import { emitWithTimestamp } from '../core/socket-emit.js';
import { bindTouchPassthrough } from '../touch/bind-touch-passthrough.js';
import { REMOTE_EVENT_KEYBOARD_KEY } from '../../utils/shared/remoteCommands.js';

export function bindSystemRemoteButtons(
  socket,
  {
    btnSystemShowDesktop,
    btnSystemWindowLeft,
    btnSystemWindowRight,
    btnSystemStartMenu,
    btnSystemSettings,
    btnSystemNotifications,
    touchpad,
  },
) {
  const buttons = [
    btnSystemShowDesktop,
    btnSystemWindowLeft,
    btnSystemWindowRight,
    btnSystemStartMenu,
    btnSystemSettings,
    btnSystemNotifications,
  ].filter(Boolean);

  bindTouchPassthrough(buttons, touchpad);

  btnSystemShowDesktop?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'd', modifiers: ['command'] }),
  );
  btnSystemWindowLeft?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'tab', modifiers: ['alt', 'shift'] }),
  );
  btnSystemWindowRight?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'tab', modifiers: ['alt'] }),
  );
  btnSystemStartMenu?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'command' }),
  );
  btnSystemSettings?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'i', modifiers: ['command'] }),
  );
  btnSystemNotifications?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'a', modifiers: ['command'] }),
  );
}

import { emitWithTimestamp } from '../../core/socket-emit.js';
import { bindTouchPassthrough } from '../../touch/bindTouchPassthrough.js';
import {
  REMOTE_EVENT_KEYBOARD_KEY,
  REMOTE_EVENT_WINDOW_CLOSE,
  REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE,
} from '../../../utils/shared/remoteCommands.js';

export function bindSystemRemoteButtons(
  socket,
  {
    btnSystemShowDesktop,
    btnSystemWindowLeft,
    btnSystemWindowRight,
    btnSystemStartMenu,
    btnSystemWindowToggle,
    btnSystemWindowClose,
    touchpad,
  },
) {
  const buttons = [
    btnSystemShowDesktop,
    btnSystemWindowLeft,
    btnSystemWindowRight,
    btnSystemStartMenu,
    btnSystemWindowToggle,
    btnSystemWindowClose,
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
  btnSystemWindowToggle?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE),
  );
  btnSystemWindowClose?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_WINDOW_CLOSE),
  );
}

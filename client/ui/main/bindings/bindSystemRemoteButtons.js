import { emitWithTimestamp } from '../../../core/socket-emit.js';
import { bindTouchPassthrough } from '../../../touch/bindTouchPassthrough.js';
import {
  REMOTE_EVENT_KEYBOARD_KEY,
  REMOTE_EVENT_WINDOW_CLOSE,
  REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE,
} from '../../../../utils/remoteCommands.js';

export function bindSystemRemoteButtons(services, dom) {
  const socket = services.getTransport();
  const touchpad = dom.remotes.mouse.touchpad;
  const {
    btnSystemShowDesktop,
    btnSystemWindowLeft,
    btnSystemWindowRight,
    btnSystemStartMenu,
    btnSystemWindowToggle,
    btnSystemWindowClose,
  } = dom.remotes.system;
  const buttons = [
    btnSystemShowDesktop,
    btnSystemWindowLeft,
    btnSystemWindowRight,
    btnSystemStartMenu,
    btnSystemWindowToggle,
    btnSystemWindowClose,
  ].filter(Boolean);

  const emitKey = (payload = {}) => () => emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, payload);
  const emitWindowToggle = () => emitWithTimestamp(socket, REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE);
  const emitWindowClose = () => emitWithTimestamp(socket, REMOTE_EVENT_WINDOW_CLOSE);

  bindTouchPassthrough(buttons, touchpad);

  btnSystemShowDesktop?.addEventListener('click', emitKey({ key: 'd', modifiers: ['command'] }));
  btnSystemWindowLeft?.addEventListener('click', emitKey({ key: 'tab', modifiers: ['alt', 'shift'] }));
  btnSystemWindowRight?.addEventListener('click', emitKey({ key: 'tab', modifiers: ['alt'] }));
  btnSystemStartMenu?.addEventListener('click', emitKey({ key: 'command' }));
  btnSystemWindowToggle?.addEventListener('click', emitWindowToggle);
  btnSystemWindowClose?.addEventListener('click', emitWindowClose);
}

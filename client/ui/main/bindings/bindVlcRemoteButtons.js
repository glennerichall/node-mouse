import { emitWithTimestamp } from '../../../core/socket-emit.js';
import { bindTouchPassthrough } from '../../../touch/bindTouchPassthrough.js';
import {
  REMOTE_EVENT_VLC_COMMAND,
  REMOTE_EVENT_VLC_OPEN,
  REMOTE_EVENT_VLC_WINDOW_CLOSE,
  REMOTE_EVENT_VLC_WINDOW_TOGGLE,
} from '../../../../utils/remoteCommands.js';

export function bindVlcRemoteButtons(services, dom) {
  const socket = services.getTransport();
  const touchpad = dom.remotes.mouse.touchpad;
  const {
    btnVlcOpen,
    btnVlcWindowToggle,
    btnVlcWindowClose,
    btnVlcPrevious,
    btnVlcPlayPause,
    btnVlcNext,
    btnVlcSeekBackward,
    btnVlcStop,
    btnVlcSeekForward,
    btnVlcVolumeDown,
    btnVlcMute,
    btnVlcVolumeUp,
    btnVlcFullscreen,
  } = dom.remotes.vlc;
  const buttons = [
    btnVlcOpen,
    btnVlcWindowToggle,
    btnVlcWindowClose,
    btnVlcPrevious,
    btnVlcPlayPause,
    btnVlcNext,
    btnVlcSeekBackward,
    btnVlcStop,
    btnVlcSeekForward,
    btnVlcVolumeDown,
    btnVlcMute,
    btnVlcVolumeUp,
    btnVlcFullscreen,
  ].filter(Boolean);

  const emitCommand = (action) => () => emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action });
  const emitOpen = () => emitWithTimestamp(socket, REMOTE_EVENT_VLC_OPEN);
  const emitWindowToggle = () => emitWithTimestamp(socket, REMOTE_EVENT_VLC_WINDOW_TOGGLE);
  const emitWindowClose = () => emitWithTimestamp(socket, REMOTE_EVENT_VLC_WINDOW_CLOSE);

  bindTouchPassthrough(buttons, touchpad);

  btnVlcOpen?.addEventListener('click', emitOpen);
  btnVlcWindowToggle?.addEventListener('click', emitWindowToggle);
  btnVlcWindowClose?.addEventListener('click', emitWindowClose);
  btnVlcPrevious?.addEventListener('click', emitCommand('previous'));
  btnVlcPlayPause?.addEventListener('click', emitCommand('play-pause'));
  btnVlcNext?.addEventListener('click', emitCommand('next'));
  btnVlcSeekBackward?.addEventListener('click', emitCommand('seek-backward'));
  btnVlcStop?.addEventListener('click', emitCommand('stop'));
  btnVlcSeekForward?.addEventListener('click', emitCommand('seek-forward'));
  btnVlcVolumeDown?.addEventListener('click', emitCommand('volume-down'));
  btnVlcMute?.addEventListener('click', emitCommand('mute'));
  btnVlcVolumeUp?.addEventListener('click', emitCommand('volume-up'));
  btnVlcFullscreen?.addEventListener('click', emitCommand('fullscreen'));
}

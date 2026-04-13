import { emitWithTimestamp } from '../../core/socket-emit.js';
import { bindTouchPassthrough } from '../../touch/bindTouchPassthrough.js';
import {
  REMOTE_EVENT_VLC_COMMAND,
  REMOTE_EVENT_VLC_OPEN,
  REMOTE_EVENT_VLC_WINDOW_CLOSE,
  REMOTE_EVENT_VLC_WINDOW_TOGGLE,
} from '../../../utils/remoteCommands.js';

export function bindVlcRemoteButtons(
  socket,
  {
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
    touchpad,
  },
) {
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

  bindTouchPassthrough(buttons, touchpad);

  btnVlcOpen?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_OPEN),
  );
  btnVlcWindowToggle?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_WINDOW_TOGGLE),
  );
  btnVlcWindowClose?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_WINDOW_CLOSE),
  );
  btnVlcPrevious?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'previous' }),
  );
  btnVlcPlayPause?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'play-pause' }),
  );
  btnVlcNext?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'next' }),
  );
  btnVlcSeekBackward?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'seek-backward' }),
  );
  btnVlcStop?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'stop' }),
  );
  btnVlcSeekForward?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'seek-forward' }),
  );
  btnVlcVolumeDown?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'volume-down' }),
  );
  btnVlcMute?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'mute' }),
  );
  btnVlcVolumeUp?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'volume-up' }),
  );
  btnVlcFullscreen?.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_VLC_COMMAND, { action: 'fullscreen' }),
  );
}

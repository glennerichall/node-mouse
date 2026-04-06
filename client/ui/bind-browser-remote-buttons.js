import {emitWithTimestamp} from "../core/socket-emit.js";
import {
    REMOTE_EVENT_BROWSER_BRAVE,
    REMOTE_EVENT_KEYBOARD_KEY
} from "../../utils/shared/remoteCommands.js";

export function bindBrowserRemoteButtons(
    socket,
    {
        btnOpenBrave,
        btnBrowserBack,
        btnBrowserForward,
        btnPrevTab,
        btnNextTab,
        btnNewTab,
        btnCloseTab,
        btnAddressBar,
        btnHardReload,
        btnFullscreen,
        btnVideoPlayPause,
        btnVideoFullscreen,
    },
) {
    btnOpenBrave.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_BROWSER_BRAVE));
    btnBrowserBack.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'left', modifiers: ['alt']}),
    );
    btnBrowserForward.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'right', modifiers: ['alt']}),
    );
    btnPrevTab.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'tab', modifiers: ['control', 'shift']}),
    );
    btnNextTab.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'tab', modifiers: ['control']}),
    );
    btnNewTab.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 't', modifiers: ['control']}),
    );
    btnCloseTab.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'w', modifiers: ['control']}),
    );
    btnAddressBar.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'l', modifiers: ['control']}),
    );
    btnHardReload.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'f5', modifiers: ['control']}),
    );
    btnFullscreen.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'f11'}));
    btnVideoPlayPause.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'space'}),
    );
    btnVideoFullscreen.addEventListener('click', () =>
        emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, {key: 'f'}),
    );
}
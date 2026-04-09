import {bindBrowserRemoteButtons} from "./bind-browser-remote-buttons.js";
import {bindSystemRemoteButtons} from "./bind-system-remote-buttons.js";
import {bindSamsungRemoteButtons} from "./bind-samsung-remote-buttons.js";
import {bindAdminRemoteButtons} from "./bind-admin-remote-buttons.js";
import {bindVlcRemoteButtons} from "./bind-vlc-remote-buttons.js";

export function bindActionButtons(socket, elements) {
  bindBrowserRemoteButtons(socket, elements);
  bindSystemRemoteButtons(socket, elements);
  bindVlcRemoteButtons(socket, elements);
  bindSamsungRemoteButtons(socket, elements);
  bindAdminRemoteButtons(socket, elements);
}

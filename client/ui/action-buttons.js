import {bindBrowserRemoteButtons} from "./bind-browser-remote-buttons.js";
import {bindSamsungRemoteButtons} from "./bind-samsung-remote-buttons.js";
import {bindAdminRemoteButtons} from "./bind-admin-remote-buttons.js";

export function bindActionButtons(socket, elements) {
  bindBrowserRemoteButtons(socket, elements);
  bindSamsungRemoteButtons(socket, elements);
  bindAdminRemoteButtons(socket, elements);
}

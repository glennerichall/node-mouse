import {bindBrowserRemoteButtons} from "./bindBrowserRemoteButtons.js";
import {bindSystemRemoteButtons} from "./bindSystemRemoteButtons.js";
import {bindSamsungRemoteButtons} from "./bindSamsungRemoteButtons.js";
import {bindAdminRemoteButtons} from "./bindAdminRemoteButtons.js";
import {bindVlcRemoteButtons} from "./bindVlcRemoteButtons.js";

export function bindActionButtons(socket, elements, services) {
  bindBrowserRemoteButtons(socket, elements, services);
  bindSystemRemoteButtons(socket, elements);
  bindVlcRemoteButtons(socket, elements);
  bindSamsungRemoteButtons(socket, elements, services);
  bindAdminRemoteButtons(socket, elements, services);
}

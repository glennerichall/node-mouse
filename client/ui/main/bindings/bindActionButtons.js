import {bindBrowserRemoteButtons} from "./bindBrowserRemoteButtons.js";
import {bindSystemRemoteButtons} from "./bindSystemRemoteButtons.js";
import {bindSamsungRemoteButtons} from "./bindSamsungRemoteButtons.js";
import {bindAdminRemoteButtons} from "./bindAdminRemoteButtons.js";
import {bindVlcRemoteButtons} from "./bindVlcRemoteButtons.js";

export function bindActionButtons(services, dom) {
  bindBrowserRemoteButtons(services, dom);
  bindSystemRemoteButtons(services, dom);
  bindVlcRemoteButtons(services, dom);
  bindSamsungRemoteButtons(services, dom);
  bindAdminRemoteButtons(services, dom);
}

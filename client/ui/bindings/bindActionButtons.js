import {bindBrowserRemoteButtons} from "./bindBrowserRemoteButtons.js";
import {bindSystemRemoteButtons} from "./bindSystemRemoteButtons.js";
import {bindSamsungRemoteButtons} from "./bindSamsungRemoteButtons.js";
import {bindAdminRemoteButtons} from "./bindAdminRemoteButtons.js";
import {bindVlcRemoteButtons} from "./bindVlcRemoteButtons.js";

export function bindActionButtons(socket, remotes, services) {
  bindBrowserRemoteButtons(socket, {
    ...remotes.browser,
    touchpad: remotes.mouse.touchpad,
  }, services);
  bindSystemRemoteButtons(socket, {
    ...remotes.system,
    touchpad: remotes.mouse.touchpad,
  });
  bindVlcRemoteButtons(socket, {
    ...remotes.vlc,
    touchpad: remotes.mouse.touchpad,
  });
  bindSamsungRemoteButtons(socket, {
    ...remotes.samsung,
    touchpad: remotes.mouse.touchpad,
  }, services);
  bindAdminRemoteButtons(socket, remotes.admin, services);
}

import {createBrowser} from "../../remotes/browser/index.js";
import {createSamsungRemote} from "../../remotes/samsung/createSamsungRemote.js";
import {createPreviewStreamer} from "../../remotes/preview/createPreviewStreamer.js";
import {createAdminActions} from "../../remotes/admin/index.js";
import {createVlc} from "../../remotes/vlc/index.js";
import {createWindowActions} from "../../remotes/window/index.js";

export function createRemotes(services) {
    const osService = services.getOs();
    const browser = createBrowser(osService);
    const samsung = createSamsungRemote(services);
    const preview = createPreviewStreamer(services);
    const adminActions = createAdminActions(services);
    const vlc = createVlc(services);
    const windowActions = createWindowActions(osService);

    return {
        browser,
        samsung,
        preview,
        adminActions,
        vlc,
        windowActions,
    };
}

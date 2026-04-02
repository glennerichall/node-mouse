import {createBrowser} from "../../remotes/browser/index.js";
import {createSamsungRemote} from "../../remotes/samsung/createSamsungRemote.js";
import {createPreviewStreamer} from "../../remotes/preview/createPreviewStreamer.js";
import {createAdminActions} from "../../remotes/admin/index.js";

export function createRemotes(services) {
    const browser = createBrowser();
    const samsung = createSamsungRemote(services);
    const preview = createPreviewStreamer(services);
    const adminActions = createAdminActions(services);

    return {
        browser,
        samsung,
        preview,
        adminActions,
    };
}
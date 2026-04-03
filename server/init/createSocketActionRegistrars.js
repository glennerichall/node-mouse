import {createControlEventRegistrar} from '../remotes/input/registrar.js';
import {createAdminEventRegistrar} from '../remotes/admin/registrar.js';
import {createPreviewEventRegistrar} from '../remotes/preview/registrar.js';
import {createConnectionRegistrar} from '../connection/socket/createConnectionRegistrar.js';
import {createBrowserRegistrar} from '../remotes/browser/registrar.js';
import {createSamsungRegistrar} from '../remotes/samsung/registrar.js';

export function createSocketActionRegistrars(services) {
    return [
        (socket) => {
            const {
                mouse,
                keyboard,
                updateConfig,
            } = services.getInputController();
            updateConfig();
            return createControlEventRegistrar({mouse, keyboard})(socket);
        },
        (socket) => {
            const {browser} = services.getRemotes();
            return createBrowserRegistrar({browser})(socket);
        },
        (socket) => {
            const {adminActions} = services.getRemotes();
            return createAdminEventRegistrar({adminActions, getSystemConfig: services.getSystemConfig})(socket);
        },
        (socket) => {
            const {preview} = services.getRemotes();
            return createPreviewEventRegistrar({preview})(socket);
        },
        (socket) => {
            const {samsung} = services.getRemotes();
            return createSamsungRegistrar({samsung})(socket);
        },
        (socket) => createConnectionRegistrar({events: services.getEvents()})(socket)
    ];

}

import {createControlEventRegistrar} from '../remotes/input/registrar.js';
import {createAdminEventRegistrar} from '../remotes/admin/registrar.js';
import {createPreviewEventRegistrar} from '../remotes/preview/registrar.js';
import {createConnectionRegistrar} from '../connection/socket/createConnectionRegistrar.js';
import {createBrowserRegistrar} from '../remotes/browser/registrar.js';
import {createSamsungRegistrar} from '../remotes/samsung/registrar.js';
import {createVlcRegistrar} from '../remotes/vlc/registrar.js';
import {createWindowRegistrar} from '../remotes/window/registrar.js';
import {createQrEventRegistrar} from '../remotes/qr/registrar.js';

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
            return createBrowserRegistrar({browser, getConfig: services.getConfig})(socket);
        },
        (socket) => {
            const {qrActions} = services.getRemotes();
            return createQrEventRegistrar({qrActions})(socket);
        },
        (socket) => {
            const {adminActions, qrActions} = services.getRemotes();
            return createAdminEventRegistrar({
                adminActions,
                legacyQrActions: qrActions,
            })(socket, {
                clientId: socket.id,
                emit: socket.emit.bind(socket),
            });
        },
        (socket) => {
            const {preview} = services.getRemotes();
            return createPreviewEventRegistrar({preview, getConfig: services.getConfig})(socket);
        },
        (socket) => {
            const {samsung} = services.getRemotes();
            return createSamsungRegistrar({samsung})(socket);
        },
        (socket) => {
            const {vlc} = services.getRemotes();
            return createVlcRegistrar({
                vlc,
                keyboard: services.getInputController().keyboard,
                getConfig: services.getConfig,
            })(socket);
        },
        (socket) => {
            const {windowActions} = services.getRemotes();
            return createWindowRegistrar({windowActions})(socket);
        },
        (socket) => createConnectionRegistrar({events: services.getEvents()})(socket)
    ];

}

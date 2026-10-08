import Router from 'router';
import {inputRouter} from '../../connection/actions/input.router.js';
import {adminRouter} from '../../connection/actions/admin.router.js';
import {previewRouter} from '../../connection/actions/preview.router.js';
import {browserRouter} from '../../connection/actions/browser.router.js';
import {samsungRouter} from '../../connection/actions/samsung.router.js';
import {vlcRouter} from '../../connection/actions/vlc.router.js';
import {windowRouter} from '../../connection/actions/window.router.js';
import {qrRouter} from '../../connection/actions/qr.router.js';

/** Socket route tree, declared once like the HTTP routers. */
export const socketRouter = Router();
[
    inputRouter,
    browserRouter,
    qrRouter,
    adminRouter,
    previewRouter,
    samsungRouter,
    vlcRouter,
    windowRouter,
].forEach((route) => socketRouter.use(route));
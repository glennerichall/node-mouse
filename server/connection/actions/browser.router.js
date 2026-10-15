import Router from 'router';
import {createLogger} from '../../application/logger.js';
import {getClientLabel} from '../client-channel.js';
import {NOTIFIER_LEVEL_WARNING, NOTIFIER_TARGET_CLIENT} from '../../services/notifier/createNotifierComposite.js';

let log;

function getModuleLog() {
    log ??= createLogger('browser:remote');
    return log;
}

function isBrowserEnabled(config, browserId) {
    return config?.browser?.enabled !== false && config?.browser?.[browserId] !== false;
}

const eventLog = getModuleLog();
export const browserRouter = Router()
    .post('/sessions',
        async (request, response, next) => {
            const browserId = typeof request.body?.browserId === 'string' ? request.body.browserId : 'brave';
            const browser = request.services.getRemotes().browser;
            const getConfig = request.services.getConfig;
            const client = getClientLabel(request.socket);

            if (!isBrowserEnabled(getConfig(), browserId)) {
                eventLog.info({client, browserId}, 'Browser ignored: disabled by configuration.');
            response.status(200).send({ok: true, ignored: true});
                return;
            }

            eventLog.info({client, browserId}, `Demande open`);
            const opened = await browser.focusOrLaunchBrowser(browserId);
            if (opened === false) {
                request.services.getNotifier().target(NOTIFIER_TARGET_CLIENT).notify({
                    titleKey: 'notification.browser.title',
                    messageKey: 'notification.browser.windowUnavailable',
                    level: NOTIFIER_LEVEL_WARNING,
                }, {clientId: request.socket.id});
                response.status(409).send({ok: false});
                return;
            }

            response.status(201).send({ok: true});
        });

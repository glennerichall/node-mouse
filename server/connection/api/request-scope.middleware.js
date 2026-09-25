import {randomUUID} from 'node:crypto';
import {createLogger} from '../../application/logger.js';
import {createLazy} from '../../../utils/createLazy.js';

// Attache une façade de services propre à la requête, tout en déléguant les
// services applicatifs partagés. Logger et sécurité sont créés à la demande.
export function createRequestScopeMiddleware(services) {
    return (req, _res, next) => {
        const requestId = randomUUID();
        req.requestId = requestId;
        req.services = {
            ...services,
            getSecurity: createLazy(() => services.getSecurity().forHttpRequest(req)),
            getLogger: createLazy(() => createLogger('http:request').child({requestId})),
        };
        next();
    };
}

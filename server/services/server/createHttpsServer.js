import fs from "node:fs";
import https from "node:https";

export function createHttpsServer(app, config) {
    if (!config.https.sslKeyPath || !config.https.sslCertPath) {
        throw new Error('HTTPS=true exige SSL_KEY_PATH et SSL_CERT_PATH.');
    }

    const key = fs.readFileSync(config.https.sslKeyPath, 'utf8');
    const cert = fs.readFileSync(config.https.sslCertPath, 'utf8');
    return https.createServer({key, cert}, app);
}
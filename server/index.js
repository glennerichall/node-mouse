import qrcodeTerminal from 'qrcode-terminal';
import {
    logStartupConfig,
    PORT,
} from './init/config.js';
import {createServer} from './init/createServer.js';
import {createApp} from "./init/createApp.js";
import {createServices} from "./init/createServices.js";
import {createSocket} from "./init/createSocket.js";


export async function startServer() {
    let instances = {};

    instances = await createServer(instances);
    instances = await createApp(instances);
    instances = await createServices(instances);
    instances = await createSocket(instances);
    
    const {server, getEntryUrl} = instances;
    
    server.listen(PORT, () => {
        logStartupConfig();

        console.log('Remote Mouse server démarré');
        console.log(`URL: ${getEntryUrl()}`);
        console.log(`QR web: /qr`);
        console.log('\nScanner ce QR avec le mobile:\n');

        qrcodeTerminal.generate(getEntryUrl(), {small: true});
    });
}

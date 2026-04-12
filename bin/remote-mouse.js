#!/usr/bin/env node
import {startServer} from '../server/index.js';
import {runCliCmd} from "../server/cli/runCliCmd.js";

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        await startServer();
    } else {
        await runCliCmd(args);
    }

}

main().catch((error) => {
    console.error('Erreur au démarrage:', error);
    process.exit(1);
});

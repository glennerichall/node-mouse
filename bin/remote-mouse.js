#!/usr/bin/env node

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 1 && args[0] === 'version') {
        const {getInstalledVersion} = await import('../server/term/cli/versionCommand.js');
        process.stdout.write(`${getInstalledVersion()}\n`);
        return;
    }

    if (args.length === 0) {
        const {startServer} = await import('../server/index.js');
        await startServer();
    } else {
        const {runCliCmd} = await import('../server/term/cli/runCliCmd.js');
        await runCliCmd(args);
    }

}

main().catch((error) => {
    console.error('Erreur au démarrage:', error);
    process.exit(1);
});

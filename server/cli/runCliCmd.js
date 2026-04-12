import {parseCliArgs} from "./parseCliArgs.js";
import {executeLocalServiceCommand} from "./executeLocalServiceCommand.js";
import {printCliLog, printCliResult} from "./printCliResult.js";
import {sendCliCommand} from "./sendCliCommand.js";
import {withCliVerbosity} from "./executeCliRequest.js";

function isLocalServiceCommand(command) {
    return command?.name === 'service'
        && ['install', 'disable', 'uninstall', 'restart'].includes(String(command.args?.action || '').trim());
}

export async function runCliCmd(args) {
    const normalizedArgs = args[0] === 'cli'
        ? args.slice(1)
        : args;
    const {command, options} = parseCliArgs(normalizedArgs);

    if (!command?.name || command.name === 'help') {
        console.log('Usage:');
        console.log('  remote-mouse              Demarre le serveur');
        console.log('  remote-mouse config       Affiche la configuration persistée effective');
        console.log('  remote-mouse service install Installe le daemon/service local');
        console.log('  remote-mouse service disable Desactive le daemon/service local');
        console.log('  remote-mouse service uninstall Desinstalle le daemon/service local');
        console.log('  remote-mouse service restart Redemarre le daemon/service local');
        console.log('  remote-mouse tasks        Affiche les informations du task manager');
        console.log('  remote-mouse task-manager Alias de tasks');
        console.log('  remote-mouse info --verbosity 2 Affiche les capacites serveur avec logs detailles');
        console.log('  remote-mouse system-info  Alias de info');
        console.log('  remote-mouse tokens       Liste les tokens en base');
        console.log('  remote-mouse open-qr      Envoie une commande au service deja demarre');
        console.log('  remote-mouse qr           Alias de open-qr');
        process.exit(0);
    }

    try {
        if (isLocalServiceCommand(command)) {
            const result = await withCliVerbosity(options, () => executeLocalServiceCommand(command), printCliLog);
            printCliResult(result);
            process.exit(result?.ok ? 0 : 1);
        }

        const result = await sendCliCommand(command, options, {onLog: printCliLog});
        printCliResult(result);
        process.exit(result?.ok ? 0 : 1);
    } catch (error) {
        console.error(`Impossible de contacter le service: ${error.message}`);
        process.exit(1);
    }
}

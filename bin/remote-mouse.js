#!/usr/bin/env node
import { startServer } from '../server/index.js';
import {sendCliCommand} from '../server/cli/sendCliCommand.js';
import {getSystemConfig} from '../server/services/config/index.js';
import {createPersistence} from '../server/services/persistence/index.js';
import {createApplicationDaemonService} from '../server/services/application/createApplicationDaemonService.js';

function createLazy(provider) {
  let hasValue = false;
  let value;

  return () => {
    if (!hasValue) {
      value = provider();
      hasValue = true;
    }

    return value;
  };
}

function createLocalDaemonServices() {
  const services = {};
  services.getSystemConfig = createLazy(() => getSystemConfig());
  services.getPersistence = createLazy(() => createPersistence(services));
  services.getApplicationDaemonService = createLazy(() => createApplicationDaemonService(services));
  return services;
}

function isLocalServiceCommand(command) {
  return command === 'service install'
    || command === 'service disable'
    || command === 'service uninstall'
    || command === 'service restart';
}

async function executeLocalServiceCommand(command) {
  const services = createLocalDaemonServices();

  if (command === 'service install') {
    return services.getApplicationDaemonService().install();
  }

  if (command === 'service disable') {
    return services.getApplicationDaemonService().disable();
  }

  if (command === 'service uninstall') {
    return services.getApplicationDaemonService().uninstall();
  }

  if (command === 'service restart') {
    return services.getApplicationDaemonService().restart({
      cause: 'user',
      source: 'cli',
    });
  }

  return {
    ok: false,
    message: `Commande inconnue: ${command}`,
  };
}

function printCliResult(result) {
  if (result?.data !== undefined) {
    console.log(JSON.stringify(result.data, null, 2));
  }
  if (result?.message) {
    console.log(result.message);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await startServer();
    return;
  }

  const normalizedArgs = args[0] === 'cli'
    ? args.slice(1)
    : args;
  const command = normalizedArgs.join(' ').trim();

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log('Usage:');
    console.log('  remote-mouse              Demarre le serveur');
    console.log('  remote-mouse config       Affiche la configuration persistée effective');
    console.log('  remote-mouse service install Installe le daemon/service local');
    console.log('  remote-mouse service disable Desactive le daemon/service local');
    console.log('  remote-mouse service uninstall Desinstalle le daemon/service local');
    console.log('  remote-mouse service restart Redemarre le daemon/service local');
    console.log('  remote-mouse tasks        Affiche les informations du task manager');
    console.log('  remote-mouse task-manager Alias de tasks');
    console.log('  remote-mouse tokens       Liste les tokens en base');
    console.log('  remote-mouse open-qr      Envoie une commande au service deja demarre');
    console.log('  remote-mouse qr           Alias de open-qr');
    process.exit(0);
  }

  try {
    if (isLocalServiceCommand(command)) {
      const result = await executeLocalServiceCommand(command);
      printCliResult(result);
      process.exit(result?.ok ? 0 : 1);
    }

    const result = await sendCliCommand(command);
    printCliResult(result);
    process.exit(result?.ok ? 0 : 1);
  } catch (error) {
    console.error(`Impossible de contacter le service: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Erreur au démarrage:', error);
  process.exit(1);
});

#!/usr/bin/env node
import { startServer } from '../server/index.js';
import {sendCliCommand} from '../server/cli/sendCliCommand.js';

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
    console.log('  remote-mouse tasks        Affiche les informations du task manager');
    console.log('  remote-mouse task-manager Alias de tasks');
    console.log('  remote-mouse tokens       Liste les tokens en base');
    console.log('  remote-mouse open-qr      Envoie une commande au service deja demarre');
    console.log('  remote-mouse qr           Alias de open-qr');
    process.exit(0);
  }

  try {
    const result = await sendCliCommand(command);
    if (result?.data !== undefined) {
      console.log(JSON.stringify(result.data, null, 2));
    }
    if (result?.message) {
      console.log(result.message);
    }
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

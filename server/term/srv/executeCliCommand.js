import {executeConfigCommand} from './commands/configCommand.js';
import {executeHelpCommand} from './commands/helpCommand.js';
import {executeInfoCommand} from './commands/infoCommand.js';
import {executeOpenQrCommand} from './commands/openQrCommand.js';
import {executeSamsungDetectCommand} from './commands/samsungDetectCommand.js';
import {executeServiceCommand} from './commands/serviceCommand.js';
import {executeSystemConfigCommand} from './commands/systemConfigCommand.js';
import {executeTasksCommand} from './commands/tasksCommand.js';
import {executeTokensCommand} from './commands/tokensCommand.js';
import {formatCliCommand} from '../cli/parseCliArgs.js';

const commandHandlers = {
  help: executeHelpCommand,
  'open-qr': executeOpenQrCommand,
  qr: executeOpenQrCommand,
  config: executeConfigCommand,
  'sys-config': executeSystemConfigCommand,
  info: executeInfoCommand,
  'system-info': executeInfoCommand,
  service: executeServiceCommand,
  tasks: executeTasksCommand,
  'task-manager': executeTasksCommand,
  'samsung-detect': executeSamsungDetectCommand,
  tokens: executeTokensCommand,
};

export async function executeCliCommand(services, command) {
  const commandName = String(command?.name || '').trim();
  const args = command?.args || {};

  if (!commandName) {
    return executeHelpCommand(services, args);
  }

  const handler = commandHandlers[commandName];
  if (handler) {
    return handler(services, args);
  }

  return {
    ok: false,
    message: `Commande inconnue: ${formatCliCommand(command)}`,
  };
}

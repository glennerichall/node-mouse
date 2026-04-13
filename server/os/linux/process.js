import {createLogger} from '../../application/logger.js';
import {execFileAsync} from '../../utils/process.js';

const LINUX_COMMAND_EXTRA_PATHS = [
  '/snap/bin',
  '/var/lib/snapd/snap/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
];

let log;
function getModuleLog() {
  log ??= createLogger('os:linux:process');
  return log;
}

export function getLinuxCommandLookupPath(basePath = process.env.PATH || '') {
  const entries = String(basePath || '')
    .split(':')
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const extraPath of LINUX_COMMAND_EXTRA_PATHS) {
    if (!entries.includes(extraPath)) {
      entries.push(extraPath);
    }
  }

  return entries.join(':');
}

export async function resolveLinuxCommand(command) {
  const log = getModuleLog();
  const normalizedCommand = String(command || '').trim();
  if (!normalizedCommand) {
    return '';
  }

  const lookupPath = getLinuxCommandLookupPath();
  const result = await execFileAsync('which', [normalizedCommand], {
    timeout: 2000,
    env: {
      ...process.env,
      PATH: lookupPath,
    },
  });

  if (!result.ok) {
    log.trace({command: normalizedCommand, lookupPath}, 'Commande Linux introuvable');
    return '';
  }

  const resolvedCommand = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) || normalizedCommand;

  log.debug({
    command: normalizedCommand,
    resolvedCommand,
    lookupPath,
  }, 'Commande Linux resolue');
  return resolvedCommand;
}

export async function commandExists(command) {
  return Boolean(await resolveLinuxCommand(command));
}

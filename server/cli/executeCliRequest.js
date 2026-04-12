import {executeCliCommand} from './executeCliCommand.js';
import {
  withCliLogStream,
} from '../application/logger.js';

function normalizeVerbosity(options = {}) {
  return Math.max(0, Number.parseInt(options.verbosity || 0, 10) || 0);
}

function getVerbosityLogLevel(verbosity) {
  return verbosity > 1 ? 'trace' : 'debug';
}

export async function withCliVerbosity(options = {}, callback, onLog = null) {
  const verbosity = normalizeVerbosity(options);

  return verbosity > 0
    ? withCliLogStream(getVerbosityLogLevel(verbosity), onLog, callback)
    : callback();
}

export async function executeCliRequest(services, command, options = {}, onLog = null) {
  return withCliVerbosity(options, () => executeCliCommand(services, command), onLog);
}

import {executeCliCommand} from './executeCliCommand.js';
import {
  getRecentLogCursor,
  getRecentLogsSince,
  withTemporaryLoggerLevel,
} from '../services/log/logger.js';

function normalizeVerbosity(options = {}) {
  return Math.max(0, Number.parseInt(options.verbosity || 0, 10) || 0);
}

function getVerbosityLogLevel(verbosity) {
  return verbosity > 1 ? 'trace' : 'debug';
}

export async function withCliVerbosity(options = {}, callback) {
  const verbosity = normalizeVerbosity(options);

  const runCommand = async () => {
    const cursor = getRecentLogCursor();
    const result = await callback();
    if (verbosity <= 0) {
      return result;
    }

    const logs = getRecentLogsSince(cursor);
    if (logs.length <= 0) {
      return result;
    }

    return {
      ...result,
      logs: [
        ...(Array.isArray(result?.logs) ? result.logs : []),
        ...logs,
      ],
    };
  };

  return verbosity > 0
    ? withTemporaryLoggerLevel(getVerbosityLogLevel(verbosity), runCommand)
    : runCommand();
}

export async function executeCliRequest(services, command, options = {}) {
  return withCliVerbosity(options, () => executeCliCommand(services, command));
}

import pino from 'pino';
import {getStartupConfigSnapshot} from '../init/config.js';

const config = getStartupConfigSnapshot();
const logLevel = config?.logging?.level || 'info';
const logFormat = config?.logging?.format || 'json';

function createDestination() {
  if (logFormat === 'flat' || logFormat === 'pretty') {
    return pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: false,
        singleLine: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });
  }

  return undefined;
}

const rootLogger = pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  createDestination(),
);

export function createLogger(scope) {
  return rootLogger.child({ scope });
}

export const logger = rootLogger;

import pino from 'pino';
import {getConfig} from '../init/config/index.js';

const config = getConfig();
const logLevel = config?.logging?.level || 'info';
const logFormat = config?.logging?.format || 'json';
const maxStoredLogs = 400;
const recentLogs = [];

const levelNamesByValue = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

function safeClone(value) {
  if (value === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return String(value);
  }
}

function pushRecentLog(scope, level, message, data) {
  recentLogs.push({
    at: new Date().toISOString(),
    scope: String(scope || 'app'),
    level: String(level || 'info'),
    message: String(message || ''),
    data: safeClone(data),
  });
  if (recentLogs.length > maxStoredLogs) {
    recentLogs.splice(0, recentLogs.length - maxStoredLogs);
  }
}

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
    hooks: {
      logMethod(args, method, level) {
        const bindings = typeof this.bindings === 'function' ? this.bindings() : {};
        const scope = bindings?.scope || 'app';
        const first = args[0];
        const second = args[1];
        const data = first && typeof first === 'object' && !Array.isArray(first) ? first : undefined;
        const message = typeof first === 'string'
          ? first
          : (typeof second === 'string' ? second : '');
        pushRecentLog(scope, levelNamesByValue[level] || String(level), message, data);
        method.apply(this, args);
      },
    },
  },
  createDestination(),
);

export function createLogger(scope) {
  return rootLogger.child({ scope });
}

export const logger = rootLogger;

export function getRecentLogs(limit = 200) {
  const safeLimit = Math.max(1, Math.min(1000, Math.round(Number(limit) || 200)));
  return recentLogs.slice(-safeLimit);
}

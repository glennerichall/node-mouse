import pino from 'pino';
import {getSystemConfig} from "../config/index.js";

const maxStoredLogs = 400;
const maxStoredMessageLength = 2_000;
const maxStoredDataLength = 8_000;
const recentLogs = [];
let rootLogger = null;
let defaultConfigProvider = getSystemConfig;
let temporaryLogLevel = '';

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
    const serialized = JSON.stringify(value);
    if (typeof serialized !== 'string') {
      return undefined;
    }
    if (serialized.length <= maxStoredDataLength) {
      return JSON.parse(serialized);
    }

    return {
      truncated: true,
      preview: `${serialized.slice(0, maxStoredDataLength)}...`,
    };
  } catch (_error) {
    const text = String(value);
    return text.length <= maxStoredDataLength
      ? text
      : `${text.slice(0, maxStoredDataLength)}...`;
  }
}

function pushRecentLog(scope, level, message, data) {
  recentLogs.push({
    at: new Date().toISOString(),
    scope: String(scope || 'app'),
    level: String(level || 'info'),
    message: String(message || '').slice(0, maxStoredMessageLength),
    data: safeClone(data),
  });
  if (recentLogs.length > maxStoredLogs) {
    recentLogs.splice(0, recentLogs.length - maxStoredLogs);
  }
}

function createDestination(logFormat) {
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

function syncLoggerConfig(logger, nextConfig) {
  const nextLevel = temporaryLogLevel || nextConfig?.logging?.level;
  if (nextLevel && logger.level !== nextLevel) {
    logger.level = nextLevel;
  }
}

function buildRootLogger(configProvider) {
  const initialConfig = configProvider();
  const logLevel = initialConfig?.logging?.level || 'info';
  const logFormat = initialConfig?.logging?.format || 'json';

  const logger = pino(
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
    createDestination(logFormat),
  );

  return logger;
}

export function setDefaultLoggerConfigProvider(configProvider) {
  if (typeof configProvider !== 'function') {
    return;
  }

  defaultConfigProvider = configProvider;

  if (rootLogger) {
    syncLoggerConfig(rootLogger, defaultConfigProvider());
  }
}

export function bootstrapLogger(configProvider = defaultConfigProvider) {
  setDefaultLoggerConfigProvider(configProvider);

  if (!rootLogger) {
    rootLogger = buildRootLogger(defaultConfigProvider);
  }
  return rootLogger;
}

export function createLogger(scope, configProvider = defaultConfigProvider) {
  const logger = bootstrapLogger(configProvider);
  syncLoggerConfig(logger, configProvider());
  return logger.child({ scope });
}

export function getRecentLogs(limit = 200) {
  const safeLimit = Math.max(1, Math.min(1000, Math.round(Number(limit) || 200)));
  return recentLogs.slice(-safeLimit);
}

export function getRecentLogCursor() {
  return recentLogs.length;
}

export function getRecentLogsSince(cursor = 0) {
  const safeCursor = Math.max(0, Math.round(Number(cursor) || 0));
  return recentLogs.slice(safeCursor);
}

export async function withTemporaryLoggerLevel(level, callback) {
  const logger = bootstrapLogger();
  const previousTemporaryLogLevel = temporaryLogLevel;
  const previousLevel = logger.level;
  temporaryLogLevel = String(level || '').trim();
  if (temporaryLogLevel) {
    logger.level = temporaryLogLevel;
  }

  try {
    return await callback();
  } finally {
    temporaryLogLevel = previousTemporaryLogLevel;
    logger.level = previousTemporaryLogLevel || previousLevel;
  }
}

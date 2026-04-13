import pino from 'pino';
import {Writable} from 'node:stream';
import {getSystemConfig} from "../services/config/index.js";

const maxStoredLogs = 400;
const maxStoredMessageLength = 2_000;
const maxStoredDataLength = 8_000;
const recentLogs = [];
const cliLogSubscribers = new Set();
let rootLogger = null;
let temporaryLogLevel = '';

const levels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const levelNamesByValue = Object.fromEntries(
  Object.entries(levels).map(([name, value]) => [value, name]),
);

function getLevelValue(level) {
  return levels[String(level || '').trim()] ?? levels.info;
}

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

function mapPinoRecord(record) {
  const {time, level, scope, msg, pid: _pid, hostname: _hostname, ...data} = record || {};
  const levelName = levelNamesByValue[level] || String(level || 'info');
  return {
    at: typeof time === 'string' ? time : new Date(time || Date.now()).toISOString(),
    scope: String(scope || 'app'),
    level: levelName,
    message: String(msg || '').slice(0, maxStoredMessageLength),
    data: Object.keys(data).length > 0 ? safeClone(data) : undefined,
  };
}

function publishCliLog(entry) {
  for (const subscriber of cliLogSubscribers) {
    if (getLevelValue(entry.level) < subscriber.minLevel) {
      continue;
    }

    subscriber.write(entry);
  }
}

function parseLogLines(buffer, chunk, onRecord) {
  const lines = `${buffer}${String(chunk || '')}`.split('\n');
  const nextBuffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      onRecord(JSON.parse(trimmed));
    } catch (_error) {
      // Non-JSON transport output is intentionally ignored by structured transports.
    }
  }

  return nextBuffer;
}

function createRecentLogTransport() {
  let buffer = '';

  return new Writable({
    write(chunk, _encoding, callback) {
      buffer = parseLogLines(buffer, chunk, (record) => {
        const entry = mapPinoRecord(record);
        recentLogs.push(entry);
        if (recentLogs.length > maxStoredLogs) {
          recentLogs.splice(0, recentLogs.length - maxStoredLogs);
        }
      });
      callback();
    },
  });
}

function createCliLogTransport() {
  let buffer = '';

  return new Writable({
    write(chunk, _encoding, callback) {
      buffer = parseLogLines(buffer, chunk, (record) => {
        publishCliLog(mapPinoRecord(record));
      });
      callback();
    },
  });
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

function syncLoggerConfig(logger) {
  const nextLevel = temporaryLogLevel || getSystemConfig()?.logging?.level;
  if (nextLevel && logger.level !== nextLevel) {
    logger.level = nextLevel;
  }
}

function buildRootLogger() {
  const systemConfig = getSystemConfig();
  const systemLogLevel = systemConfig?.logging?.level || 'info';
  const systemLogFormat = systemConfig?.logging?.format || 'json';
  const systemDestination = createDestination(systemLogFormat) || process.stdout;
  const logger = pino({
    level: systemLogLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
  }, pino.multistream([
    {level: systemLogLevel, stream: systemDestination},
    {level: 'trace', stream: createRecentLogTransport()},
    {level: 'trace', stream: createCliLogTransport()},
  ]));

  return logger;
}

export function bootstrapLogger() {
  if (!rootLogger) {
    rootLogger = buildRootLogger();
  } else {
    syncLoggerConfig(rootLogger);
  }
  return rootLogger;
}

export function createLogger(scope) {
  const logger = bootstrapLogger();
  syncLoggerConfig(logger);
  return logger.child({ scope });
}

export function getRecentLogs(limit = 200) {
  const safeLimit = Math.max(1, Math.min(1000, Math.round(Number(limit) || 200)));
  return recentLogs.slice(-safeLimit);
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

export async function withCliLogStream(level, onLog, callback) {
  const subscriber = {
    minLevel: getLevelValue(level),
    write: typeof onLog === 'function' ? onLog : () => {},
  };
  cliLogSubscribers.add(subscriber);

  try {
    return await withTemporaryLoggerLevel(level, callback);
  } finally {
    cliLogSubscribers.delete(subscriber);
  }
}

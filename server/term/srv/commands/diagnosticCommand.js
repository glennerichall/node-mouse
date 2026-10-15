import os from 'node:os';
import path from 'node:path';
import {readPackageVersion} from '../../../utils/env.js';
import {packageJsonPath} from '../../../services/config/bootstrapConfig.js';
import {getRecentLogs} from '../../../application/logger.js';
import {createDiagnosticArchive} from '../../../application/diagnosticArchive.js';

export async function executeDiagnosticCommand(services, {createArchive = createDiagnosticArchive} = {}) {
  const persistence = services.getPersistence();
  const server = services.getServer();
  const systemConfig = services.getSystemConfig();
  const snapshot = {
    version: readPackageVersion(packageJsonPath),
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    os: {
      type: os.type(),
      release: os.release(),
    },
    uptimeSec: Math.floor(process.uptime()),
    server: {
      startedAt: Number.isFinite(server.serverStartedAt)
        ? new Date(server.serverStartedAt).toISOString()
        : null,
      clientsConnected: server.io?.of('/')?.sockets?.size || 0,
    },
    config: services.getConfig(),
    systemConfig,
    system: await services.getSystem().getInfo(),
    daemon: await services.getApplicationDaemonService().getInfo(),
    tasks: services.getTaskManager().getTasksSnapshot(),
    restarts: persistence.restartLogDao.listRecentRestartRecords(20),
    updateEvents: persistence.updateEventLogDao.listRecentEvents(50),
    logs: getRecentLogs(250),
  };
  const result = await createArchive({snapshot});

  return {
    ok: true,
    message: `Archive de diagnostic créée: ${path.basename(result.path)} (${result.bytes} octets).`,
    data: {
      path: result.path,
      bytes: result.bytes,
      retained: result.retained.length,
    },
  };
}

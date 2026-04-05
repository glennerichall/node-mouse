import {writeRestartMarker} from '../../remotes/admin/notifyIfRestarted.js';
import {getPlatformAdapter} from "./getPlatformAdapter.js";
import {spawnDetached} from '../../utils/process.js';

async function spawnCustomRestartCommand(command) {
  const normalizedCommand = String(command || '').trim();
  if (!normalizedCommand) {
    return null;
  }

  const spawned = process.platform === 'win32'
    ? await spawnDetached('powershell', ['-NoProfile', '-Command', normalizedCommand])
    : await spawnDetached('bash', ['-lc', normalizedCommand]);

  if (!spawned) {
    return {
      ok: false,
      message: 'Impossible de lancer la commande custom de redemarrage.',
      details: {message: 'spawn custom restart command failed'},
    };
  }

  return {
    ok: true,
    message: 'Commande custom de redemarrage lancee.',
  };
}

export function createApplicationDaemonService(services) {
  return {
    async install() {
      const systemConfig = services.getSystemConfig();
      const serviceName = String(systemConfig.serviceName || '').trim();
      const adapter = getPlatformAdapter();

      if (!serviceName) {
        return {ok: false, message: 'serviceName non configure.'};
      }

      if (adapter.install) {
        return adapter.install(serviceName);
      }

      return {ok: false, message: `Plateforme non supportee pour le daemon: ${process.platform}`};
    },

    async disable() {
      const systemConfig = services.getSystemConfig();
      const serviceName = String(systemConfig.serviceName || '').trim();
      const adapter = getPlatformAdapter();

      if (!serviceName) {
        return {ok: false, message: 'serviceName non configure.'};
      }

      if (adapter.disable) {
        return adapter.disable(serviceName);
      }

      return {ok: false, message: `Plateforme non supportee pour la desactivation du daemon: ${process.platform}`};
    },

    async uninstall() {
      const systemConfig = services.getSystemConfig();
      const serviceName = String(systemConfig.serviceName || '').trim();
      const adapter = getPlatformAdapter();

      if (!serviceName) {
        return {ok: false, message: 'serviceName non configure.'};
      }

      if (adapter.uninstall) {
        return adapter.uninstall(serviceName);
      }

      return {ok: false, message: `Plateforme non supportee pour la desinstallation du daemon: ${process.platform}`};
    },

    async restart({cause = 'user', source = 'unknown'} = {}) {
      const systemConfig = services.getSystemConfig();
      const serviceName = String(systemConfig.serviceName || '').trim();
      const restartCommand = String(systemConfig.serviceRestartCommand || '').trim();
      const adapter = getPlatformAdapter();
      const restartLogDao = services.getPersistence().restartLogDao;
      const restartId = restartLogDao.createRestartRequest({
        cause,
        source,
        details: {
          serviceName,
          restartCommand,
          platformKind: adapter.platformKind,
        },
      });

      writeRestartMarker({
        restartId,
        cause,
        source,
      });

      if (restartCommand) {
        const result = await spawnCustomRestartCommand(restartCommand);
        if (!result?.ok) {
          restartLogDao.updateRestartStatus(restartId, {
            status: 'failed',
            details: result?.details || {message: 'custom restart failed'},
          });
          return result;
        }

        return {
          ...result,
          restartId,
        };
      }

      if (!adapter.restart) {
        restartLogDao.updateRestartStatus(restartId, {
          status: 'failed',
          details: {message: `unsupported platform ${process.platform}`},
        });
        return {ok: false, message: `Plateforme non supportee pour le redemarrage: ${process.platform}`};
      }

      const result = await adapter.restart(serviceName);
      if (!result?.ok) {
        restartLogDao.updateRestartStatus(restartId, {
          status: 'failed',
          details: result?.details || {message: 'restart failed'},
        });
        return result;
      }

      return {
        ...result,
        restartId,
      };
    },

    getInfo() {
      return getPlatformAdapter().getInfo(String(services.getSystemConfig().serviceName || '').trim());
    },
  };
}

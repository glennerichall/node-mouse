import {execShell} from '../../utils/process.js';
import {truncateText} from '../../utils/truncateText.js';
import {buildNpmGlobalUpdateCommand} from './buildNpmGlobalUpdateCommand.js';

export function resolveInstallUpdateCommand({getSystemConfig}) {
  const updateConfig = getSystemConfig().updateCheck || {};
  const installCommand = String(updateConfig.installCommand || '').trim();
  const resolvedCommand = installCommand || buildNpmGlobalUpdateCommand(updateConfig.packageName);
  const timeoutMs = Math.max(10_000, Number(updateConfig.installTimeoutSec || 0) * 1000);

  const runInstall = async () => {
    if (!resolvedCommand) {
      return {
        ok: false,
        status: 'no-command',
        message: 'Aucune commande update disponible.',
      };
    }

    const result = await execShell(resolvedCommand, timeoutMs);
    if (result.ok) {
      return {
        ok: true,
        status: 'completed',
        message: 'Installation terminee.',
        command: resolvedCommand,
      };
    }

    const details = truncateText(result.stderr || result.stdout || 'Erreur inconnue');
    return {
      ok: false,
      status: 'failed',
      message: `Echec installation: ${details}`,
      details,
      command: resolvedCommand,
    };
  };

  runInstall.command = resolvedCommand;
  return runInstall;
}

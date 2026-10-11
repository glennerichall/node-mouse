import {execFileAsync, execShell} from '../../utils/process.js';
import {truncateText} from '../../utils/truncateText.js';
import {buildNpmGlobalUpdateCommand} from './buildNpmGlobalUpdateCommand.js';

export function resolveInstallUpdateCommand({getSystemConfig, platform = process.platform}) {
  const updateConfig = getSystemConfig().updateCheck || {};
  const customCommand = String(updateConfig.installCommand || '').trim();
  const packageName = String(updateConfig.packageName || '').trim();
  const npmUpdate = customCommand ? null : buildNpmGlobalUpdateCommand(packageName, {platform});
  const displayCommand = customCommand || npmUpdate?.displayCommand || '';
  const timeoutMs = Math.max(10_000, Number(updateConfig.installTimeoutSec || 0) * 1000);

  const runInstall = async () => {
    if (!displayCommand) {
      return {
        ok: false,
        status: packageName ? 'invalid-package-name' : 'no-command',
        message: packageName
          ? 'The configured npm package name is invalid.'
          : 'No update command is configured.',
      };
    }

    const result = customCommand
      ? await execShell(customCommand, timeoutMs)
      : await execFileAsync(npmUpdate.executable, npmUpdate.args, {
          timeout: timeoutMs,
          env: {...process.env, ...npmUpdate.env},
          shell: npmUpdate.shell,
        });
    if (result.ok) {
      return {
        ok: true,
        status: 'completed',
        message: 'Installation completed.',
        command: displayCommand,
      };
    }

    const details = truncateText(result.stderr || result.stdout || 'Unknown error');
    return {
      ok: false,
      status: 'failed',
      message: `Installation failed: ${details}`,
      details,
      command: displayCommand,
    };
  };

  runInstall.command = displayCommand;
  return runInstall;
}

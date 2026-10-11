import path from 'node:path';
import {execShell} from '../../utils/process.js';
import {truncateText} from '../../utils/truncateText.js';
import {buildNpmGlobalUpdatePlan} from './buildNpmGlobalUpdatePlan.js';
import {installVerifiedNpmPackage} from './installVerifiedNpmPackage.js';
import {CONFIG_DIR} from '../config/bootstrapConfig.js';

export function resolveInstallUpdateCommand({
  getSystemConfig,
  platform = process.platform,
  rollbackDirectory = path.join(CONFIG_DIR, 'update-rollback'),
}) {
  const updateConfig = getSystemConfig().updateCheck || {};
  const customCommand = String(updateConfig.installCommand || '').trim();
  const packageName = String(updateConfig.packageName || '').trim();
  const npmUpdate = customCommand ? null : buildNpmGlobalUpdatePlan(packageName);
  const displayCommand = customCommand || npmUpdate?.displayCommand || '';
  const timeoutMs = Math.max(10_000, Number(updateConfig.installTimeoutSec || 0) * 1000);

  const runInstall = async ({targetVersion = '', currentVersion = '', onStage} = {}) => {
    if (!displayCommand) {
      return {
        ok: false,
        status: packageName ? 'invalid-package-name' : 'no-command',
        message: packageName
          ? 'The configured npm package name is invalid.'
          : 'No update command is configured.',
      };
    }

    if (customCommand) {
      onStage?.({stage: 'custom-command-started', origin: 'administrator-configured-command', integrity: 'not-verified'});
    }
    const result = customCommand
      ? await execShell(customCommand, timeoutMs)
      : await installVerifiedNpmPackage({
          packageName,
          targetVersion,
          currentVersion,
          rollbackDirectory,
          platform,
          timeout: timeoutMs,
          env: process.env,
          onStage,
        });
    if (result.ok) {
      if (customCommand) onStage?.({stage: 'custom-command-completed', integrity: 'not-verified'});
      return {
        ok: true,
        status: 'completed',
        message: result.message || 'Installation completed.',
        command: displayCommand,
        ...(result.targetVersion ? {targetVersion: result.targetVersion, integrity: result.integrity} : {}),
        ...(result.previousVersion ? {previousVersion: result.previousVersion} : {}),
      };
    }

    const details = truncateText(result.details || result.stderr || result.stdout || 'Unknown error');
    return {
      ok: false,
      status: result.status === 'completed' ? 'failed' : result.status,
      message: result.message || `Installation failed: ${details}`,
      details,
      command: displayCommand,
      ...(result.rollbackSucceeded !== undefined ? {rollbackSucceeded: result.rollbackSucceeded} : {}),
      ...(result.rolledBackVersion ? {rolledBackVersion: result.rolledBackVersion} : {}),
      ...(result.rollbackDetails ? {rollbackDetails: result.rollbackDetails} : {}),
    };
  };

  runInstall.command = displayCommand;
  return runInstall;
}

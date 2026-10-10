import os from 'node:os';
import path from 'node:path';
import {createInitialConfig, resolveSetupConfigDir} from './setup/configuration.js';
import {installLocalService} from './setup/installService.js';
import {validateSetupPrerequisites} from './setup/prerequisites.js';
import {askYesNo} from './setup/prompts.js';
import {createSetupStrategy} from './setup/strategies/index.js';

// This command owns the shared setup sequence. OS-specific defaults, file
// permissions, host changes, and service installation live in its strategy.
export async function runSetup(
    {
        options = {},
        env = process.env,
        platform = process.platform,
        nodeVersion = process.versions.node,
        configDir: explicitConfigDir = '',
        homeDir = os.homedir(),
        input = process.stdin,
        output = process.stdout,
        errorOutput = process.stderr,
        dependencies = {},
    } = {}) {
    const strategy = dependencies.setupStrategy || await createSetupStrategy(platform, {dependencies});
    const prerequisiteError = validateSetupPrerequisites({platform, nodeVersion, strategy});
    if (prerequisiteError) {
        errorOutput.write(`${prerequisiteError}\n`);
        return {ok: false, message: prerequisiteError};
    }

    const port = Number(options.port || env.REMOTE_MOUSE_PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        const message = 'Port must be an integer between 1 and 65535.';
        errorOutput.write(`${message}\n`);
        return {ok: false, message};
    }

    const configDir = resolveSetupConfigDir({
        env,
        homeDir,
        explicitConfigDir: explicitConfigDir || options.configDir,
        strategy,
    });
    const envFile = path.join(configDir, '.env');
    try {
        strategy.prepareConfigDir(configDir);
        const configResult = createInitialConfig({envFile, configDir, port, strategy});
        const configEnv = {CONFIG_DIR: configDir, ENV_FILE_PATH: envFile};
        output.write(`Configuration ready: ${envFile}${configResult.created ? ' (created or updated)' : ' (existing settings preserved)'}\n`);

        const hostResult = await strategy.configureHost({options, env, input, output});
        if (!hostResult?.ok) return hostResult;
        if (hostResult.message) output.write(`${hostResult.message}\n`);

        const shouldInstallService = options.noService
            ? false
            : options.yes || await askYesNo('Install and start the Remote Mouse service now?', {
                input,
                output,
                defaultValue: true,
            });
        if (!shouldInstallService) {
            output.write('Service not installed. To install it later, run: remote-mouse service install\n');
            return {ok: true, configDir, serviceInstalled: false};
        }

        const installService = dependencies.runServiceInstall || strategy.installService || installLocalService;
        const serviceResult = await installService(configEnv);
        if (!serviceResult?.ok) {
            const message = serviceResult?.message || 'Service installation failed.';
            errorOutput.write(`${message}\n`);
            return {ok: false, configDir, serviceInstalled: false, message};
        }
        output.write('Service installed and started.\n');
        return {ok: true, configDir, serviceInstalled: true};
    } catch (error) {
        errorOutput.write(`Setup failed: ${error.message}\n`);
        return {ok: false, message: error.message};
    }
}

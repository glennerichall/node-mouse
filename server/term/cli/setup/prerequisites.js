import fs from 'node:fs';
import path from 'node:path';
import {isSupportedNodeVersion, MINIMUM_NODE_VERSION} from '../../../services/persistence/assertSupportedNodeRuntime.js';

function validateWritablePath(configDir, envFile) {
    let currentPath = configDir;
    while (!fs.existsSync(currentPath)) {
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
            return `Unable to find a writable parent directory for configuration: ${configDir}`;
        }
        currentPath = parentPath;
    }

    try {
        if (!fs.statSync(currentPath).isDirectory()) {
            return `Configuration path is not a directory: ${currentPath}`;
        }
        fs.accessSync(currentPath, fs.constants.W_OK | fs.constants.X_OK);
    } catch {
        return `Configuration directory is not writable: ${currentPath}`;
    }

    if (!fs.existsSync(envFile)) return '';

    try {
        if (!fs.statSync(envFile).isFile()) {
            return `Configuration file path is not a regular file: ${envFile}`;
        }
        fs.accessSync(envFile, fs.constants.W_OK);
    } catch {
        return `Configuration file is not writable: ${envFile}`;
    }

    return '';
}

export function validateSetupPrerequisites({platform, nodeVersion, strategy}) {
    if (!isSupportedNodeVersion(nodeVersion)) {
        return `Node.js ${MINIMUM_NODE_VERSION} or newer is required (detected version: ${nodeVersion}).`;
    }
    if (!strategy) {
        return `Setup currently supports Linux and Windows, not ${platform}.`;
    }
    return '';
}

export async function validateSetupOperationPrerequisites({
    configDir,
    envFile,
    port,
    strategy,
    installService,
    configureUinput,
    configureGnomeFocus,
    env,
}) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return 'Port must be an integer between 1 and 65535.';
    }

    const configError = validateWritablePath(configDir, envFile);
    if (configError) return configError;

    if (!strategy.validatePrerequisites) return '';
    try {
        return await strategy.validatePrerequisites({installService, configureUinput, configureGnomeFocus, env});
    } catch (error) {
        return `Unable to validate host prerequisites: ${error.message}`;
    }
}

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {configureUinputPermission} from '../../../../os/linux/setup.js';
import {execFileAsync} from '../../../../utils/process.js';
import {installLocalService} from '../installService.js';
import {askYesNo} from '../prompts.js';

export function createLinuxSetupStrategy({dependencies = {}} = {}) {
    return {
        name: 'linux',
        configFileMode: 0o600,
        getDefaultConfigDir({homeDir}) {
            return path.join(homeDir, '.config', 'remote-mouse');
        },
        getConfigDefaults() {
            return {
                SERVICE_NAME: 'remote-mouse.service',
                REMOTE_MOUSE_WAYLAND_INPUT: 'uinput',
            };
        },
        prepareConfigDir(configDir) {
            fs.mkdirSync(configDir, {recursive: true, mode: 0o700});
            fs.chmodSync(configDir, 0o700);
        },
        secureConfigFile(envFile) {
            fs.chmodSync(envFile, 0o600);
        },
        async selectHostChanges({options, env, input, output}) {
            const configureUinput = env.XDG_SESSION_TYPE === 'wayland'
                && (options.configureUinput || (!options.yes && await askYesNo(
                    'Explicitly configure restricted /dev/uinput access for Wayland input?',
                    {input, output},
                )));
            return {...options, configureUinput: Boolean(configureUinput)};
        },
        async validatePrerequisites({installService, configureUinput, env}) {
            if (installService) {
                const result = await (dependencies.runPrerequisiteCommand || execFileAsync)(
                    'systemctl', ['--user', 'show-environment'], {timeout: 3000},
                );
                if (!result.ok) {
                    return 'The systemd user service manager is unavailable. Run setup from an active user session.';
                }
            }
            if (!configureUinput) return '';

            if (env.XDG_SESSION_TYPE !== 'wayland') {
                return 'uinput permissions can only be configured from a Wayland session.';
            }
            const username = String(env.SUDO_USER || env.USER || '').trim();
            if (!username) {
                return 'Unable to determine the desktop-session user for uinput setup.';
            }
            const scriptPath = path.resolve(
                path.dirname(fileURLToPath(import.meta.url)),
                '../../../../../scripts/configure-uinput-access.sh',
            );
            if (!fs.existsSync(scriptPath)) return 'The uinput setup helper is missing from this installation.';
            const result = await (dependencies.runPrerequisiteCommand || execFileAsync)(
                'pkexec', ['--version'], {timeout: 3000},
            );
            if (!result.ok) return 'The pkexec command is required to configure uinput permissions.';
            return '';
        },
        async configureHost({options, env}) {
            if (!options.configureUinput) return {ok: true};
            const username = String(env.SUDO_USER || env.USER || '').trim();
            const setupUinput = dependencies.runUinputSetup || configureUinputPermission;
            return setupUinput(username);
        },
        installService: dependencies.runServiceInstall || installLocalService,
    };
}

import fs from 'node:fs';
import path from 'node:path';
import {configureUinputPermission} from '../../../../os/linux/setup.js';
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
        async configureHost({options, env, input, output}) {
            const requested = env.XDG_SESSION_TYPE === 'wayland'
                && (options.configureUinput || (!options.yes && await askYesNo(
                    'Explicitly configure restricted /dev/uinput access for Wayland input?',
                    {input, output},
                )));
            if (!requested) return {ok: true};
            const username = String(env.SUDO_USER || env.USER || '').trim();
            if (!username) {
                return {ok: false, message: 'Unable to determine the desktop-session user for uinput setup.'};
            }
            const setupUinput = dependencies.runUinputSetup || configureUinputPermission;
            return setupUinput(username);
        },
        installService: dependencies.runServiceInstall || installLocalService,
    };
}

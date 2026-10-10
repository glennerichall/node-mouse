import fs from 'node:fs';
import path from 'node:path';
import {installLocalService} from '../installService.js';

export function createWindowsSetupStrategy({dependencies = {}} = {}) {
    return {
        name: 'windows',
        configFileMode: undefined,
        getDefaultConfigDir({env, homeDir}) {
            return path.join(env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'remote-mouse');
        },
        getConfigDefaults() {
            return {SERVICE_NAME: 'remote-mouse'};
        },
        prepareConfigDir(configDir) {
            fs.mkdirSync(configDir, {recursive: true});
        },
        secureConfigFile() {},
        async configureHost() {
            return {ok: true};
        },
        installService: dependencies.runServiceInstall || installLocalService,
    };
}

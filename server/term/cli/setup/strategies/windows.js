import fs from 'node:fs';
import path from 'node:path';
import {execFileAsync} from '../../../../utils/process.js';
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
        async validatePrerequisites({installService}) {
            if (!installService) return '';
            const result = await (dependencies.runPrerequisiteCommand || execFileAsync)(
                'schtasks', ['/Query', '/FO', 'LIST'], {timeout: 5000},
            );
            return result.ok ? '' : 'Windows Task Scheduler is unavailable or cannot be queried by this user.';
        },
        installService: dependencies.runServiceInstall || installLocalService,
    };
}

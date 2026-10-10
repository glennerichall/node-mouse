import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function resolveSetupConfigDir({env, homeDir, explicitConfigDir, strategy}) {
    const configured = String(explicitConfigDir || env.CONFIG_DIR || '').trim();
    if (configured) {
        const expanded = configured === '~' ? homeDir
            : configured.startsWith('~/') ? path.join(homeDir, configured.slice(2))
                : configured;
        return path.resolve(expanded);
    }
    return strategy.getDefaultConfigDir({env, homeDir});
}

function readConfiguredKeys(envFile) {
    try {
        return new Map(fs.readFileSync(envFile, 'utf8')
            .split(/\r?\n/)
            .map((line) => line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/))
            .filter(Boolean)
            .map(([, key, value]) => [key, value.trim()]));
    } catch (error) {
        if (error.code === 'ENOENT') return new Map();
        throw error;
    }
}

// Add missing defaults without serializing the existing file, preserving its
// comments, formatting, and values. Replace only an unsafe cookie-secret stub.
export function createInitialConfig({envFile, configDir, port, strategy}) {
    const existing = readConfiguredKeys(envFile);
    const defaults = {
        PORT: String(port),
        CONFIG_DIR: configDir,
        PERSISTENCE_DB_PATH: path.join(configDir, 'remote-mouse.sqlite3'),
        SESSION_COOKIE_SECRET: randomBytes(48).toString('base64url'),
        ENTRY_PATH_GRACE_MIN: '120',
        ...strategy.getConfigDefaults(),
    };
    const existingSecret = String(existing.get('SESSION_COOKIE_SECRET') || '').trim();
    const replaceCookieSecret = existing.has('SESSION_COOKIE_SECRET')
        && (!existingSecret || existingSecret === 'change-me');
    const additions = Object.entries(defaults)
        .filter(([key]) => !existing.has(key) || (key === 'SESSION_COOKIE_SECRET' && replaceCookieSecret))
        .filter(([key]) => key !== 'SESSION_COOKIE_SECRET' || !replaceCookieSecret)
        .map(([key, value]) => `${key}=${value}`);

    if (additions.length || replaceCookieSecret) {
        fs.mkdirSync(path.dirname(envFile), {recursive: true});
        const hasExistingFile = fs.existsSync(envFile);
        let previous = hasExistingFile ? fs.readFileSync(envFile, 'utf8') : '';
        if (replaceCookieSecret) {
            previous = previous.split(/\r?\n/).map((line) => {
                const match = line.match(/^(\s*(?:export\s+)?SESSION_COOKIE_SECRET\s*=)(.*)$/);
                if (match && (!match[2].trim() || match[2].trim() === 'change-me')) {
                    return `${match[1]}${defaults.SESSION_COOKIE_SECRET}`;
                }
                return line;
            }).join('\n');
        }
        const separator = previous && !previous.endsWith('\n') ? '\n' : '';
        const appendContent = `${separator}${additions.join('\n')}${additions.length ? '\n' : ''}`;
        const content = replaceCookieSecret ? `${previous}${appendContent}` : appendContent;
        fs.writeFileSync(envFile, content, {
            encoding: 'utf8',
            mode: strategy.configFileMode,
            flag: replaceCookieSecret ? 'w' : 'a',
        });
        strategy.secureConfigFile(envFile);
    }

    return {
        created: !fs.existsSync(envFile) || additions.length > 0 || replaceCookieSecret,
        additions: [...additions.map((line) => line.split('=', 1)[0]), ...(replaceCookieSecret ? ['SESSION_COOKIE_SECRET'] : [])],
    };
}

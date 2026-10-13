import {spawnSync} from 'node:child_process';

export function installLocalService(configEnv, entrypoint = process.argv[1]) {
    if (!entrypoint) return {ok: false, message: 'Unable to locate the CLI entrypoint.'};
    // Run a fresh CLI process so its configuration loader sees the new .env path.
    const result = spawnSync(process.execPath, [entrypoint, 'service', 'install'], {
        env: {...process.env, ...configEnv},
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    const output = [result.stdout, result.stderr]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .join('\n');
    return result.error || result.status !== 0
        ? {
            ok: false,
            message: result.error?.message
                || output
                || `Service installation failed (exit code ${result.status}).`,
        }
        : {ok: true, message: 'Service installed and started.'};
}

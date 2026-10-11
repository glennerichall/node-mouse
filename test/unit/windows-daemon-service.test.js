import {jest} from '@jest/globals';

const execFileAsync = jest.fn();

jest.unstable_mockModule('../../server/utils/process.js', () => ({
    execFileAsync,
    spawnDetached: jest.fn(),
}));

const {
    disableWindowsDaemon,
    installWindowsDaemon,
    uninstallWindowsDaemon,
} = await import('../../server/os/win32/service.js');

describe('Windows scheduled-task service adapter', () => {
    const originalConfigDir = process.env.CONFIG_DIR;
    const originalEnvFilePath = process.env.ENV_FILE_PATH;

    beforeEach(() => {
        execFileAsync.mockReset().mockResolvedValue({ok: true});
        process.env.CONFIG_DIR = 'C:\\Users\\dev\\AppData\\Roaming\\remote-mouse';
        process.env.ENV_FILE_PATH = 'C:\\Users\\dev\\AppData\\Roaming\\remote-mouse\\.env';
    });

    afterAll(() => {
        if (originalConfigDir === undefined) delete process.env.CONFIG_DIR;
        else process.env.CONFIG_DIR = originalConfigDir;
        if (originalEnvFilePath === undefined) delete process.env.ENV_FILE_PATH;
        else process.env.ENV_FILE_PATH = originalEnvFilePath;
    });

    it('creates or replaces the logon task and starts it with persistent config paths', async () => {
        const firstResult = await installWindowsDaemon('remote-mouse');
        const secondResult = await installWindowsDaemon('remote-mouse');

        expect(firstResult.ok).toBe(true);
        expect(secondResult.ok).toBe(true);
        expect(execFileAsync).toHaveBeenCalledTimes(4);
        const createCall = execFileAsync.mock.calls[0];
        expect(createCall[0]).toBe('schtasks');
        expect(createCall[1]).toEqual(expect.arrayContaining([
            '/Create', '/F', '/SC', 'ONLOGON', '/TN', 'remote-mouse',
        ]));
        const taskCommand = createCall[1][createCall[1].indexOf('/TR') + 1];
        expect(taskCommand).toContain("$env:CONFIG_DIR='C:\\Users\\dev\\AppData\\Roaming\\remote-mouse';");
        expect(taskCommand).toContain("$env:ENV_FILE_PATH='C:\\Users\\dev\\AppData\\Roaming\\remote-mouse\\.env';");
        expect(taskCommand).toContain("$env:REMOTE_MOUSE_DAEMON='1'");
        expect(execFileAsync.mock.calls[1]).toEqual(['schtasks', ['/Run', '/TN', 'remote-mouse'], {timeout: 10000}]);
    });

    it('does not start the task when creation fails', async () => {
        execFileAsync.mockResolvedValueOnce({ok: false, stderr: 'access denied'});

        const result = await installWindowsDaemon('remote-mouse');

        expect(result.ok).toBe(false);
        expect(execFileAsync).toHaveBeenCalledTimes(1);
    });

    it('reports a task that could not be started after creation', async () => {
        execFileAsync.mockResolvedValueOnce({ok: true}).mockResolvedValueOnce({ok: false, stderr: 'task disabled'});

        const result = await installWindowsDaemon('remote-mouse');

        expect(result.ok).toBe(false);
        expect(execFileAsync).toHaveBeenCalledTimes(2);
    });

    it('ends and disables an existing task', async () => {
        const result = await disableWindowsDaemon('remote-mouse');

        expect(result.ok).toBe(true);
        expect(execFileAsync.mock.calls).toEqual([
            ['schtasks', ['/End', '/TN', 'remote-mouse'], {timeout: 10000}],
            ['schtasks', ['/Change', '/TN', 'remote-mouse', '/Disable'], {timeout: 30000}],
        ]);
    });

    it('ends and deletes the task during uninstall', async () => {
        const result = await uninstallWindowsDaemon('remote-mouse');

        expect(result.ok).toBe(true);
        expect(execFileAsync.mock.calls).toEqual([
            ['schtasks', ['/End', '/TN', 'remote-mouse'], {timeout: 10000}],
            ['schtasks', ['/Delete', '/TN', 'remote-mouse', '/F'], {timeout: 30000}],
        ]);
    });

    it('reports scheduler failures without claiming success', async () => {
        execFileAsync.mockResolvedValueOnce({ok: true}).mockResolvedValueOnce({ok: false, stderr: 'task not found'});

        const result = await uninstallWindowsDaemon('remote-mouse');

        expect(result).toMatchObject({ok: false, message: 'task not found'});
    });
});

import {spawn as spawnProcess} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const DEFAULT_HELPER_PATH = fileURLToPath(
    new URL('../../../../build/wayland/remote-mouse-wayland', import.meta.url),
);

export function createWaylandHelperClient({
                                               helperPath = process.env.REMOTE_MOUSE_WAYLAND_HELPER || DEFAULT_HELPER_PATH,
                                               spawn = spawnProcess,
                                               pathExists = existsSync,
                                               onStatus = () => {},
                                           } = {}) {
    let child = null;
    let stdoutBuffer = '';
    let status = {status: 'permission-required'};

    function publish(nextStatus) {
        status = nextStatus;
        onStatus(nextStatus);
    }

    function consumeStdout(chunk) {
        stdoutBuffer += chunk.toString('utf8');
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim()) {
                continue;
            }
            try {
                const message = JSON.parse(line);
                if (message.type === 'status' && typeof message.status === 'string') {
                    publish(message);
                }
            } catch {
                publish({status: 'helper-error', detail: 'Invalid helper response'});
            }
        }
    }

    function start() {
        if (child) {
            return;
        }
        if (!pathExists(helperPath)) {
            const error = new Error(
                `Wayland helper not found at ${helperPath}. Run npm run build:wayland.`,
            );
            error.code = 'WAYLAND_HELPER_MISSING';
            throw error;
        }
        child = spawn(helperPath, [], {stdio: ['pipe', 'pipe', 'pipe']});
        child.stdin.on('error', (error) => {
            if (error.code !== 'EPIPE') {
                publish({status: 'helper-error', detail: error.message});
            }
        });
        child.stdout.on('data', consumeStdout);
        child.stderr.on('data', (chunk) => {
            publish({status: 'helper-error', detail: chunk.toString('utf8').trim()});
        });
        child.on('error', (error) => {
            publish({status: 'helper-error', detail: error.message});
            child = null;
        });
        child.on('exit', (code, signal) => {
            if (status.status !== 'denied' && status.status !== 'revoked') {
                publish({status: 'stopped', code, signal});
            }
            child = null;
        });
    }

    function send(command) {
        if (!child?.stdin?.writable) {
            return false;
        }
        child.stdin.write(`${command}\n`);
        return true;
    }

    function stop() {
        if (!child) {
            return;
        }
        send('STOP');
        child = null;
    }

    return {
        start,
        stop,
        send,
        getStatus: () => ({...status}),
        getHelperPath: () => helperPath,
    };
}

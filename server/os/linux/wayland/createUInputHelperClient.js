import {spawn as spawnProcess} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const DEFAULT_HELPER_PATH = fileURLToPath(
    new URL('../../../../build/uinput/remote-mouse-uinput', import.meta.url),
);

export function createUInputHelperClient({
                                             helperPath = process.env.REMOTE_MOUSE_UINPUT_HELPER || DEFAULT_HELPER_PATH,
                                             spawn = spawnProcess,
                                             pathExists = existsSync,
                                             onStatus = () => {},
                                         } = {}) {
    let child = null;
    let stdoutBuffer = '';
    let status = {status: 'starting'};

    function publish(nextStatus) {
        status = nextStatus;
        onStatus(nextStatus);
    }

    function consumeStdout(chunk) {
        stdoutBuffer += chunk.toString('utf8');
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const message = JSON.parse(line);
                if (message.type === 'status' && typeof message.status === 'string') publish(message);
            } catch {
                publish({status: 'helper-error', detail: 'Invalid uinput helper response'});
            }
        }
    }

    function start() {
        if (child) return;
        if (!pathExists(helperPath)) {
            const error = new Error(`uinput helper not found at ${helperPath}. Run npm run build:uinput.`);
            error.code = 'UINPUT_HELPER_MISSING';
            throw error;
        }
        publish({status: 'starting'});
        child = spawn(helperPath, [], {stdio: ['pipe', 'pipe', 'pipe']});
        child.stdin.on('error', (error) => {
            if (error.code !== 'EPIPE') publish({status: 'helper-error', detail: error.message});
        });
        child.stdout.on('data', consumeStdout);
        child.stderr.on('data', (chunk) => publish({status: 'helper-error', detail: chunk.toString('utf8').trim()}));
        child.on('error', (error) => {
            publish({status: 'helper-error', detail: error.message});
            child = null;
        });
        child.on('exit', (code, signal) => {
            if (!['permission-denied', 'uinput-unavailable', 'uinput-error'].includes(status.status)) {
                publish({status: 'stopped', code, signal});
            }
            child = null;
        });
    }

    function send(command) {
        if (!child?.stdin?.writable) return false;
        child.stdin.write(`${command}\n`);
        return true;
    }

    function stop() {
        if (!child) return;
        send('STOP');
        child = null;
    }

    return {start, stop, send, getStatus: () => ({...status}), getHelperPath: () => helperPath};
}

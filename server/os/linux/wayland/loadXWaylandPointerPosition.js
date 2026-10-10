import {Worker} from 'node:worker_threads';
import {getLinuxNativeArtifactPath} from '../nativeArtifactPaths.js';

const DEFAULT_BRIDGE_PATH = getLinuxNativeArtifactPath('xwaylandPointer');
const WORKER_URL = new URL('./xwaylandPointerWorker.js', import.meta.url);

function normalizePosition(position) {
  const x = Number(position?.x);
  const y = Number(position?.y);
  return Number.isFinite(x) && Number.isFinite(y) ? {x, y} : null;
}

export function loadXWaylandPointerPosition({
  bridgePath = DEFAULT_BRIDGE_PATH,
  createWorker = (url, options) => new Worker(url, options),
} = {}) {
  let position = null;
  let worker;

  try {
    worker = createWorker(WORKER_URL, {
      workerData: {bridgePath},
      execArgv: process.execArgv.filter((argument) => !argument.startsWith('--input-type')),
    });
    worker.on('message', (nextPosition) => {
      position = normalizePosition(nextPosition);
    });
    worker.on('error', () => {
      position = null;
    });
    worker.unref();
  } catch (_error) {
    return Object.assign(() => null, {close() {}});
  }

  return Object.assign(
    () => position,
    {close: () => worker.terminate()},
  );
}

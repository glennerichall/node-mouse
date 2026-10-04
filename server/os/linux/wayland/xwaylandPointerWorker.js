import {createRequire} from 'node:module';
import {parentPort, workerData} from 'node:worker_threads';

const require = createRequire(import.meta.url);

try {
  const bridge = require(workerData.bridgePath);
  const publishPosition = () => parentPort.postMessage(bridge.getPosition());
  publishPosition();
  setInterval(publishPosition, 80);
} catch (_error) {
  parentPort.postMessage(null);
}

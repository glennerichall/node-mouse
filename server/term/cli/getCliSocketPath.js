import {getCliSocketAdapter} from '../cliSocket.js';

export function getCliSocketPath() {
  return getCliSocketAdapter().getCliSocketPath();
}

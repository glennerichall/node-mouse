import os from 'os';
import { createLinuxHostNotifier } from './createLinuxHostNotifier.js';
import { createNodeNotifierHostNotifier } from './createNodeNotifierHostNotifier.js';

export function createHostNotifierByPlatform(platform = os.platform()) {
  const fallbackNotifier = createNodeNotifierHostNotifier();
  if (platform === 'linux') {
    return createLinuxHostNotifier({ fallbackNotifier });
  }
  return fallbackNotifier;
}

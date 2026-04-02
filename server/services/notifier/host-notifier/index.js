import os from 'os';
import { createLinuxHostNotifier } from './linux-host-notifier.js';
import { createNodeNotifierHostNotifier } from './node-notifier-host.js';

export function createHostNotifierByPlatform(platform = os.platform()) {
  const fallbackNotifier = createNodeNotifierHostNotifier();
  if (platform === 'linux') {
    return createLinuxHostNotifier({ fallbackNotifier });
  }
  return fallbackNotifier;
}

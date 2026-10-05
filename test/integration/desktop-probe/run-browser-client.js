import {spawnSync} from 'node:child_process';

export function runBrowserClient(probe, {token, assertPreview = false} = {}) {
  const {JEST_WORKER_ID: _jestWorkerId, ...environment} = process.env;
  Object.assign(environment, {
    REMOTE_MOUSE_VM_URL: probe.baseUrl(),
    ...(token ? {REMOTE_MOUSE_VM_TOKEN: token} : {}),
    ...(assertPreview ? {REMOTE_MOUSE_VM_ASSERT_PREVIEW: 'true'} : {}),
  });
  const result = spawnSync('npx', ['playwright', 'test', '--config=playwright.vm.config.js'], {
    cwd: probe.repositoryRoot,
    encoding: 'utf8',
    env: environment,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0 || !output.includes('1 passed')) {
    throw new Error(`Shared browser integration scenario failed\n${output}`);
  }
  return output;
}

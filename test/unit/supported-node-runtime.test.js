import {
  assertSupportedNodeRuntime,
  isSupportedNodeVersion,
  MINIMUM_NODE_VERSION,
} from '../../server/services/persistence/assertSupportedNodeRuntime.js';

describe('supported Node.js runtime', () => {
  it('requires Node.js 22.14.0, the first supported Node-API 10 runtime', () => {
    expect(isSupportedNodeVersion('22.13.0')).toBe(false);
    expect(isSupportedNodeVersion('22.14.0')).toBe(true);
    expect(isSupportedNodeVersion('24.0.0')).toBe(true);
    expect(isSupportedNodeVersion('invalid')).toBe(false);
    expect(() => assertSupportedNodeRuntime('22.13.0')).toThrow(
      `Node.js ${MINIMUM_NODE_VERSION} or newer is required by better-sqlite3 13 (Node-API 10); detected Node.js 22.13.0.`,
    );
  });
});

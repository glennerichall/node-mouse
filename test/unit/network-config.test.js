import {normalizeBaseUrl} from '../../server/utils/network.js';
import {normalizeSystemConfig} from '../../server/services/config/system-config.js';

describe('network configuration', () => {
  it('normalizes a public base URL without a trailing slash', () => {
    expect(normalizeBaseUrl('https://remote.example.test/')).toBe('https://remote.example.test');
  });

  it('rejects credentials and query parameters in the public URL', () => {
    expect(() => normalizeBaseUrl('https://user:pass@example.test')).toThrow(/absolute HTTP/);
    expect(() => normalizeBaseUrl('https://example.test/?token=secret')).toThrow(/absolute HTTP/);
  });

  it('requires the public URL protocol to match HTTPS configuration', () => {
    expect(() => normalizeSystemConfig({
      https: {enabled: false},
      publicBaseUrl: 'https://remote.example.test',
      entryPath: {}, session: {}, persistence: {},
    })).toThrow(/must use http/);
  });
});

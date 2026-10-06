import {getClientId, getClientLabel} from '../../server/connection/client-channel.js';

describe('client channel contract helpers', () => {
  it('normalizes the channel identifier and log label', () => {
    const channel = {id: 'abcdef123456'};

    expect(getClientId(channel)).toBe('abcdef123456');
    expect(getClientLabel(channel)).toBe('abcdef12');
  });

  it('provides a safe identifier for an incomplete adapter', () => {
    expect(getClientId()).toBe('unknown');
    expect(getClientLabel({})).toBe('unknown');
  });
});

import {
  isLocalAddress,
  resolveClientAddress,
} from '../../server/utils/clientAddress.js';

function request(remoteAddress, forwardedFor = '') {
  return {
    headers: forwardedFor ? {'x-forwarded-for': forwardedFor} : {},
    socket: {remoteAddress},
  };
}

describe('resolveClientAddress', () => {
  it.each([
    ['IPv4', '10.0.0.8'],
    ['IPv6', '2001:db8::8'],
  ])('uses the direct %s peer when proxy trust is disabled', (_family, address) => {
    expect(resolveClientAddress(request(address, '127.0.0.1'))).toBe(address);
  });

  it.each([
    ['IPv4', '192.0.2.15', '127.0.0.1'],
    ['IPv6', '2001:db8::15', '::1'],
  ])('uses the forwarded %s client behind a trusted loopback proxy', (_family, client, proxy) => {
    expect(resolveClientAddress(request(proxy, client), 'loopback')).toBe(client);
  });

  it('stops at the first untrusted proxy in a forwarded chain', () => {
    expect(resolveClientAddress(
      request('127.0.0.1', '127.0.0.1, 198.51.100.20'),
      'loopback',
    )).toBe('198.51.100.20');
  });
});

describe('isLocalAddress', () => {
  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])(
    'recognizes the loopback address %s',
    (address) => expect(isLocalAddress(address)).toBe(true),
  );
});

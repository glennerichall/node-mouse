import {createRateLimiter} from '../../server/connection/security/createRateLimiter.js';

describe('createRateLimiter', () => {
  it('limits a key until its window expires, independently per key', () => {
    let timestamp = 1000;
    const limiter = createRateLimiter({limit: 2, windowMs: 100, now: () => timestamp});

    expect(limiter.consume('device-a').allowed).toBe(true);
    expect(limiter.consume('device-a').allowed).toBe(true);
    expect(limiter.consume('device-a')).toEqual({allowed: false, remaining: 0, retryAfterMs: 100});
    expect(limiter.consume('device-b').allowed).toBe(true);

    timestamp += 100;
    expect(limiter.consume('device-a').allowed).toBe(true);
  });
});

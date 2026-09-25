import {jest} from '@jest/globals';
import {
  createHttpErrorMiddleware,
  HTTP_JSON_BODY_LIMIT_BYTES,
} from '../../server/connection/api/http-input.middleware.js';

describe('HTTP input middleware', () => {
  it('sets a bounded JSON body limit', () => {
    expect(HTTP_JSON_BODY_LIMIT_BYTES).toBe(32 * 1024);
  });

  it.each([
    [{type: 'entity.too.large', message: 'private payload'}, 413, 'Corps de requête trop volumineux.'],
    [{type: 'entity.parse.failed', message: 'private payload'}, 400, 'Corps de requête invalide.'],
    [{message: 'private payload'}, 500, 'Erreur interne.'],
  ])('returns a generic response for parser/server errors', (error, statusCode, message) => {
    const log = {warn: jest.fn()};
    const middleware = createHttpErrorMiddleware({log});
    const res = {status: jest.fn().mockReturnThis(), json: jest.fn()};

    middleware(error, {requestId: 'request-1'}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledWith({ok: false, message});
    expect(JSON.stringify(log.warn.mock.calls)).not.toContain('private payload');
  });
});

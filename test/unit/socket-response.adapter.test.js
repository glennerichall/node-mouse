import {jest} from '@jest/globals';
import {createSocketResponse} from '../../server/connection/socket/socket-response.adapter.js';

describe('socket response adapter', () => {
  it('uses status 200 by default and ends through send', () => {
    const acknowledge = jest.fn();
    const response = createSocketResponse(acknowledge);

    expect(response.statusCode).toBe(200);
    expect(response.status(201)).toBe(response);
    response.send({ok: true});
    response.end({ignored: true});

    expect(response.statusCode).toBe(201);
    expect(acknowledge).toHaveBeenCalledWith({ok: true});
  });

  it('implements sendStatus with an HTTP status message', () => {
    const acknowledge = jest.fn();
    const response = createSocketResponse(acknowledge);

    response.sendStatus(204);

    expect(response.statusCode).toBe(204);
    expect(acknowledge).toHaveBeenCalledWith('No Content');
  });
});

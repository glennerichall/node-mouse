import {createSseService} from '../../server/services/sse/createSseService.js';

describe('sse service', () => {
  it('buffers matching events until a client connects', () => {
    const service = createSseService();
    const id = service.createSubscription({
      filters: {
        service: 'config',
      },
    });

    service.emit({
      name: 'config.changed',
      service: 'config',
      type: 'config.updated',
      payload: {
        changedKeys: ['logging.level'],
      },
    });

    const writes = [];
    const req = {
      on: (_event, _listener) => {},
    };
    const res = {
      setHeader: () => {},
      flushHeaders: () => {},
      write: (chunk) => writes.push(chunk),
      end: () => {},
    };

    expect(service.connect(id, req, res)).toBe(true);
    expect(writes).toEqual([
      'retry: 3000\n\n',
      'event: config.changed\ndata: {"changedKeys":["logging.level"]}\n\n',
    ]);
  });
});

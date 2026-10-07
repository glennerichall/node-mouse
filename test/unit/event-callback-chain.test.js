import {jest} from '@jest/globals';
import {createEventCallbackChain} from '../../server/services/transport/createEventCallbackChain.js';

describe('transport-neutral event callback chain', () => {
  it('passes payload and response through each callback after next', () => {
    const response = jest.fn();
    const first = jest.fn((_payload, _response, next) => next());
    const second = jest.fn();
    const listener = createEventCallbackChain([first, second]);

    listener({value: 1}, response);

    expect(first).toHaveBeenCalledWith({value: 1}, response, expect.any(Function));
    expect(second).toHaveBeenCalledWith({value: 1}, response, expect.any(Function));
  });

  it('delegates callback errors to the transport adapter', () => {
    const onError = jest.fn();
    const second = jest.fn();
    const listener = createEventCallbackChain([
      (_payload, _response, next) => next(new Error('blocked')),
      second,
    ], onError);

    listener({});

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(second).not.toHaveBeenCalled();
  });

  it('rejects an empty or invalid chain', () => {
    expect(() => createEventCallbackChain([])).toThrow(TypeError);
    expect(() => createEventCallbackChain([undefined])).toThrow(TypeError);
  });
});

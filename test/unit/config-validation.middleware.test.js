import {jest} from '@jest/globals';
import {validateConfigPatch} from '../../server/connection/api/guards/config-validation.guard.js';

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('config validation middleware', () => {
  it('passes a converted valid value to the route', () => {
    const req = {params: {configId: 'preview.fps'}, body: {value: '12'}};
    const res = createResponse();
    const next = jest.fn();

    validateConfigPatch(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.configPatch).toEqual(expect.objectContaining({
      pathKey: 'preview.fps',
      value: 12,
    }));
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects unknown payload fields before reaching the route', () => {
    const req = {params: {configId: 'preview.fps'}, body: {value: 12, extra: true}};
    const res = createResponse();
    const next = jest.fn();

    validateConfigPatch(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects values outside the field schema', () => {
    const req = {params: {configId: 'preview.fps'}, body: {value: 0}};
    const res = createResponse();
    const next = jest.fn();

    validateConfigPatch(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes null as the reset operation', () => {
    const req = {params: {configId: 'preview.fps'}, body: {value: null}};
    const res = createResponse();
    const next = jest.fn();

    validateConfigPatch(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.configPatch.value).toBeNull();
  });
});

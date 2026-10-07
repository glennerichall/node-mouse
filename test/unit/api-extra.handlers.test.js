import {jest} from '@jest/globals';
import {
  connectAdminSubscription,
  createAdminConfigSubscription,
  deleteAdminSubscription,
} from '../../server/connection/api/handlers/admin-subs.handlers.js';
import {getRemoteStatus} from '../../server/connection/api/handlers/remotes.handlers.js';

function response() {
  const res = {status: jest.fn(), json: jest.fn(), end: jest.fn()};
  res.status.mockReturnValue(res);
  return res;
}

describe('admin subscription handlers', () => {
  it('creates a configuration subscription', () => {
    const createSubscription = jest.fn(() => 'sub-1');
    const res = response();
    createAdminConfigSubscription({services: {getSseService: () => ({createSubscription})}}, res);
    expect(createSubscription).toHaveBeenCalledWith({filters: {service: 'config'}});
    expect(res.json).toHaveBeenCalledWith({ok: true, id: 'sub-1', eventsUrl: '/api/admin/subs/sub-1'});
  });

  it('reports missing and deletes subscriptions', () => {
    const connect = jest.fn(() => false);
    const deleteSubscription = jest.fn(() => true);
    const req = {params: {id: ' sub-1 '}, services: {getSseService: () => ({connect, deleteSubscription})}};
    const res = response();
    connectAdminSubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    deleteAdminSubscription(req, res);
    expect(deleteSubscription).toHaveBeenCalledWith('sub-1');
    expect(res.json).toHaveBeenCalledWith({ok: true});
  });
});

describe('remote status handler', () => {
  it('returns disabled Samsung status without querying power', async () => {
    const getPowerState = jest.fn();
    const res = response();
    await getRemoteStatus({params: {remoteId: 'samsung'}, services: {
      getConfig: () => ({samsungTv: {enabled: false}}),
      getRemotes: () => ({samsung: {getPowerState}}),
    }}, res);
    expect(getPowerState).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({remoteId: 'samsung', enabled: false, power: 'disabled'});
  });
});

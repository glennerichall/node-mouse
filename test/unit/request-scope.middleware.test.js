import sinon from 'sinon';
import {createRequestScopeMiddleware} from '../../server/connection/api/request-scope.middleware.js';

describe('createRequestScopeMiddleware', () => {
  it('creates an isolated request facade and lazily binds shared providers', () => {
    const firstSecurityScope = {request: 'first'};
    const secondSecurityScope = {request: 'second'};
    const forHttpRequest = sinon.stub();
    forHttpRequest.onCall(0).returns(firstSecurityScope);
    forHttpRequest.onCall(1).returns(secondSecurityScope);
    const getSecurity = sinon.stub().returns({forHttpRequest});
    const services = {getSecurity, sharedMarker: {value: true}};
    const middleware = createRequestScopeMiddleware(services);
    const firstRequest = {};
    const secondRequest = {};
    const next = sinon.stub();

    middleware(firstRequest, {}, next);
    middleware(secondRequest, {}, next);

    expect(firstRequest.services).not.toBe(services);
    expect(secondRequest.services).not.toBe(services);
    expect(firstRequest.services.sharedMarker).toBe(services.sharedMarker);
    expect(firstRequest.requestId).toEqual(expect.any(String));
    expect(secondRequest.requestId).not.toBe(firstRequest.requestId);
    expect(next.calledTwice).toBe(true);
    expect(getSecurity.called).toBe(false);

    expect(firstRequest.services.getSecurity()).toBe(firstSecurityScope);
    expect(firstRequest.services.getSecurity()).toBe(firstSecurityScope);
    expect(secondRequest.services.getSecurity()).toBe(secondSecurityScope);
    expect(forHttpRequest.firstCall.args[0]).toBe(firstRequest);
    expect(forHttpRequest.secondCall.args[0]).toBe(secondRequest);
    expect(getSecurity.calledTwice).toBe(true);
  });
});

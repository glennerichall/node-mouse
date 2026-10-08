import express from 'express';
import {jest} from '@jest/globals';
import {socketRouter} from '../../server/init/routers/socket.router.js';

function createTestServices() {
    return {
        getConfig: () => ({browser: {enabled: true}, preview: {enabled: true}, vlc: {enabled: true}}),
        getSystemConfig: () => ({adminActionsEnabled: true}),
        getAuthorization: () => ({authorize: () => ({allowed: true})}),
        getInputController: () => ({
            mouse: {
                click: jest.fn(),
                setButtonState: jest.fn(),
                scroll: jest.fn(),
            },
            keyboard: {
                typeText: jest.fn(),
                pressSpecialKey: jest.fn(),
            },
        }),
        getRemotes: () => ({
            adminActions: {
                forceUpdateCheck: jest.fn().mockResolvedValue({ok: true, message: 'checked'}),
                installUpdate: jest.fn().mockResolvedValue({ok: true, message: 'installed'}),
                restartService: jest.fn().mockResolvedValue({ok: true, message: 'restarted'}),
                openServerInfoBrowserServer: jest.fn().mockResolvedValue({ok: true, message: 'opened'}),
            },
            browser: {focusOrLaunchBrowser: jest.fn().mockResolvedValue(true)},
            preview: {
                isAvailable: jest.fn(() => true),
                startForSocket: jest.fn(() => ({stop: jest.fn()})),
            },
            qrActions: {
                openQrBrowserServer: jest.fn().mockResolvedValue({ok: true, message: 'opened'}),
                rotateEntryToken: jest.fn().mockResolvedValue({ok: true, message: 'rotated'}),
                toggleQrOverlay: jest.fn().mockResolvedValue({ok: true, message: 'toggled'}),
            },
            samsung: {
                turnOn: jest.fn().mockResolvedValue({ok: true}),
                turnOff: jest.fn().mockResolvedValue({ok: true}),
                volumeUp: jest.fn().mockResolvedValue({ok: true}),
                volumeDown: jest.fn().mockResolvedValue({ok: true}),
                mute: jest.fn().mockResolvedValue({ok: true}),
                switchInput: jest.fn().mockResolvedValue({ok: true}),
                confirm: jest.fn().mockResolvedValue({ok: true}),
                switchToPcInput: jest.fn().mockResolvedValue({ok: true}),
            },
            vlc: {
                isAvailable: jest.fn().mockResolvedValue(true),
                focusOrLaunch: jest.fn().mockResolvedValue(true),
                toggleWindow: jest.fn().mockResolvedValue(true),
                closeWindow: jest.fn().mockResolvedValue(true),
            },
            windowActions: {
                toggleMaximizeMinimize: jest.fn().mockResolvedValue(true),
                closeActiveWindow: jest.fn().mockResolvedValue(true),
            },
        }),
    };
}

describe('action routers over HTTP transport', () => {
    let app;

    function createResponse(resolve) {
        const response = {
            statusCode: 200,
            headers: {},
            body: undefined,
            locals: {},
            headersSent: false,
            writableEnded: false,
            setHeader(name, value) {
                this.headers[name.toLowerCase()] = value;
            },
            getHeader(name) {
                return this.headers[name.toLowerCase()];
            },
            removeHeader(name) {
                delete this.headers[name.toLowerCase()];
            },
            status(code) {
                this.statusCode = code;
                return this;
            },
            send(body) {
                this.body = body;
                this.headersSent = true;
                this.writableEnded = true;
                resolve(this);
                return this;
            },
            end(body) {
                this.body = body;
                this.headersSent = true;
                this.writableEnded = true;
                resolve(this);
                return this;
            },
            on() {
                return this;
            },
            once() {
                return this;
            },
        };
        return response;
    }

    function request(method, path, body = {}) {
        return new Promise((resolve, reject) => {
            const req = {
                method,
                url: `/transport${path}`,
                originalUrl: `/transport${path}`,
                headers: {},
                body,
            };
            const response = createResponse(resolve);
            app.handle(req, response, error => error ? reject(error) : resolve(response));
        });
    }

    beforeAll(() => {
        app = express();
        const services = createTestServices();
        app.use((request, _response, next) => {
            request.services = services;
            request.socket = {id: 'http-client', securityContext: {}};
            request.log = {info: jest.fn(), warn: jest.fn()};
            next();
        });
        app.use('/transport', socketRouter);
        app.use((_request, response) => response.status(404).end());
    });

    it.each([
        ['POST', '/mouse/clicks', {button: 'left'}, 200],
        ['POST', '/keyboard/texts', {text: 'hello'}, 200],
        ['POST', '/browser/sessions', {browserId: 'firefox'}, 201],
        ['POST', '/preview/sessions', {}, 201],
        ['POST', '/qr/entry-token', {}, 201],
        ['GET', '/admin/update', {}, 200],
        ['PATCH', '/samsung/power', {state: 'on'}, 200],
        ['POST', '/vlc/window', {}, 201],
        ['PATCH', '/window', {}, 200],
    ])('%s %s is mountable and returns the expected status', async (method, path, body, expectedStatus) => {
        const response = await request(method, path, body);

        expect(response.statusCode).toBe(expectedStatus);
    });

    it('supports resource deletion with a 204 response', async () => {
        const response = await request('DELETE', '/preview/sessions');
        expect(response.statusCode).toBe(204);
        expect(response.body).toBeUndefined();
    });

    it('rejects an unknown mounted domain over HTTP', async () => {
        const response = await request('POST', '/unknown/resource');
        expect(response.statusCode).toBe(404);
    });
});

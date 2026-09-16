import {jest} from '@jest/globals';
import {bindBrowserRemoteButtons} from '../../client/ui/main/bindings/bindBrowserRemoteButtons.js';

class FakeElement extends EventTarget {
  constructor() {
    super();
    this.children = [];
    this.dataset = {};
    this._textContent = '';
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  get textContent() {
    return this._textContent;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute() {}
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return {promise, resolve};
}

function createDom() {
  const createButton = () => new FakeElement();
  return {
    remotes: {
      mouse: {touchpad: null},
      browser: {
        browserLaunchers: new FakeElement(),
        btnBrowserBack: createButton(),
        btnBrowserForward: createButton(),
        btnPrevTab: createButton(),
        btnNextTab: createButton(),
        btnNewTab: createButton(),
        btnCloseTab: createButton(),
        btnAddressBar: createButton(),
        btnHardReload: createButton(),
        btnFullscreen: createButton(),
        btnVideoPlayPause: createButton(),
        btnVideoMute: createButton(),
        btnVideoFullscreen: createButton(),
      },
    },
  };
}

describe('browser remote buttons', () => {
  let previousDocument;

  beforeEach(() => {
    previousDocument = global.document;
    global.document = {
      createElement: () => new FakeElement(),
    };
  });

  afterEach(() => {
    global.document = previousDocument;
  });

  it('ignores an obsolete launcher response after preferences change', async () => {
    const firstLoad = deferred();
    const secondLoad = deferred();
    const getAvailableBrowsers = jest.fn()
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(secondLoad.promise);
    let browserVisibilityListener;
    const visibility = {firefox: true, chrome: true};
    const dom = createDom();
    const services = {
      getTransport: () => ({emit: jest.fn()}),
      getClientConfig: () => ({onChange: jest.fn()}),
      getConfigView: () => ({
        getBrowserConfig: () => ({enabled: true}),
      }),
      getAppState: () => ({
        get: (key) => visibility[key.split('.')[2]] !== false,
        subscribeProperty: (_key, listener) => {
          browserVisibilityListener = listener;
        },
      }),
      getBackend: () => ({getAvailableBrowsers}),
    };

    bindBrowserRemoteButtons(services, dom);
    visibility.firefox = false;
    browserVisibilityListener();

    const browsers = {
      browsers: [
        {id: 'firefox', name: 'Firefox'},
        {id: 'chrome', name: 'Chrome'},
      ],
    };
    secondLoad.resolve(browsers);
    await Promise.resolve();
    expect(dom.remotes.browser.browserLaunchers.children).toHaveLength(1);

    firstLoad.resolve(browsers);
    await Promise.resolve();
    expect(dom.remotes.browser.browserLaunchers.children).toHaveLength(1);
    expect(dom.remotes.browser.browserLaunchers.children[0].dataset.browserId).toBe('chrome');
  });
});

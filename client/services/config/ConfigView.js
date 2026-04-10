import {DEFAULT_CLIENT_CONFIG} from './defaultClientConfig.js';

export class ConfigView {
    #config;

    constructor(config) {
        this.#config = config || {};
    }

    #getSection(name, fallback) {
        return this.#config?.[name] || fallback;
    }

    getSection(name, fallback) {
        return this.#getSection(name, fallback);
    }

    getInputConfig() {
        return this.#getSection('input', DEFAULT_CLIENT_CONFIG.input);
    }

    getSamsungConfig() {
        return this.#getSection('samsungTv', {});
    }

    getPreviewConfig() {
        return this.#getSection('preview', DEFAULT_CLIENT_CONFIG.preview);
    }

    getVlcConfig() {
        return this.#getSection('vlc', DEFAULT_CLIENT_CONFIG.vlc);
    }

    getBrowserConfig() {
        return this.#getSection('browser', DEFAULT_CLIENT_CONFIG.browser);
    }

    getKeyboardConfig() {
        return this.#getSection('keyboard', DEFAULT_CLIENT_CONFIG.keyboard);
    }

    getSystemConfig() {
        return this.#getSection('system', DEFAULT_CLIENT_CONFIG.system);
    }
}

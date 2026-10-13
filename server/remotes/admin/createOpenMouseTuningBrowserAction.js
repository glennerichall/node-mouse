export function createOpenMouseTuningBrowserAction(services, options = {}) {
    const browser = options.browser;

    return async function openMouseTuningBrowser() {
        const config = services.getSystemConfig();
        const localTuningUrl = `${config.protocol}://127.0.0.1:${config.port}/ui/admin/mouse-tuning`;
        const ok = await browser.openUrlOnHost(localTuningUrl);

        return ok
            ? {ok: true, message: 'Page de calibration ouverte sur l’hôte.'}
            : {ok: false, message: "Impossible d'ouvrir la calibration sur l'hôte."};
    };
}

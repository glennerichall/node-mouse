import {Keys} from "samsung-tv-remote";

import {
    createSamsungResult,
    resolveConfiguredKey,
    resolveConfiguredKeysSequence,
    toSamsungErrorMessage,
} from "./utils.js";

export function createSamsungCommandService({config, getRemote, log}) {
    async function sendKey(key, successMessage) {
        try {
            const remote = await getRemote();
            await remote.sendKey(key);
            log.info({key}, 'Commande Samsung envoyee');
            return createSamsungResult(successMessage);
        } catch (error) {
            const message = toSamsungErrorMessage(error);
            log.warn({key, err: message}, 'Echec commande Samsung');
            return {
                ok: false,
                message: `TV Samsung indisponible: ${message}`,
            };
        }
    }

    async function sendKeys(keys, successMessage) {
        try {
            const remote = await getRemote();
            await remote.sendKeys(keys);
            log.info({keys}, 'Sequence Samsung envoyee');
            return createSamsungResult(successMessage);
        } catch (error) {
            const message = toSamsungErrorMessage(error);
            log.warn({keys, err: message}, 'Echec sequence Samsung');
            return {
                ok: false,
                message: `TV Samsung indisponible: ${message}`,
            };
        }
    }

    return {
        isEnabled() {
            return true;
        },
        async turnOn() {
            try {
                const remote = await getRemote();
                await remote.wakeTV();
                log.info('Wake-on-LAN Samsung envoye');
                return createSamsungResult("Demande d'allumage envoyee a la TV Samsung.");
            } catch (error) {
                const message = toSamsungErrorMessage(error);
                log.warn({err: message}, 'Echec allumage Samsung');
                return {
                    ok: false,
                    message: `Impossible d'allumer la TV Samsung: ${message}`,
                };
            }
        },
        async turnOff() {
            const powerOffKey = resolveConfiguredKey(config.powerOffKey);
            if (!powerOffKey) {
                return {
                    ok: false,
                    message: `Touche Samsung invalide pour l'extinction: ${config.powerOffKey}`,
                };
            }
            return sendKey(powerOffKey, "Demande d'extinction envoyee a la TV Samsung.");
        },
        async volumeUp() {
            return sendKey(Keys.KEY_VOLUP, 'Volume Samsung augmente.');
        },
        async volumeDown() {
            return sendKey(Keys.KEY_VOLDOWN, 'Volume Samsung diminue.');
        },
        async switchInput() {
            return sendKey(Keys.KEY_SOURCE, 'Changement de source Samsung demande.');
        },
        async confirm() {
            return sendKey(Keys.KEY_ENTER, 'Validation Samsung envoyee.');
        },
        async switchToPcInput() {
            const configuredSequence = resolveConfiguredKeysSequence(config.pcInputSequence);
            if (configuredSequence.length) {
                if (configuredSequence.some((key) => !key)) {
                    return {
                        ok: false,
                        message: `Sequence Samsung invalide pour l'entree PC: ${config.pcInputSequence}`,
                    };
                }
                return sendKeys(
                    configuredSequence,
                    `Bascule Samsung vers l'entree PC via sequence ${config.pcInputSequence}.`,
                );
            }

            const configuredKey = resolveConfiguredKey(config.pcInputKey);
            if (!configuredKey) {
                return {
                    ok: false,
                    message: `Touche Samsung invalide pour l'entree PC: ${config.pcInputKey}`,
                };
            }
            return sendKey(configuredKey, `Bascule Samsung vers ${config.pcInputKey}.`);
        },
    };
}

import {Keys} from "samsung-tv-remote";

import {
    createSamsungResult,
    resolveConfiguredKey,
    resolveConfiguredKeysSequence,
    toSamsungErrorMessage,
} from "./utils.js";

export function createSamsungCommandService({getConfig, discoverDevices, getSamsungTv, getLogger, createDisabledRemote}) {
    let powerStateCache = {
        value: 'unknown',
        checkedAt: 0,
    };
    let powerStatePromise = null;

    function getEnabledRemote() {
        if (getConfig().enabled) {
            return null;
        }
        return createDisabledRemote?.();
    }

    function invalidatePowerState() {
        powerStateCache = {
            value: 'unknown',
            checkedAt: 0,
        };
    }

    async function computePowerState() {
        const disabledRemote = getEnabledRemote();
        if (disabledRemote) {
            return 'disabled';
        }

        try {
            const samsungTv = await getSamsungTv();
            return samsungTv.getPowerState();
        } catch (error) {
            getLogger().warn({err: error?.message || String(error)}, 'Etat Samsung indisponible');
            return 'unknown';
        }
    }

    async function getPowerState(options = {}) {
        const maxAgeMs = Number(options.maxAgeMs);
        const now = Date.now();
        if (Number.isFinite(maxAgeMs) && maxAgeMs >= 0 && (now - powerStateCache.checkedAt) <= maxAgeMs) {
            return powerStateCache.value;
        }

        if (!powerStatePromise) {
            powerStatePromise = computePowerState()
                .then((value) => {
                    powerStateCache = {
                        value,
                        checkedAt: Date.now(),
                    };
                    return value;
                })
                .finally(() => {
                    powerStatePromise = null;
                });
        }

        return powerStatePromise;
    }

    async function sendKey(key, successMessage) {
        const disabledRemote = getEnabledRemote();
        if (disabledRemote) {
            return disabledRemote.turnOn();
        }
        try {
            const samsungTv = await getSamsungTv();
            await samsungTv.sendKey(key);
            invalidatePowerState();
            getLogger().info({key}, 'Commande Samsung envoyee');
            return createSamsungResult(successMessage);
        } catch (error) {
            const message = toSamsungErrorMessage(error);
            getLogger().warn({key, err: message}, 'Echec commande Samsung');
            return {
                ok: false,
                message: `TV Samsung indisponible: ${message}`,
            };
        }
    }

    async function sendKeys(keys, successMessage) {
        const disabledRemote = getEnabledRemote();
        if (disabledRemote) {
            return disabledRemote.turnOn();
        }
        try {
            const samsungTv = await getSamsungTv();
            await samsungTv.sendKeys(keys);
            invalidatePowerState();
            getLogger().info({keys}, 'Sequence Samsung envoyee');
            return createSamsungResult(successMessage);
        } catch (error) {
            const message = toSamsungErrorMessage(error);
            getLogger().warn({keys, err: message}, 'Echec sequence Samsung');
            return {
                ok: false,
                message: `TV Samsung indisponible: ${message}`,
            };
        }
    }

    return {
        isEnabled() {
            return Boolean(getConfig().enabled);
        },
        async getPowerState(options) {
            return getPowerState(options);
        },
        async discoverDevices() {
            return discoverDevices();
        },
        async turnOn() {
            const disabledRemote = getEnabledRemote();
            if (disabledRemote) {
                return disabledRemote.turnOn();
            }
            try {
                const samsungTv = await getSamsungTv();
                await samsungTv.wakeTV();
                invalidatePowerState();
                getLogger().info('Wake-on-LAN Samsung envoye');
                return createSamsungResult("Demande d'allumage envoyee a la TV Samsung.");
            } catch (error) {
                const message = toSamsungErrorMessage(error);
                getLogger().warn({err: message}, 'Echec allumage Samsung');
                return {
                    ok: false,
                    message: `Impossible d'allumer la TV Samsung: ${message}`,
                };
            }
        },
        async turnOff() {
            const disabledRemote = getEnabledRemote();
            if (disabledRemote) {
                return disabledRemote.turnOff();
            }
            const config = getConfig();
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
            const disabledRemote = getEnabledRemote();
            if (disabledRemote) {
                return disabledRemote.switchToPcInput();
            }
            const config = getConfig();
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

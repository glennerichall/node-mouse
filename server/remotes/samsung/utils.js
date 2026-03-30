import {Keys} from "samsung-tv-remote";

export function createDisabledSamsungRemote(reason) {
    return {
        isEnabled() {
            return false;
        },
        async turnOn() {
            return {ok: false, message: reason};
        },
        async turnOff() {
            return {ok: false, message: reason};
        },
        async volumeUp() {
            return {ok: false, message: reason};
        },
        async volumeDown() {
            return {ok: false, message: reason};
        },
        async switchInput() {
            return {ok: false, message: reason};
        },
        async confirm() {
            return {ok: false, message: reason};
        },
        async switchToPcInput() {
            return {ok: false, message: reason};
        },
    };
}

export function toSamsungErrorMessage(error) {
    return String(error?.message || error || 'Erreur Samsung inconnue');
}

export function createSamsungResult(message) {
    return {
        ok: true,
        message,
    };
}

export function resolveConfiguredKey(keyName) {
    return Keys[String(keyName || '').trim()] || null;
}

export function resolveConfiguredKeysSequence(sequence) {
    return String(sequence || '')
        .split(',')
        .map((entry) => String(entry || '').trim().toUpperCase())
        .filter(Boolean)
        .map((entry) => Keys[entry] || null);
}

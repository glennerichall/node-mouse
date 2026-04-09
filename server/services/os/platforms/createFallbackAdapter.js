export function createFallbackAdapter() {
    return {
        app: {
            async resolve() {
                return null;
            },
            async openOrFocus() {
                return false;
            },
            async toggleWindow() {
                return false;
            },
            async closeWindow() {
                return false;
            },
        },
        window: {
            async toggleActive() {
                return false;
            },
            async closeActive() {
                return false;
            },
        },
        url: {
            async open() {
                return false;
            },
        },
    };
}
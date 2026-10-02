export function createRobotJSDesktopController(robotJS) {
    const desktopController = {
        getCapabilities: () => ({
            adapter: 'robotjs',
            status: 'ready',
            pointer: true,
            keyboard: true,
            preview: true,
            reason: null,
        }),
        getMousePos: (...args) => robotJS.getMousePos(...args),
        moveMouse: (...args) => robotJS.moveMouse(...args),
        scrollMouse: (...args) => robotJS.scrollMouse(...args),
        mouseClick: (...args) => robotJS.mouseClick(...args),
        typeString: (...args) => robotJS.typeString(...args),
        keyTap: (...args) => robotJS.keyTap(...args),
        getScreenSize: (...args) => robotJS.getScreenSize(...args),
        screen: {
            capture: (...args) => robotJS.screen.capture(...args),
        },
    };

    for (const method of ['dragMouse', 'mouseToggle', 'setKeyboardDelay']) {
        if (typeof robotJS[method] === 'function') {
            desktopController[method] = (...args) => robotJS[method](...args);
        }
    }

    return desktopController;
}

import {clamp} from '../../../utils/math.js';
import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';

export function createMouseController(services) {
    const {
        getConfig
    } = services;

    let scrollRemainder = 0;
    let pressedButton = '';
    let lastScreenSize = null;
    let screenSizeOverride = null;

    function getInputConfig() {
        return getConfig().input || DEFAULT_PERSISTED_CONFIG.input;
    }

    function getScreenSize(screen) {
        const width = Number(screen?.width);
        const height = Number(screen?.height);
        const normalizedWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 1;
        const normalizedHeight = Number.isFinite(height) && height > 0 ? Math.round(height) : 1;
        return {
            width: normalizedWidth,
            height: normalizedHeight,
            maxX: getMaxCoordinate(normalizedWidth),
            maxY: getMaxCoordinate(normalizedHeight),
        };
    }

    function getMaxCoordinate(size) {
        const value = Number(size);
        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }
        return Math.max(0, Math.round(value) - 1);
    }

    function getCoordinate(value) {
        const coordinate = Number(value);
        return Number.isFinite(coordinate) ? coordinate : 0;
    }

    function hasScreenSizeChanged(a, b) {
        return Boolean(a && b && (a.width !== b.width || a.height !== b.height));
    }

    function scaleCoordinate(coordinate, previousMax, nextMax) {
        if (previousMax <= 0) {
            return clamp(Math.round(coordinate), 0, nextMax);
        }
        return clamp(Math.round((coordinate / previousMax) * nextMax), 0, nextMax);
    }

    function getCurrentPosition(current, screenSize) {
        if (hasScreenSizeChanged(lastScreenSize, screenSize)) {
            return {
                x: scaleCoordinate(
                    clamp(Math.round(getCoordinate(current.x)), 0, lastScreenSize.maxX),
                    lastScreenSize.maxX,
                    screenSize.maxX,
                ),
                y: scaleCoordinate(
                    clamp(Math.round(getCoordinate(current.y)), 0, lastScreenSize.maxY),
                    lastScreenSize.maxY,
                    screenSize.maxY,
                ),
            };
        }

        return {
            x: clamp(Math.round(getCoordinate(current.x)), 0, screenSize.maxX),
            y: clamp(Math.round(getCoordinate(current.y)), 0, screenSize.maxY),
        };
    }

    function rememberScreenSize(screenSize) {
        lastScreenSize = {
            width: screenSize.width,
            height: screenSize.height,
            maxX: screenSize.maxX,
            maxY: screenSize.maxY,
        };
    }

    async function getActiveScreenSize() {
        if (screenSizeOverride || lastScreenSize) {
            return getScreenSize(screenSizeOverride || lastScreenSize);
        }

        return getScreenSize(await services.getSystem().getScreenInfo());
    }

    function setScreenSizeOverride(screen) {
        screenSizeOverride = getScreenSize(screen);
        rememberScreenSize(screenSizeOverride);
    }

    async function move(dx, dy) {
        const robot = services.getRobot();
        const inputConfig = getInputConfig();
        const mouseSpeed = Number(inputConfig.mouseSpeed) || DEFAULT_PERSISTED_CONFIG.input.mouseSpeed;
        const screenSize = await getActiveScreenSize();
        const current = robot.getMousePos();
        const position = getCurrentPosition(current, screenSize);
        rememberScreenSize(screenSize);
        const nextX = clamp(Math.round(position.x + dx * mouseSpeed), 0, screenSize.maxX);
        const nextY = clamp(Math.round(position.y + dy * mouseSpeed), 0, screenSize.maxY);
        if (pressedButton === 'left' && typeof robot.dragMouse === 'function') {
            robot.dragMouse(nextX, nextY);
            return;
        }
        robot.moveMouse(nextX, nextY);
    }

    function remapToScreenSize(previousScreen, nextScreen) {
        const robot = services.getRobot();
        const previousScreenSize = getScreenSize(previousScreen);
        const nextScreenSize = getScreenSize(nextScreen);
        const current = robot.getMousePos();
        const nextX = scaleCoordinate(
            clamp(Math.round(getCoordinate(current.x)), 0, previousScreenSize.maxX),
            previousScreenSize.maxX,
            nextScreenSize.maxX,
        );
        const nextY = scaleCoordinate(
            clamp(Math.round(getCoordinate(current.y)), 0, previousScreenSize.maxY),
            previousScreenSize.maxY,
            nextScreenSize.maxY,
        );
        screenSizeOverride = nextScreenSize;
        rememberScreenSize(nextScreenSize);
        robot.moveMouse(nextX, nextY);
    }

    function scroll(deltaY) {
        const robot = services.getRobot();
        const inputConfig = getInputConfig();
        const scrollSpeed = Number(inputConfig.scrollSpeed) || DEFAULT_PERSISTED_CONFIG.input.scrollSpeed;
        const total = -deltaY * scrollSpeed + scrollRemainder;
        const amount = total > 0 ? Math.floor(total) : Math.ceil(total);
        scrollRemainder = total - amount;
        if (amount !== 0) {
            robot.scrollMouse(0, amount);
        }
    }

    function click(button) {
        const robot = services.getRobot();
        const mouseButton = button === 'right' ? 'right' : 'left';
        robot.mouseClick(mouseButton);
    }

    function setButtonState(button, state) {
        const robot = services.getRobot();
        const mouseButton = button === 'right' ? 'right' : 'left';
        const nextState = state === 'down' ? 'down' : 'up';
        if (typeof robot.mouseToggle === 'function') {
            robot.mouseToggle(nextState, mouseButton);
        } else if (nextState === 'up') {
            robot.mouseClick(mouseButton);
        }

        if (nextState === 'down') {
            pressedButton = mouseButton;
        } else if (pressedButton === mouseButton) {
            pressedButton = '';
        }
    }

    return {
        move,
        scroll,
        click,
        setButtonState,
        remapToScreenSize,
        setScreenSizeOverride,
        updateConfig() {
            return getInputConfig();
        }
    };
}

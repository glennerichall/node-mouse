import {createKeyboardController} from './createKeyboardController.js';
import {createMouseController} from './createMouseController.js';

export function createInputController(services) {
    
    const mouse = createMouseController(services);
    const keyboard = createKeyboardController(services);
    
    return {
        mouse,
        keyboard,
        updateConfig() {
            mouse.updateConfig();
            keyboard.updateConfig();
        }
    };
}

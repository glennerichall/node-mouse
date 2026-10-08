import {
    REMOTE_EVENT_KEYBOARD_KEY,
    REMOTE_EVENT_KEYBOARD_TEXT,
    REMOTE_EVENT_MOUSE_BUTTON,
    REMOTE_EVENT_MOUSE_CLICK,
    REMOTE_EVENT_MOUSE_MOVE,
    REMOTE_EVENT_MOUSE_SCROLL,
} from '../../../utils/remoteCommands.js';
import {createMouseMoveDispatcher} from '../../services/input/createMouseMoveDispatcher.js';
import Router from 'router';

const moves = new WeakMap();
const getInput = (request) => request.services.getInputController();
const getMove = (request, mouse) => {
    let move = moves.get(request.socket);
    if (!move) {
        move = createMouseMoveDispatcher(mouse);
        moves.set(request.socket, move);
    }
    return move;
};
export const inputRouter = Router()
    .post(`/${REMOTE_EVENT_MOUSE_MOVE}`, async (request, _response, next) => {
        const {mouse} = getInput(request);
        await getMove(request, mouse)(request.body);
        next();
    })
    .post(`/${REMOTE_EVENT_MOUSE_CLICK}`, (request, _response, next) => {
        getInput(request).mouse.click(request.body.button);
        next();
    })
    .post(`/${REMOTE_EVENT_MOUSE_BUTTON}`, (request, _response, next) => {
        getInput(request).mouse.setButtonState(request.body.button, request.body.state);
        next();
    })
    .post(`/${REMOTE_EVENT_MOUSE_SCROLL}`, (request, _response, next) => {
        getInput(request).mouse.scroll(Number(request.body.dy) || 0);
        next();
    })
    .post(`/${REMOTE_EVENT_KEYBOARD_TEXT}`, (request, _response, next) => {
        getInput(request).keyboard.typeText(request.body.text);
        next();
    })
    .post(`/${REMOTE_EVENT_KEYBOARD_KEY}`, (request, _response, next) => {
        getInput(request).keyboard.pressSpecialKey(request.body.key, request.body.modifiers);
        next();
    });

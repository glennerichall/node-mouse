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
export const mouseRouter = Router()
    .post(`/move`, async (request, _response, next) => {
        const {mouse} = getInput(request);
        await getMove(request, mouse)(request.body);
        next();
    })
    .post(`/click`, (request, _response, next) => {
        getInput(request).mouse.click(request.body.button);
        next();
    })
    .post(`/button`, (request, _response, next) => {
        getInput(request).mouse.setButtonState(request.body.button, request.body.state);
        next();
    })
    .post(`/scroll`, (request, _response, next) => {
        getInput(request).mouse.scroll(Number(request.body.dy) || 0);
        next();
    })
export const keyboardRouter = Router()
    .post(`/text`, (request, _response, next) => {
        getInput(request).keyboard.typeText(request.body.text);
        next();
    })
    .post(`/key`, (request, _response, next) => {
        getInput(request).keyboard.pressSpecialKey(request.body.key, request.body.modifiers);
        next();
    });
